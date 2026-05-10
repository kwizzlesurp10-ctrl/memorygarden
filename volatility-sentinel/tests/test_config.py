from __future__ import annotations

from pathlib import Path

import volatility_sentinel.config as cfg


def test_load_settings_defaults(tmp_path: Path, monkeypatch: object) -> None:
    monkeypatch.setenv("COIN_IDS", "bitcoin,solana")
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "sentinel.db"))

    s = cfg.load_settings()
    assert s.coin_ids == ("bitcoin", "solana")
    assert s.vs_currency == "usd"
    assert str(s.database_path) == str((tmp_path / "sentinel.db").resolve())
