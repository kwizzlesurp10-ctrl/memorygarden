# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed on an infinite garden canvas, return to tend it with reflections, and watch it mature through organic growth stages—never rushed, never noisy, always yours. Everything defaults to **local-first** storage in your browser; optional cloud sync and community gardens stay under your control.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Memories advance `seed → sprout → seedling → young → bud → bloom → mature → elder` as you revisit and reflect; care and time are visible on the canvas.
- **Reflect emotions** — Text is classified into tones (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) that steer plant variety, OKLCH palettes, and growth character.
- **Encourage reflection** — Add reflections when you return; optional Garden AI offers gentle, poetic prompts without replacing your voice.
- **Create connections** — Spatial layout, cluster paths, and AI-suggested groupings surface themes across seasons of your life.
- **Cross-pollinate** — Link two parent memories to plant a **hybrid seed** with blended traits and bespoke SVG growth.
- **Adapt to seasons** — Day/night palettes, weather, and ambient layers follow real clock time and season so the garden feels tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored in IndexedDB), write about the moment, set a date, and place your memory on the canvas.
- **Tending**: Revisits and reflections advance growth; unlock currency and cosmetics reward consistent care.
- **Cross-pollination**: Start from one memory, pick a second parent, and plant a hybrid with merged genetics (`generateHybridTraits`).
- **Storage shed**: Stash hybrid seeds and manage planted hybrids without cluttering the main bed.
- **Dream a plant**: Generate hybrid genomes from a short prompt; seeds land in the shed until you plant them.
- **Fertilizer boost**: Garden Boost is free; **Premium** and **Legendary** tiers use Stripe Checkout—growth applies only after webhook-verified payment (see **[PAYMENTS.md](./PAYMENTS.md)**).

### 🔍 The Lens
- **Loupe magnifier**: Toggle a circular lens on the garden canvas; zoom **1.6×–4×** (default **2.4×**) with `+` / `−` controls (`src/lib/garden/lens.ts`).
- **Parallax & detail**: Cursor-driven parallax layers; click a plant under the lens for **GardenLensDetail** (hybrid growth strip, reflections, reactions).

### ✨ AI-Powered Insights
- **Emotional tone**: Classification via `getLLMProvider()` → `POST /api/llm` (Haiku for fast JSON classification).
- **Garden AI**: Sonnet-backed reflections that may include short text from nearby memories—never image bytes.
- **Memory clusters**: Thematic or temporal groupings for browsing by mood as well as place.
- **Gentle whispers**: Seasonal, social-care, and “on this day” nudges generated from your garden state (`generateGentleWhispers`).

### 🎨 Beautiful Views
- **Garden**: SVG scene with weather, cluster paths, day/night controls, and optional remembrance candles / dream-plant panels.
- **Walk**: First-person **open-world** layer (Three.js)—procedural plant anatomy, tone-themed beds, storage shed landmark, **Grove Project** milestone scenery (five tiers through 500 community waterings), **3D gifts** beside stems, privacy-aware visitor projection, minimap, and touch joystick on coarse pointers.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom wall**: Gallery spotlight for memories at full bloom.
- **Explore**: Browse and visit **community gardens** backed by `/api/gardens` when `DATABASE_URL` is configured.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Invites, members panel, activity feed, and contributor leaderboard for shared tending.
- **3D gifts**: Leave blossom notes, paper lanterns, dew vials, or wind chimes on a friend’s memory (`GardenGift` props in Walk).
- **Reactions & social**: Lightweight reactions on shared memories; cloud sync of metadata when KV is enabled.
- **Private sharing**: Link-based access for individual memories you choose to share; Walk supports **camouflage** and **sleeping seed** visitor modes via `privacy-engine` (wire sanitization strips self-reflections and masks private IDs).

### 🌓 Living Atmosphere
- **Day / night**: OKLCH palettes and lighting follow local time (manual override available in-garden).
- **Seasonal mood**: Weather effects and seasonal gradients track the calendar.
- **Ambient sound**: Optional audio layer keyed to time of day and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet).
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell and optional protocol registration.
- **Export**: Full-garden export from settings for a portable archive.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data. State lives in **`App.tsx`**; views compose canvas, modals, and lazy-loaded secondary screens (including **Walk** via `OpenWorldGarden` + Three.js).

