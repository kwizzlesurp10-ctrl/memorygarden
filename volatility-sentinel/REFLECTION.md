This note documents design choices for the Volatility Sentinel service and reflects on trade-offs worthy of critique in production.

**Design.** The objective was a small, observable loop: poll CoinGecko, persist samples, summarize each asset’s intra-window swing, compare to a threshold, and emit alerts without spamming. CoinGecko was chosen because it exposes a stable public “simple price” endpoint that fits free tiers when polling is disciplined (longer intervals, few assets). Persistence uses SQLite via `aiosqlite` so the same process can serve reads and writes without a separate DB service—appropriate for learning and modest single-machine deployment.

**Volatility metric.** Instead of annualized volatility or EWMA variance, we use the percentage range relative to mid-price inside a rolling minute window—intuitive for alerts (“how choppy was the last N minutes?”) and cheap to compute from min/max SQL aggregates. The trade-off is sensitivity to single bad ticks and that “volatility” here is range-based, not statistical.

**Operational shape.** FastAPI exposes `/health` for orchestrators and `/status` for humans and scripts: consecutive error count, truncated last API error string, configured thresholds, and the latest computed swing % per coin. The background worker runs in the lifespan context so polling stops cleanly on shutdown. An alert cooldown avoids duplicate Discord noise when volatility stays elevated.

**What I would improve next.** Structured logging (JSON) with request ids; exponential backoff specifically for HTTP 429; optional PostgreSQL when horizontal scaling matters; alerting on stale data (“no snapshot in M minutes”). For Discord, verifying webhook semantics under rate limits remains a practical follow-up.

**Lessons.** The agent’s “brain” is small: thresholds and persistence turn a script into something you can operate. Free APIs are a contract written in rate limits—design the poll interval and cardinality first.

**Failure handling.** Predictable failures (timeouts, malformed JSON, missing coins) propagate into `last_error` and increment a consecutive-error counter surfaced on `/status`, so operators can correlate logs with outages without attaching a heavyweight APM on day one. The trade-off is that we deliberately avoid swallowing exotic exceptions inside the poll loop—HTTP and parsing errors are the expected envelope—so unforeseen bugs might still crater a cycle until caught in logs.

**Async vs sync.** Fetching prices and writing snapshots use async SQLite and HTTP to keep one event loop coherent under Uvicorn. For this workload the win is cleanliness more than throughput; alternatively, a threaded blocking client would be acceptable at these poll rates.

**Portfolio angle.** Packaging as a subdirectory keeps the sentinel isolated from unrelated front-end work while still demonstrating environment-driven configuration, a durable store, HTTP surface, and a clear README that ties behavior back to an agent-design checklist. Hiring managers care less about jargon than about whether you measured something real and defended it under constraints.

**Testing stance.** Unit tests focus on pure math and configuration parsing—fast, deterministic, and enough to prevent silent regressions in the volatility formula and env wiring. Live CoinGecko calls are left to manual runs or future contract tests so CI stays reliable when the network is absent. That mirrors how small teams prioritize signal over spectacle.
