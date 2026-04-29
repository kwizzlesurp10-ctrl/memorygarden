"""Volatility Sentinel — FastAPI app and background polling."""

from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from pydantic import BaseModel, Field

from volatility_sentinel import __version__
from volatility_sentinel.config import Settings, load_settings
from volatility_sentinel.sentinel import VolatilitySentinel


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )


configure_logging()


class RuntimeState:
    def __init__(self) -> None:
        self.settings: Settings | None = None
        self.sentinel: VolatilitySentinel | None = None
        self.stop_event: asyncio.Event | None = None
        self.bg_task: asyncio.Task[None] | None = None


state = RuntimeState()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    settings = load_settings()
    state.settings = settings
    sentinel = VolatilitySentinel(settings)
    state.sentinel = sentinel
    stop_event = asyncio.Event()
    state.stop_event = stop_event

    async def runner() -> None:
        await sentinel.setup()
        while not stop_event.is_set():
            await sentinel.poll_once()
            try:
                await asyncio.wait_for(
                    stop_event.wait(),
                    timeout=float(settings.poll_interval_seconds),
                )
            except asyncio.TimeoutError:
                continue

    state.bg_task = asyncio.create_task(runner(), name="volatility-sentinel-loop")
    yield

    stop_event.set()
    if state.bg_task is not None:
        await state.bg_task
    await sentinel.close()
    state.sentinel = None
    state.bg_task = None


app = FastAPI(
    title="Volatility Sentinel",
    version=__version__,
    description="Minimal crypto volatility monitor via CoinGecko + SQLite.",
    lifespan=lifespan,
)


@app.get("/health")
async def health() -> dict[str, str]:
    """Liveness probe: process is running."""
    return {"status": "ok"}


class StatusResponse(BaseModel):
    ok: bool
    version: str
    consecutive_errors: int = Field(ge=0)
    last_poll_at: float | None = None
    last_error: str | None = None
    coins: dict[str, float | None] = Field(
        default_factory=dict,
        description="Latest computed intra-window volatility % per coin.",
    )
    settings_summary: dict[str, object]


@app.get("/status", response_model=StatusResponse)
async def status() -> StatusResponse:
    """Operational snapshot including last volatility estimate per tracked coin."""
    sentinel = state.sentinel
    settings = state.settings

    ok = sentinel is None or sentinel.last_error is None
    consecutive = sentinel.consecutive_errors if sentinel else 0

    coins: dict[str, float | None] = {}
    if sentinel is not None:
        coins = dict(sentinel.last_volatility_pct)
        if settings is not None:
            for cid in settings.coin_ids:
                coins.setdefault(cid, None)

    summary: dict[str, object] = {}
    if settings is not None:
        summary = {
            "coin_ids": list(settings.coin_ids),
            "vs_currency": settings.vs_currency,
            "poll_interval_seconds": settings.poll_interval_seconds,
            "volatility_threshold_pct": settings.volatility_threshold_pct,
            "window_minutes": settings.window_minutes,
            "alert_cooldown_seconds": settings.alert_cooldown_seconds,
            "webhook_configured": bool(settings.webhook_url),
            "database_path": str(settings.database_path),
        }

    return StatusResponse(
        ok=ok,
        version=__version__,
        consecutive_errors=consecutive,
        last_poll_at=sentinel.last_poll_at if sentinel else None,
        last_error=sentinel.last_error[:500] if sentinel and sentinel.last_error else None,
        coins=coins,
        settings_summary=summary,
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "service": "Volatility Sentinel",
        "health": "/health",
        "status": "/status",
    }
