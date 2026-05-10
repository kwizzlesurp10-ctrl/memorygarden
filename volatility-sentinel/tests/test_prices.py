from __future__ import annotations

from volatility_sentinel.prices import compute_intra_range_volatility_pct


def test_volatility_symmetric_midpoint() -> None:
    # midpoint 50, range 49..51 → 4% of mid
    v = compute_intra_range_volatility_pct(49.0, 51.0)
    assert round(v, 6) == 4.0


def test_volatility_normalized_order() -> None:
    a = compute_intra_range_volatility_pct(10.0, 20.0)
    b = compute_intra_range_volatility_pct(20.0, 10.0)
    assert round(a, 6) == round(b, 6)
