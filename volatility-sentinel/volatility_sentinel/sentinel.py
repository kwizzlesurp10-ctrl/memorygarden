from __future__ import annotations

import asyncio
import logging
import time

import httpx

from volatility_sentinel.config import Settings
from volatility_sentinel.db import (
    ensure_schema,
    fetch_window_stats,
    insert_snapshot,
    prune_old,
)
from volatility_sentinel.prices import (
    compute_intra_range_volatility_pct,
    fetch_simple_prices,
)

logger = logging.getLogger(__name__)


async def send_webhook(webhook_url: str, text: str, client: httpx.AsyncClient) -> None:
    payload = {"content": text[:2000]}
    response = await client.post(webhook_url, json=payload, timeout=15.0)
    response.raise_for_status()


class VolatilitySentinel:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._last_alert_at: dict[str, float] = {}
        self._http: httpx.AsyncClient | None = None
        self._lock = asyncio.Lock()
        self.consecutive_errors = 0
        self.last_poll_at: float | None = None
        self.last_error: str | None = None
        self.last_volatility_pct: dict[str, float | None] = {}

    async def setup(self) -> None:
        await ensure_schema(self.settings.database_path)

    async def _get_http(self) -> httpx.AsyncClient:
        if self._http is None:
            self._http = httpx.AsyncClient(headers={"Accept": "application/json"})
        return self._http

    async def close(self) -> None:
        if self._http is not None:
            await self._http.aclose()
            self._http = None

    async def poll_once(self) -> None:
        async with self._lock:
            client = await self._get_http()
            now = time.time()
            window_sec = float(self.settings.window_minutes * 60)
            retention = max(window_sec * 4, 86400.0)

            try:
                prices = await fetch_simple_prices(
                    client,
                    coin_ids=self.settings.coin_ids,
                    vs_currency=self.settings.vs_currency,
                )
            except (httpx.HTTPError, ValueError, TypeError, KeyError) as exc:
                self.consecutive_errors += 1
                self.last_error = str(exc)
                logger.exception("CoinGecko fetch failed")
                return

            self.last_error = None
            self.consecutive_errors = 0
            self.last_poll_at = now

            for cid, price in prices.items():
                await insert_snapshot(
                    self.settings.database_path,
                    coin_id=cid,
                    vs_currency=self.settings.vs_currency,
                    price=price,
                    captured_at=now,
                )

            await prune_old(
                self.settings.database_path,
                older_than_seconds=retention,
                now=now,
            )

            threshold = self.settings.volatility_threshold_pct
            cooldown = float(self.settings.alert_cooldown_seconds)

            for cid in self.settings.coin_ids:
                price = prices.get(cid)
                if price is None:
                    continue

                mn, mx, count = await fetch_window_stats(
                    self.settings.database_path,
                    coin_id=cid,
                    vs_currency=self.settings.vs_currency,
                    window_seconds=window_sec,
                    now=now,
                )

                vol_pct: float | None = None
                if mn is not None and mx is not None and count >= 2:
                    vol_pct = compute_intra_range_volatility_pct(mn, mx)
                self.last_volatility_pct[cid] = vol_pct

                if vol_pct is None or vol_pct < threshold:
                    continue

                last_alert = self._last_alert_at.get(cid, 0.0)
                if cooldown > 0 and (now - last_alert) < cooldown:
                    logger.info(
                        "Volatility %.2f%% for %s exceeds threshold but cooldown active.",
                        vol_pct,
                        cid,
                    )
                    continue

                msg = (
                    f"[Volatility Sentinel] {cid.upper()} swing ~{vol_pct:.2f}% "
                    f"over last {self.settings.window_minutes} min "
                    f"(threshold {threshold:.2f}%). Current ~${price:,.4f} "
                    f"{self.settings.vs_currency.upper()}."
                )
                logger.warning(msg)

                self._last_alert_at[cid] = now

                if self.settings.webhook_url:
                    try:
                        await send_webhook(self.settings.webhook_url, msg, client)
                    except httpx.HTTPError:
                        logger.exception("Webhook delivery failed")

    async def run_loop(self, stop_event: asyncio.Event) -> None:
        await self.setup()
        interval = self.settings.poll_interval_seconds
        while not stop_event.is_set():
            await self.poll_once()
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=float(interval))
            except asyncio.TimeoutError:
                continue
