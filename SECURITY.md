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

End users are identified by a **browser-generated local profile** (`src/lib/local-user.ts`), not by server-authenticated accounts. API routes validate **format** of caller-supplied ids (`api/lib/api-ids.ts`) but still do not cryptographically prove identity.

**Owner decision:** Adding real authentication (OAuth, magic link, etc.) is required before treating cloud sync or entitlements as multi-tenant secure against id guessing.

## API notes

- **`/api/sync`** — Last-write-wins per `userId`. Shared user-id validation (`api/sync.ts`, `api/lib/api-ids.ts`). No possession proof.
- **`/api/gardens`** — GET validates UUID garden ids and optional `viewerId`. POST join/plant/water/reflect/leave enforce id format, public-garden join rules for non-owners, and **membership (or ownership) checks** before mutating community data (`api/gardens/lib/garden-access.ts`). Caller-supplied user ids are still trusted once format checks pass.
- **`/api/llm`** — Proxies to Anthropic; optional KV rate limit (~60 requests/hour/IP when KV is configured). No end-user auth (`api/llm.ts`, `api/llm-rate-limit.ts`).
- **`/api/payments/webhook`** — Stripe signature verification and event idempotency via KV (`api/payments/webhook.ts`). Checkout metadata includes client-chosen `userId`.
- **`GET /api/payments/entitlements`** — Requires valid `userId` **and** a Stripe Checkout `sessionId` (`cs_test_` / `cs_live_`); returns only entitlements tied to that session (`api/payments/lib/entitlements-access.ts`).
- **`POST /api/payments/consume`** — Requires `stripeSessionId` matching the entitlement record (`api/payments/consume.ts`).

## Dependency audit

Run `pnpm audit` in CI or before releases. As of the server-hardening branch: direct bumps to **Vite 8.3.6** and **Vitest 4.1.12**, plus a pnpm **undici** override, reduced reported issues versus main; remaining findings are mostly transitive (dev tooling chains). See `SALE_READINESS.md` for counts and residual packages.

## Reporting issues

For production deployments you control, route reports to your support contact. This repository inherited a generic GitHub template license header; maintainers should publish a **product-specific** contact before a sale.

## Safe handling

- Never commit `.env`, Stripe keys, or webhook secrets.
- Use Stripe test mode and CLI forwarding for payment testing (`PAYMENTS.md`).
- Do not copy real user journals into tests, fixtures, or logs.
