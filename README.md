# MemoryGarden 🌱

MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow on the canvas—never rushed, never noisy, always yours.

**Production:** [memorygarden.vercel.app](https://memorygarden.vercel.app)

## What is MemoryGarden?

Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through stages as you visit and reflect.
- **Reflect emotions** — AI-assisted tone hints shape variety and color.
- **Encourage reflection** — Notes and optional Garden AI prompts when you revisit.
- **Create connections** — Spatial proximity and clustering surface themes.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season.

## Features

### Plant & tend

- Upload a photo, write about the moment, and plant it on the canvas.
- **Garden Boost** (standard) is free; Premium / Legendary fertilizer and the Starlight cosmetic pack use **Stripe Checkout** (entitlements apply after webhook verification).

### Views

Garden canvas, Walk mode (open world), Timeline, Clusters, Bloom Wall, optional community gardens.

### Data & privacy

Local-first by default. Optional Neon Auth sign-in, cloud metadata sync, and AI proxy. Draft legal pages: `/privacy`, `/terms`, `/refunds`.

## Technical architecture

- **React 19 + TypeScript**, **Vite**, Tailwind, Framer Motion, Radix UI
- **Persistence:** `useKV` / IndexedDB (`@/lib/storage`) per local user
- **AI:** `POST /api/llm` (Vercel Edge → Anthropic when configured)
- **Sync:** `POST/GET /api/sync` → Vercel KV (metadata only; no photo blobs)
- **Payments:** `/api/payments/*` — Stripe Checkout + webhooks → KV entitlements
- **Auth:** optional Neon Auth; production cutover requires JWT for sync and purchases (`docs/GO_LIVE.md`)

Sub-project: **Volatility Sentinel** (`volatility-sentinel/`) — standalone Python example, not part of the Vite app.

## Getting started

### Prerequisites

- Node.js **22+** (see `package.json` `engines`)
- **pnpm** 9 (`packageManager` field)

### Install & dev

```bash
git clone https://github.com/kwizzlesurp10-ctrl/memorygarden.git
cd memorygarden
pnpm install --frozen-lockfile
pnpm run dev
```

### Quality gates

```bash
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
```

## Deployment

Hosted on **Vercel** (static SPA + Edge functions). See:

- [PAYMENTS.md](./PAYMENTS.md) — Stripe SKUs and env vars
- [docs/GO_LIVE.md](./docs/GO_LIVE.md) — live Stripe + auth checklist
- [SALE_READINESS.md](./SALE_READINESS.md) — operator transfer packet

## License

MIT — see [LICENSE](./LICENSE) (includes GitHub Spark template copyright notice).

---

Take your time. Let your memories grow. 🌺