### Frontend stack
| Layer | Choice |
| --- | --- |
| UI | React 19, TypeScript, Tailwind, Radix UI, Framer Motion |
| Build | Vite (dev **5173**, output **`dist/`**) |
| Persistence | `useKV` / `useMemoriesKV` — namespaced **localStorage** per `LocalUser`; photos & audio in **IndexedDB** |
| Validation | `ValidationResult<T>` discriminated unions in `src/lib/validation.ts` for memories, filters, and garden payloads |
| Colors | OKLCH-only palettes in `garden-helpers` and `theme.css` |
| Walk mode | `src/components/open-world/` — layout by emotional tone beds, WebGL engine, locomotion + HUD, `privacy-engine` for visitor-safe worlds |

### LLM client
`getLLMProvider()` (`src/lib/llm-client.ts`) resolves in order:
1. **HTTP** — `fetch('/api/llm')` (session-disables after `503`/`404` to avoid hammering)
2. **Spark** — `window.spark.llm` when hosted in a compatible GitHub Spark environment
3. **Static fallback** — empty completions so the garden never hard-crashes

Edge handler `api/llm.ts` maps `kind: 'classify'` → **claude-haiku-4-5-20251001**, `kind: 'reflect'` → **claude-sonnet-4-6** (prompt cap 4k chars).

### Edge API routes (Vercel)
| Route | Purpose | Env vars |
| --- | --- | --- |
| `POST /api/llm` | Anthropic proxy for tone + reflections | `ANTHROPIC_API_KEY` |
| `GET/POST /api/sync` | Per-user metadata blob (last-write-wins) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `GET/POST /api/gardens` | Public community gardens (Neon Postgres) | `DATABASE_URL` |
| `POST /api/payments/*` | Stripe Checkout, webhooks, entitlements | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price env vars (see **PAYMENTS.md**) |

Missing credentials return **`503`**; the UI degrades (no AI, local-only sync, explore disabled, paid boosts unavailable) without blocking core planting.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python FastAPI + SQLite example (CoinGecko volatility); run and test separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** (current LTS recommended)
- **npm** (ships with Node)
- Optional for full server features on Vercel: `ANTHROPIC_API_KEY`, KV credentials, `DATABASE_URL`, Stripe vars (see **Deployment**)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/kwizzlesurp10-ctrl/memorygarden.git
   cd memorygarden
   ```
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
   Matches `.npmrc` (`legacy-peer-deps`) for Vite 8 + `@vitejs/plugin-react-swc` peer ranges.

### Development
```bash
npm run dev
```
Vite dev server (default **http://localhost:5173**). Without `/api/llm`, AI buttons fall back gracefully; use `vercel dev` or deploy previews to exercise Edge routes locally.

### Production build
```bash
npm run build
```
Type-checks via the Vite/React pipeline and writes static assets to **`dist/`**.

### Quality checks
```bash
npm run lint
npm test
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** with Vite’s preview server.

### Testing
Vitest (**656** tests across **34** files) covers growth/stage math, lens geometry, open-world layout and locomotion, Grove milestone unlocks (five tiers), 3D gifts and gentle whispers, privacy / camouflage wire sanitization, Stripe entitlements, unlock currency, trait genetics, hybrid helpers, `ValidationResult` parsers, local-user migration, and `/api/llm` client wiring.

| Command | Purpose |
| --- | --- |
| `npm test` | Single CI-style run |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | v8 coverage report |

`src/lib/__tests__/app-garden-jsx.test.ts` additionally smoke-transforms `App.tsx` and `GardenCanvas.tsx` with Oxc to catch truncated-import regressions.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
Deploy on **Vercel** as a static SPA (`dist/`) plus **Edge handlers** under `api/`:

| Handler | Env | Behavior when unset |
| --- | --- | --- |
| **`api/llm.ts`** | `ANTHROPIC_API_KEY` | `503` — client disables HTTP LLM for the session |
| **`api/sync.ts`** | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `503` — header shows sync unavailable; data stays local |
| **`api/gardens.ts`** | `DATABASE_URL` (Neon serverless) | `503` — Explore / community garden APIs inactive |
| **`api/payments/*`** | Stripe keys, webhook secret, price IDs, KV for entitlements | Checkout and paid boosts unavailable |

