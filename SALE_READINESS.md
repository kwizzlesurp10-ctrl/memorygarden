# MemoryGarden — Sale readiness packet

**Repository:** https://github.com/kwizzlesurp10-ctrl/memorygarden  
**Production URL:** https://memorygarden.vercel.app (do not redirect; browser-local data is origin-bound)  
**License:** MIT with `Copyright GitHub, Inc.` header from GitHub Spark template provenance — MIT does not grant exclusive ownership; buyer needs assignment/trademark work separately.

**Recommended posture (evidence-based):** **Disclosed development asset / early operating app** — build and tests pass after remediation branch, but revenue, active paying users, retention, and live payment volume are **unknown** (not verified zero). Not “production-ready” in the enterprise sense without identity, legal review, and ops metrics.

---

## Verified locally (this branch)

Commands run on Ubuntu, Node v22.x, `pnpm install --frozen-lockfile`:

| Check | Main @ 5d37e9c (PR #192) | This branch |
|-------|--------------------------|-------------|
| `pnpm run build` | Pass | Pass (agent) |
| `pnpm run typecheck` | Pass | Pass (agent) |
| `pnpm run lint` | 0 errors | 0 errors (agent) |
| `pnpm test` | **667 pass** | **679 pass** (+12 regression tests) |
| `pnpm audit` | **44** (5 low / 19 moderate / 20 high) | **17** (1 low / 4 moderate / 12 high) after Vite 8.3.6, Vitest 4.1.12, `undici>=8.10.2` override |

CI (`.github/workflows/ci.yml`) uses **pnpm** and **Node 22** per PR #192. Vercel install/build commands use pnpm frozen lockfile (`vercel.json`).

---

## Environment variables (names only)

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | `/api/llm` proxy |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Sync, entitlements, Stripe idempotency, LLM rate limit |
| `DATABASE_URL` | Community gardens (Neon) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Checkout + webhooks |
| `STRIPE_PRICE_*` (per SKU) | See `PAYMENTS.md` |
| `KV_*` / Stripe | Required together for paid feature fulfillment |

---

## Deployment (transfer steps)

1. **GitHub:** Transfer repo or invite buyer; preserve commit history and `LICENSE` as-is. Document Spark/GitHub template lineage.
2. **Vercel:** Transfer project `memorygarden.vercel.app`; export env var *names* and re-enter values in buyer account (never commit secrets).
3. **Vercel KV:** Transfer or recreate store; keys `mg:user:*`, `mg:entitlements:*`, `mg:stripe:event:*`, `mg:llm:rate:*`.
4. **Neon:** Transfer Postgres or provide connection string + schema backup (community tables).
5. **Stripe:** Transfer account or rotate to buyer Stripe; update webhook URL and price env vars; replay test events in test mode only.
6. **Anthropic:** Buyer API key.

---

## External services inventory

- Vercel (static + Edge functions)
- Vercel KV (Upstash-compatible REST)
- Neon serverless Postgres (optional)
- Stripe Checkout + webhooks
- Anthropic API (optional)
- Third-party CDNs/fonts per CSP in `vercel.json`

---

## Backup & recovery

| Mechanism | Includes media | Overwrite behavior |
|-----------|----------------|-------------------|
| Browser localStorage / IndexedDB | Yes (on device) | N/A |
| Cloud sync `/api/sync` | **No** (stripped) | Last-write-wins per userId |
| **Backup & restore** (menu) | Yes when IDB blobs readable | Import **merges**; never overwrites existing memory ids |
| Export garden (PNG/booklet) | Visual export only | N/A |

Format: `src/lib/garden-backup.ts` — `version: 1` JSON schema with optional `media` map.

---

## Audit findings (Nov 7, 2026) — reverified

| # | Status | Notes |
|---|--------|-------|
| 1 Quality gates | **Changed** | Tests pass (658); TSC/lint failed, now addressed. Worker `webidl` issue **not reproduced**. CI Node 20 vs tooling ≥22 — **align CI**. |
| 2 Local ids / API trust | **Changed** | Still browser-local ids; **strict id validation** (`api/lib/api-ids.ts`) on sync/gardens/payments. No cryptographic identity — documented. |
| 3 Community visibility | **Confirmed → fixed** | Filtering used `visibility` but SQL omitted column — **added**; logic extracted to `api/gardens/lib/community-memory-privacy.ts` + tests. |
| 4 LLM auth / rate limit | **Changed** | Still no user auth; **KV rate limit** added when KV configured (`api/llm-rate-limit.ts`). |
| 5 Stripe | **Changed** | Webhook unchanged; **GET entitlements** requires Checkout `sessionId`; **consume** requires matching `stripeSessionId`. Client checkout return flow already supplies session id. |
| 6 Backup / export label | **Changed** | Versioned backup UI + module; export PDF option **labeled PNG booklet** (`ExportGarden.tsx`). Cloud sync still excludes media. |
| 7 Privacy / SECURITY | **Changed** | Replaced template `SECURITY.md`; added `docs/PRIVACY.md`. |
| 8 License | **Confirmed** | `LICENSE` = MIT, GitHub, Inc. — investigate assignment; do not remove notice. |
| 9 Brand | **Owner decision** | Separate “MemoryGarden” businesses may exist — trademark clearance required. |

---

## Owner decisions (not implemented — would need identity, spend, or breaking changes)

1. **Authentication** (OAuth, passkeys, email magic link) tying KV/entitlements to verified users.
2. **Strong community auth** — membership checks added for mutating routes, but still trust caller `userId` (see #1).
3. **Encrypt** KV/DB at rest or per-user encryption keys.
4. **Production Stripe** live mode confirmation, MRR/churn export, tax/VAT, refund policy.
5. **Trademark / brand** clearance and optional rename.
6. **Privacy policy & ToS** counsel-approved pages linked in app footer.
7. **`pnpm audit` remainder** — **12 high / 4 moderate / 1 low** after safe bumps/overrides (mostly dev transitive: `brace-expansion`, `minimatch`, `postcss`, `nanoid`, `browserslist`, `source-map-js`, `zod` validation DoS). Major bumps deferred to avoid tooling churn.
8. **Revenue/traffic claims** for marketplace — supply real analytics; agent did not verify.

---

## Asset transfer checklist for buyer

- [ ] Clone repo; run install, typecheck, lint, test, build
- [ ] Obtain Vercel + env secrets
- [ ] Confirm Stripe webhook delivery logs
- [ ] Export Neon schema/data if community feature matters
- [ ] Test backup JSON round-trip on staging origin
- [ ] Review `docs/PRIVACY.md` and `SECURITY.md`
- [ ] Confirm MIT + Spark attribution acceptable

---

## Remaining risks

- Spoofed `userId` can still read/write **sync** KV and can act as a garden member if they know ids — format checks ≠ auth.
- Entitlement **listing by userId alone** removed; guessing session ids is harder but checkout session ids remain URL-visible on return.
- LLM endpoint is a cost-abuse surface when KV is unset.
- Large JS bundle (three.js walk mode) — monitor Vercel limits.
- Public MIT repo — forks allowed; exclusivity requires separate IP agreement.
