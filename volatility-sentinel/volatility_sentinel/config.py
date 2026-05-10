from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def _comma_ids(raw: str) -> tuple[str, ...]:
    parts = tuple(c.strip().lower() for c in raw.split(",") if c.strip())
    if not parts:
        raise ValueError("COIN_IDS must list at least one CoinGecko id.")
    return parts


def _positive_float(key: str, default: float) -> float:
    raw = os.environ.get(key)
    if raw is None or raw == "":
        return default
    value = float(raw)
    if value <= 0:
        raise ValueError(f"{key} must be positive.")
    return value


def _positive_int(key: str, default: int) -> int:
    raw = os.environ.get(key)
    if raw is None or raw == "":
        return default
    value = int(raw)
    if value <= 0:
        raise ValueError(f"{key} must be a positive integer.")
    return value


@dataclass(frozen=True, slots=True)
class Settings:
    coin_ids: tuple[str, ...]
    vs_currency: str
    poll_interval_seconds: int
    volatility_threshold_pct: float
    window_minutes: int
    database_path: Path
    webhook_url: str | None
    alert_cooldown_seconds: int


def load_settings() -> Settings:
    coin_raw = os.environ.get("COIN_IDS", "bitcoin")
    vs = (os.environ.get("VS_CURRENCY") or "usd").strip().lower()
    db_raw = os.environ.get("DATABASE_PATH", "data/sentinel.db")
    webhook = os.environ.get("WEBHOOK_URL", "").strip() or None

    return Settings(
        coin_ids=_comma_ids(coin_raw),
        vs_currency=vs,
        poll_interval_seconds=max(10, _positive_int("POLL_INTERVAL_SECONDS", 60)),
        volatility_threshold_pct=_positive_float("VOLATILITY_THRESHOLD_PCT", 2.5),
        window_minutes=max(1, _positive_int("WINDOW_MINUTES", 15)),
        database_path=Path(db_raw).expanduser().resolve(),
        webhook_url=webhook,
        alert_cooldown_seconds=max(0, _positive_int("ALERT_COOLDOWN_SECONDS", 300)),
    )