**Stripe one-time purchases** — Fertilizer boosts (Premium / Legendary) and the optional Starlight cosmetic pack use **`/api/payments/*`** (Checkout + webhook fulfillment). See **[PAYMENTS.md](./PAYMENTS.md)** for Price IDs, webhook events, and all required env vars.

CI on **`main`**: `npm install --legacy-peer-deps` → `npm run build` → `npm test`. `.npmrc` pins **`legacy-peer-deps`** for Vite 8 compatibility.

The **Sync to cloud** control mirrors `useCloudSync` status and stops retrying after a `503`, so users are not told data is in the cloud when KV is missing.

### Privacy & data
- **Local-first**: Structured keys in scoped localStorage; photos/audio in IndexedDB. Nothing leaves the device except explicit sync, share links, community garden posts, or checkout flows you initiate.
- **AI payloads**: Text-only prompts (≤4k chars on Edge); reflections may reference neighboring memory **text**—never image bytes.
- **Walk privacy**: `privacy-engine` projects visitor worlds in **camouflage** (hide private plants + Poisson filler flora, zero public coordinate drift) or **sleeping seed** (private memories become redacted sprouts on the contemplation ring); wire helpers strip self-reflections and mask private activity IDs.
- **Export**: Settings → export full garden JSON for backup or migration.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Open-world Walk** — Deeper in-world interaction with memory plants, GPU performance on low-end devices, and richer gift placement / bond flows (building on Grove tiers and 3D props).
- **Community gardens** — Harden `/api/gardens` auth, moderation, and optimistic UI for plant/water/reflect actions at scale.
- **Collaboration** — Real-time presence, invitation flows, and conflict-safe merges for joint tending (beyond last-write-wins sync).
- **Hybrids & genetics** — Deeper shed inventory, hybrid breeding goals, and visual catalog tooling for new varieties.
- **Privacy modes** — Expand sanctuary-circle membership and sleeping-seed copy across 2D canvas and shared exports.
- **Export & print** — Higher-fidelity PDF/poster layouts from Bloom Wall and timeline exports.
- **Accessibility & i18n** — Full audit of canvas, Lens loupe, Walk controls, and keyboard paths; extract copy for translation.
- **Performance** — Canvas virtualization, open-world culling, shed/lens layering, and asset prioritization for gardens with **500+** plants.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured fields and IndexedDB for photos/audio. Optional **`/api/sync`** stores a JSON metadata blob per user in KV when credentials exist. Community garden content lives in Postgres only when you use Explore features against a deployed `DATABASE_URL`.

**Are photos sent to the AI?**  
No. `POST /api/llm` accepts text prompts only; reflections may include short text from nearby memories, never Base64 image data.

**What does HTTP 503 mean?**  
The Edge route is missing or not configured (`ANTHROPIC_API_KEY`, KV vars, `DATABASE_URL`, or Stripe). The app continues in local mode; LLM and sync clients back off for the session after the first `503`/`404`.

**Which models run in production?**  
`api/llm.ts` uses **Haiku** (`claude-haiku-4-5-20251001`) for classification and **Sonnet** (`claude-sonnet-4-6`) for richer reflections. GitHub Spark hosts may still use `window.spark.llm` via `getLLMProvider()`.

**How does The Lens zoom work?**  
The base garden stays at 1×; only the loupe overlay magnifies (**1.6×–4×**, step **0.2**). Use toolbar toggles or `+` / `−` while the lens is active.

**What is Walk mode?**  
A lazy-loaded Three.js open-world view: memories are laid out in tone-themed beds, you move with keyboard/mouse or on-screen joystick, and proximity opens the same memory detail flow as the 2D garden. Collective community waterings unlock **Grove Project** scenery (birdbath → fireflies → sakura → starlight fountain → aurora); visitors see privacy-projected layouts and sanitized wire payloads.

**How do hybrid seeds work?**  
Cross-pollinate two memories from the memory card flow, plant the linked hybrid seed, or dream a genome from the garden panel—extras live in the **storage shed** until you plant them.

**How do paid fertilizer boosts work?**  
Premium and Legendary tiers open Stripe Checkout; entitlements are stored server-side after webhook fulfillment. Garden Boost remains free without Stripe.

**How do I contribute or report an issue?**  
Open GitHub issues or pull requests on this repository; run `npm run lint` and `npm test` before submitting.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
