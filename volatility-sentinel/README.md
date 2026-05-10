# Volatility Sentinel

Minimal **production-shaped** agent that polls [CoinGecko](https://www.coingecko.com/en/api/documentation) for spot prices, persists samples in **SQLite**, estimates **intra-window volatility** as the high–low swing relative to the midpoint over a configurable lookback, and **alerts** via logs and an optional **Discord** webhook. A **FastAPI** service exposes **health** and **status** endpoints.

## Agent Design Canvas (mapping)

| Section | This project |
|--------|----------------|
| **Objective** | Flag large short-term price swings vs a threshold; expose ops visibility via HTTP. |
| **Environment** | CoinGecko public API rate limits; single-process; local SQLite. |
| **Capabilities** | HTTP fetch, persist rows, compute window stats, console + optional webhook. |
| **Loop** | Poll → store → aggregate window → compare → alert (with cooldown). |
| **Memory** | Time series in `price_snapshots`; old rows pruned. |
| **Guardrails** | Alert cooldown; bounded error string on `/status`; webhook payload capped. |
| **Deploy / observability** | Uvicorn + `/health`, `/status` with last error and per-coin volatility. |


Over the last **W** minutes, each poll stores a snapshot. Volatility **%** is the high–low range divided by **mid-price** `(min + max) / 2`, times 100. Adjust `VOLATILITY_THRESHOLD_PCT` accordingly.
## Requirements

- Python **3.11+**
- Network access to `api.coingecko.com` (and Discord if using a webhook)

## Setup

```bash
cd volatility-sentinel
python3.11 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env — set COIN_IDS, thresholds, optional WEBHOOK_URL
```

Create a Discord webhook: Server Settings → Integrations → Webhooks → Copy URL → paste into `WEBHOOK_URL`.

## Run

```bash
cd volatility-sentinel
source .venv/bin/activate
uvicorn volatility_sentinel.main:app --host 0.0.0.0 --port 8000
```

- Health: [`http://localhost:8000/health`](http://localhost:8000/health)
- Status: [`http://localhost:8000/status`](http://localhost:8000/status)

Logs print **WARNING** lines when volatility exceeds the threshold (and when cooldown suppresses repeats).

## Configuration (environment)

| Variable | Meaning |
|---------|---------|
| `COIN_IDS` | Comma-separated CoinGecko **coin ids** (see [coins list](https://api.coingecko.com/api/v3/coins/list)). |
| `VS_CURRENCY` | Quote currency, e.g. `usd`. |
| `POLL_INTERVAL_SECONDS` | Seconds between polls (use **≥30** on free CoinGecko to avoid 429s). |
| `VOLATILITY_THRESHOLD_PCT` | Alert when window volatility ≥ this value. |
| `WINDOW_MINUTES` | Lookback window for min/max price. |
| `DATABASE_PATH` | SQLite path (directory created automatically). |
| `WEBHOOK_URL` | Optional Discord webhook URL. |
| `ALERT_COOLDOWN_SECONDS` | Min time between alerts for the same coin. |

## Tests

```bash
cd volatility-sentinel
source .venv/bin/activate
pytest -q
```

## Limitations

- CoinGecko free tier: respect intervals and expect occasional rate limits; the service records `last_error` on `/status`.
- Volatility is a **simple range metric**; it is not GARCH or realized variance.
- Webhook support is tuned for **Discord** (`content` JSON field); adapt for Telegram if needed.

## License

Same as the parent repository unless stated otherwise.
