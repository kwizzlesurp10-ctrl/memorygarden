from __future__ import annotations

import httpx

COINGECKO_SIMPLE_URL = "https://api.coingecko.com/api/v3/simple/price"


async def fetch_simple_prices(
    client: httpx.AsyncClient,
    *,
    coin_ids: tuple[str, ...],
    vs_currency: str,
    timeout_seconds: float = 30.0,
) -> dict[str, float]:
    ids_param = ",".join(coin_ids)
    response = await client.get(
        COINGECKO_SIMPLE_URL,
        params={
            "ids": ids_param,
            "vs_currencies": vs_currency,
        },
        timeout=timeout_seconds,
    )
    response.raise_for_status()
    payload: object = response.json()
    if not isinstance(payload, dict):
        raise ValueError("Unexpected CoinGecko response shape.")

    out: dict[str, float] = {}
    vs_key = vs_currency
    for cid in coin_ids:
        entry = payload.get(cid)
        if not isinstance(entry, dict):
            raise ValueError(f"Missing price for coin id: {cid}")
        raw = entry.get(vs_key)
        if not isinstance(raw, (int, float)):
            raise ValueError(f"Invalid numeric price for {cid}")
        out[cid] = float(raw)
    return out


def compute_intra_range_volatility_pct(min_price: float, max_price: float) -> float:
    if min_price <= 0 or max_price <= 0:
        raise ValueError("Prices must be positive.")
    if min_price > max_price:
        min_price, max_price = max_price, min_price
    midpoint = (min_price + max_price) / 2.0
    if midpoint <= 0:
        return 0.0
    return (max_price - min_price) / midpoint * 100.0
