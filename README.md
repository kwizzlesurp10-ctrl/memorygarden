# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, tend it over time, and watch it grow across an illustrated garden, a first-person **Walk** built on **Three.js**, and community groves — never rushed, never noisy, always yours. The app is local-first; optional Edge APIs on Vercel add AI, sync, payments, and shared gardens when you configure them.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed` → … → `elder`) as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone hints shape variety, hybrid genetics, and color so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; **Dream a Plant** (with fullscreen close-up preview) and **Garden Lens** deepen the story; **gentle whispers** (rule-of-three) nudge you back without guilt.
- **Create connections** — Spatial proximity, clustering, parent-linked **hybrids**, and **3D gifts** at plant bases weave social bonds into the landscape.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season; **The Grove Project** unlocks five community milestone tiers as collective waterings grow.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (IndexedDB for blobs), write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to advance stages; reflections and growth metrics deepen each return visit.
- **Hybrids**: Link two parent memories to spawn a genetically seeded hybrid variety.
- **Dream a Plant**: LLM-driven hybrid genomes (JSON + SVG motifs) from a poetic prompt; review growth in a **fullscreen close-up** overlay with per-stage scrubbing before you store the seed in the shed.
- **Fertilizer Boost**: Garden Boost is free; Premium and Legendary use Stripe Checkout. Growth applies only after webhook-verified payment.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`kind: classify`) with **Claude Haiku** or fast Grok; reflections use **Claude Sonnet** or the configured Grok model.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming your voice.
- **Memory Clusters**: Thematic or temporal groupings for mood-first browsing.

### 🎨 Beautiful Views
- **Garden**: Illustrated pan-and-zoom canvas with **Garden Lens** (parallax detail on a memory).
- **Walk**: First-person open world — **Three.js** terrain, **CC0 Kenney / Quaternius** scenery with hybrid dusk tinting, proximity interact, and watering in 3D.
- **Timeline**, **Clusters**, **Bloom Wall**: Chronological, grouped, and spotlight layouts for full blooms.
- **Storage Shed**: Archive and restore memories without losing your garden history.
- **Community explore**: Browse public groves when **`DATABASE_URL`** (Neon) powers `/api/gardens`.

### 👥 Collaboration, Gifts & Privacy
- **Collaborative / community gardens**: Join, plant, water, and reflect via the Gardens API.
- **3D gifts & dew vials**: Leave mesh-backed gifts at a plant; opening converts notes into keepsake reflections.
- **Gentle whispers**: At most three compassionate re-engagement prompts per week (anniversaries, gifts, thirst, solstice).
- **Privacy**: **camouflage** (coordinate-stable hiding) and **sleeping_seed** (contemplation-ring placeholders) for shared views.

### 🌓 Living Atmosphere
- **Day / night** and **seasonal mood** with optional ambient sound.
- **Grove Project** (five tiers): birdbath → fireflies → sakura → starlight fountain → aurora as community waterings rise.

### ⌨️ Power user affordances
- **Keyboard shortcuts** (`?` cheat sheet), **PWA** install, and **`web+memorygarden://`** protocol handlers when supported.
- **Accessibility**: Plant accessibility layer on canvas, reduced-motion respect, and mobile-friendly shell controls.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19 + TypeScript** app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **Vite** — Dev server and production bundle.
- **Tailwind CSS** + **Framer Motion** + **Radix UI** — Layout, springs, and accessible primitives.
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage**; photos and heavy blobs use **IndexedDB**.
- **Validation** — `src/lib/validation.ts` exposes `ValidationResult<T>` (discriminated success/error) for memories, gardens, preferences, and API payloads.
- **LLM client** — `getLLMProvider()` in `src/lib/llm-client.ts`: HTTP **`POST /api/llm`** first, optional **`window.spark`** where present, then a static no-network fallback.

### Walk (open world)
- **`OpenWorldEngine`** (`src/components/open-world/engine.ts`) — **three** WebGL renderer, terrain mesh, instanced plant groups, and CC0 GLB scenery from `public/models/cc0/`; hooks for proximity, watering SFX, and pond interact.

