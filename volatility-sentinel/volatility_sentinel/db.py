from __future__ import annotations

import time
from pathlib import Path

import aiosqlite

SCHEMA = """
CREATE TABLE IF NOT EXISTS price_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coin_id TEXT NOT NULL,
    vs_currency TEXT NOT NULL,
    price REAL NOT NULL,
    captured_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snapshots_coin_time
ON price_snapshots(coin_id, captured_at);
"""


async def ensure_schema(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(db_path) as db:
        await db.execute(SCHEMA)
        await db.commit()


async def insert_snapshot(
    db_path: Path,
    *,
    coin_id: str,
    vs_currency: str,
    price: float,
    captured_at: float | None = None,
) -> None:
    ts = captured_at if captured_at is not None else time.time()
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            "INSERT INTO price_snapshots (coin_id, vs_currency, price, captured_at) "
            "VALUES (?, ?, ?, ?)",
            (coin_id, vs_currency, price, ts),
        )
        await db.commit()


async def fetch_window_stats(
    db_path: Path,
    *,
    coin_id: str,
    vs_currency: str,
    window_seconds: float,
    now: float | None = None,
) -> tuple[float | None, float | None, int]:
    """Returns (min_price, max_price, count) in window."""
    t = now if now is not None else time.time()
    since = t - window_seconds
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT MIN(price), MAX(price), COUNT(*) FROM price_snapshots "
            "WHERE coin_id = ? AND vs_currency = ? AND captured_at >= ?",
            (coin_id, vs_currency, since),
        )
        row = await cursor.fetchone()
        await cursor.close()
    if row is None or row[2] == 0:
        return None, None, 0
    return float(row[0]), float(row[1]), int(row[2])


async def prune_old(
    db_path: Path,
    *,
    older_than_seconds: float,
    now: float | None = None,
) -> None:
    t = now if now is not None else time.time()
    cutoff = t - older_than_seconds
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            "DELETE FROM price_snapshots WHERE captured_at < ?",
            (cutoff,),
        )
        await db.commit()
