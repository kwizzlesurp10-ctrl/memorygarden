# MemoryGarden — Security

MemoryGarden is a client-first journaling app with optional Vercel Edge APIs (cloud sync, community gardens, LLM proxy, Stripe webhooks). This document describes the current threat model for operators and buyers — not a certification.

## Data locations

| Data | Where it lives |
|------|----------------|
| Memories, preferences, local profile | Browser `localStorage` (per-device), namespaced by local user id |
| Photos / audio (large) | Browser IndexedDB (`memorygarden-photos`) with `idb://` references in memory records |
| Optional cloud sync payload | Vercel KV key `mg:user:<userId>` — **text/metadata only**; photos/audio are stripped client-side |
| Community garden content | Neon Postgres (when `DATABASE_URL` is set) |
| Purchase entitlements | Vercel KV key `mg:entitlements:<userId>` |
| Stripe secrets / Anthropic key | Vercel environment variables only |

## Identity model (important)

End users are identified by a **browser-generated local profile** (`src/lib/local-user.ts`), not by server-authenticated accounts. API routes that accept `userId`, `contributorId`, or similar fields **validate format only** — they do not prove ownership. Anyone who knows or guesses a user id can read/write that user's KV sync bucket or query entitlements.

**Owner decision:** Adding real authentication (OAuth, magic link, etc.) is required before treating cloud sync or entitlements as multi-tenant secure.

## API notes

- **`/api/sync`** — Last-write-wins per `userId`. No auth beyond id format check (`api/sync.ts`).
- **`/api/gardens`** — Community actions trust caller-supplied user ids for join/plant/water (`api/gardens.ts`).
- **`/api/llm`** — Proxies to Anthropic; optional KV rate limit (~60 requests/hour/IP when KV is configured). No end-user auth (`api/llm.ts`, `api/llm-rate-limit.ts`).
- **`/api/payments/webhook`** — Stripe signature verification and event idempotency via KV (`api/payments/webhook.ts`). Checkout metadata includes `userId` chosen client-side.
- **`GET /api/payments/entitlements`** — Returns entitlements for any valid `userId` query param.

## Reporting issues

For production deployments you control, route reports to your support contact. This repository inherited a generic GitHub template license header; maintainers should publish a **product-specific** contact before a sale.

## Safe handling

- Never commit `.env`, Stripe keys, or webhook secrets.
- Use Stripe test mode and CLI forwarding for payment testing (`PAYMENTS.md`).
- Do not copy real user journals into tests, fixtures, or logs.