### Edge API routes (Vercel)
| Route | Purpose |
| --- | --- |
| **`POST /api/llm`** | Proxies classify/reflect; prefers **`XAI_API_KEY`** (Grok), else **`ANTHROPIC_API_KEY`** (Haiku / Sonnet). Rate-limited; returns **503** when unconfigured. |
| **`GET\|POST /api/sync`** | Optional per-user document in **Vercel KV** (`KV_REST_*`). Photos do **not** sync — metadata and reflections do. |
| **`/api/gardens`** | Community gardens on **Neon** (`DATABASE_URL`); join, plant, water, reflect; privacy query `camouflage` \| `sleeping_seed`. |
| **`/api/payments/*`** | Stripe Checkout, webhooks, entitlements (KV). See **[PAYMENTS.md](./PAYMENTS.md)**. |
| **`/api/auth/*`** | Optional Neon-linked account restore and entitlements when auth is enabled. |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python example (CoinGecko); run separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** `^22.12` or `^24` (see `package.json` engines)
- **npm** (or **pnpm** — `packageManager` field pins pnpm 9.x)

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
   Matches `.npmrc` and avoids peer-resolution friction with Vite 8.

### Development
```bash
npm run dev
```
Default Vite port **5173** unless overridden.

### Production build
```bash
npm run build
npm run typecheck   # optional strict TS pass
```
Output lands in **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint
npm test
```

### Preview the production bundle
```bash
npm run preview
```

## Testing

**Vitest** covers garden logic, storage, validation, LLM client wiring, grove milestones, gentle whispers, privacy camouflage, payments entitlements, dream close-up bounds, CC0 walk assets, and open-world helpers.

### Commands
- **One-off**: `npm test` — **818** tests across **72** files (current mainline; all passing).
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
Deploy as a **Vercel** static SPA plus Edge functions. Minimum viable deploy needs only the built `dist/`; features light up per env var.

### AI — `/api/llm`
- Set **`XAI_API_KEY`** for Grok (`XAI_MODEL` optional; default `grok-4.20-0309-non-reasoning`).
- Otherwise set **`ANTHROPIC_API_KEY`** — classify uses `claude-haiku-4-5-20251001`, reflect uses `claude-sonnet-4-6`.
- Without keys, the route returns **503** and the UI falls back gracefully.

### Sync — `/api/sync`
- **`KV_REST_API_URL`** + **`KV_REST_API_TOKEN`** (Upstash / Vercel KV).
- Syncs structured garden JSON per user; **photos stay on-device** (IndexedDB).

### Community — `/api/gardens`
- **`DATABASE_URL`** → Neon Postgres (serverless driver).
- Optional auth envs for linked accounts (see `api/auth/*` and Neon Auth packages in `package.json`).

### Payments — `/api/payments/*`
- Stripe Checkout + webhook fulfillment; entitlements in KV.
- Full checklist in **[PAYMENTS.md](./PAYMENTS.md)** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price IDs, etc.).

### Build & CI
- Pushes to **`main`**: `npm install` + `npm run build`; **`.npmrc`** `legacy-peer-deps=true`.
- Header **Sync to cloud** reflects real KV status and backs off on **503** so users are never misled.

## Privacy & Data
- **Local-first**: Memories and media default to the browser; nothing leaves the device except explicit sync, share, or community publish paths you opt into.
- **AI payloads**: Classification uses truncated text; reflections may include short neighboring snippets — not photos or full account profiles.
- **Community privacy**: Non-owners see camouflaged or sleeping-seed projections per garden policy.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden presence, invites, and conflict-safe merges for joint tending.
- **Export & print** — Higher-fidelity PDF and poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Continue canvas and Walk HUD audits, reduced-motion coverage, and extract copy for translation.
- **Performance at scale** — Continue canvas virtualization, Walk LOD, and asset prioritization for gardens with **500+** plants.
- **Auth & entitlements** — Smoother Neon-linked restore across devices without weakening local-first defaults.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio. Cloud sync of metadata is optional (KV). Community gardens store shared rows in Neon when `DATABASE_URL` is set.

**Are photos sent to the AI?**  
No. AI routes use text (and brief reflection context), not image bytes. `api/sync.ts` explicitly excludes photo payloads from KV documents.

**Which LLM runs in production?**  
`POST /api/llm` prefers **xAI Grok** when `XAI_API_KEY` is set; otherwise **Anthropic** Haiku (classify) or Sonnet (reflect). The browser never sees API keys. Spark builds may still use `window.spark.llm` via `getLLMProvider()` order.

**What are plant stages?**  
Eight stages through **`elder`**, computed in `getPlantStage()` from visits, age, and growth signals (`src/lib/types.ts`).

**How do community privacy modes work?**  
**`camouflage`** keeps private memories visually indistinguishable without leaking text/coordinates to non-owners; **`sleeping_seed`** shows contemplation-ring placeholders. Query param on garden reads matches `api/gardens/lib/community-memory-privacy.ts`.

**How do I contribute or report an issue?**  
Open GitHub issues and pull requests on [kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden).
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
