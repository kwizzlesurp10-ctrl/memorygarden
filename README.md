# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed on an infinite garden canvas, dream new hybrids with AI when words come easier than photos, and—when you're ready—step through the gate into a **Walk** mode built on **Three.js** to stand among your plants in first person. Community gardens on Neon, gentle re-engagement whispers, and privacy-aware sharing sit alongside a local-first core, so the garden stays yours even when you invite others in.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to care:

- **Grow over time** — Stages run `seed → sprout → seedling → young → bud → bloom → mature → elder`, driven by visits, reflections, and vitality metrics—not just the calendar.
- **Reflect emotions** — AI-assisted tone classification steers variety, palette, and growth character so each plant feels emotionally honest.
- **Encourage reflection** — Revisit memories to add reflections; **Garden AI** offers poetic nudges without drowning out your voice.
- **Create connections** — Spatial layout, clustering, and **cross-pollination** link related memories; **hybrid plants** blend two parents into a new genome.
- **Dream without a photo** — **Dream a Plant** (and weekly evolving seeds in the **Storage Shed**) turn ideas into hybrid genomes you can plant later.
- **Adapt to seasons** — Day/night, seasonal mood, and optional ambient audio tie the illustrated canvas and open world to real time.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and place it on the pan-and-zoom **Garden** canvas (or create a hybrid from two parents).
- **Tending**: Visits and reflections increase vitality and stage; **moisture / health** signals guide gentle thirst reminders—not punitive wilting.
- **Fertilizer Boost**: Garden Boost (standard) is free; **Premium** and **Legendary** boosts use Stripe Checkout and apply only after webhook-verified payment.

### ✨ AI-Powered Insights
- **Emotional tone**: Text classification maps to `happy | reflective | bittersweet | peaceful | nostalgic`.
- **Garden AI**: Reflections and cluster insights via `getLLMProvider()` → `POST /api/llm`.
- **Dream a Plant**: JSON hybrid genomes (`HybridGenome`) with motif SVG paths; offline **local genome** fallback when LLM is unavailable.

### 🔬 Garden Lens
- Toggle a magnifying **lens** on the canvas—pan a circular viewport with stepped zoom and open **Garden Lens Detail** for a focused read of one memory without leaving the map.

### 🧬 Hybrids & Storage Shed
- **Cross-pollinate** two memories to set hybrid parents, then plant the blended seed.
- **Storage Shed**: Auto-stores dreamt and weekly seeds; pick shed style (`antique`, `storybook`, `glass`, `modern`) and re-dream saved ideas.

### 🎨 Beautiful Views
- **Garden**: HTML5 canvas with animated plants, starter decor, and lens tooling.
- **Walk**: First-person open world (Three.js)—WASD move, water and remember in 3D, **Grove Project** milestone scenery unlocks.
- **Timeline**, **Clusters**, **Bloom Wall**, and **Explore** for chronological, thematic, spotlight, and community discovery.

### 🌍 Community & Privacy
- **Explore** surfaces curated community gardens; live **`/api/gardens`** (Neon) supports join, plant, water, and reflect when `DATABASE_URL` is set.
- **Four-tier privacy engine** for shared views: **camouflage** (hide private plants with zero coordinate drift) and **sleeping_seed** (redacted placeholders on the contemplation ring).

### 🎁 Walk Extras — 3D Gifts & Gentle Whispers
- Leave **3D gifts** (blossom notes, lanterns, dew vials, wind chimes) at plant bases in Walk; opening a dew vial restores vitality.
- **The Grove Project**: five collective-watering tiers (25 → 500) unlock birdbath, fireflies, sakura, starlight fountain, and aurora sky assets.
- **Gentle whispers**: At most three compassionate notifications per week (on-this-day, social care, thirst, seasonal cues).

### 👥 Collaboration & Sharing
- **Collaborative gardens** with invites and shared tending when enabled locally or via Neon.
- Optional **Neon Auth** sign-in to link a browser identity and restore Stripe entitlements across devices.

### 🌓 Living Atmosphere & Power Users
- Day/night and seasonal gradients; optional time-aware ambient sound.
- Keyboard shortcuts (`?` cheat sheet), PWA install, and `web+memorygarden://` protocol handlers where supported.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19 + TypeScript** app (Vite) with Edge APIs on Vercel for AI, sync, payments, and community data.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | React 19, Tailwind, Radix UI, Framer Motion |
| Garden canvas | Custom HTML5 canvas + OKLCH palettes (`garden-helpers`, `theme.css`) |
| Open world | **Three.js** (`OpenWorldGarden`, procedural terrain, plant meshes) |
| Persistence | `useKV` / `@/lib/storage` → namespaced **localStorage** per local user; **IndexedDB** for large photo blobs |
| Validation | `ValidationResult<T>` discriminated union in `src/lib/validation.ts` for memories, gardens, and API payloads |
| LLM client | `getLLMProvider()`: HTTP `/api/llm` → optional `window.spark` → static empty fallback |

### Plant growth model
Stages: `seed`, `sprout`, `seedling`, `young`, `bud`, `bloom`, `mature`, `elder` (`getPlantStage`, vitality floors, manual stage floors). Trait slots and cosmetic unlocks layer on top for long-tended plants.

### Edge API routes
| Route | Purpose |
|-------|---------|
| `POST /api/llm` | Proxies classify (`claude-haiku-4-5-20251001`) and reflect / JSON (`claude-sonnet-4-6`, Dream genomes). Prefers **xAI Grok** when `XAI_API_KEY` is set; else **Anthropic** with `ANTHROPIC_API_KEY`. Rate-limited. |
| `GET/POST /api/sync` | Metadata blob per user in **Vercel KV** (`KV_REST_*`); photos stay on-device. |
| `/api/gardens` | Public community gardens, memory actions, privacy modes (`camouflage` \| `sleeping_seed`) — requires **`DATABASE_URL`** (Neon). |
| `/api/payments/*` | Stripe Checkout, webhooks, entitlements (see [PAYMENTS.md](./PAYMENTS.md)). |
| `/api/auth/*` | Optional Neon account linking and entitlement restore when auth env vars are set. |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — standalone Python agent example, run separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** `^22.12` or `^24` (see `package.json` engines)
- **npm** (or pnpm per `packageManager` field)

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
   Matches `.npmrc` for Vite 8 peer resolution.

### Development
```bash
npm run dev
```
Vite dev server (default **5173**).

### Production build & preview
```bash
npm run build    # → dist/
npm run preview  # serve dist/ locally
npm run lint
npm run typecheck
```

### Testing
Vitest covers garden logic, open-world layout, privacy camouflage, LLM client wiring, payments entitlements, Grove milestones, and more.

```bash
npm test              # single run
npm run test:watch
npm run test:coverage
```

**Current suite (2026-11-08):** **787** tests across **63** files — all passing.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (SPA + Edge)

1. **`/api/llm`** — Set **`XAI_API_KEY`** (Grok, preferred when present) and/or **`ANTHROPIC_API_KEY`**. Without either, returns `503` and the client uses Spark/local fallbacks.
2. **`/api/sync`** — Optional **`KV_REST_API_URL`** + **`KV_REST_API_TOKEN`**. Structured fields sync; photos/audio remain in IndexedDB.
3. **`/api/gardens`** — Community features need **`DATABASE_URL`** (Neon Postgres). Migrations under `db/migrations/`.
4. **Stripe** — **`STRIPE_SECRET_KEY`**, **`STRIPE_WEBHOOK_SECRET`**, price env vars, KV for entitlements — see **[PAYMENTS.md](./PAYMENTS.md)**.
5. **Optional Neon Auth** — **`NEON_AUTH_BASE_URL`**, **`VITE_NEON_AUTH_URL`** for sign-in and JWT-guarded sync/payments/garden actions.

CI on **`main`**: `npm install --legacy-peer-deps`, `npm run build`. The header **Sync to cloud** control reflects real API status and backs off on `503` (missing KV).

## Privacy & Data

- **Local-first**: Default storage is browser-scoped keys + IndexedDB blobs.
- **AI payloads**: Classification and reflection use text (plus short neighbor context); not image bytes.
- **Community**: `visibility` and privacy modes redact private memories for visitors; see `docs/PRIVACY.md`.
- **Export**: Full-garden export from settings when you need a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden presence, conflict-safe merges, and clearer Neon vs local garden boundaries.
- **Export & print** — Higher-fidelity PDF and poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Audit canvas, Walk HUD, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization, Three.js LOD, and asset prioritization for 500+ plants.
- **Dream & shed polish** — Deeper weekly plant evolution UX and shed sync semantics across devices.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured state and IndexedDB for photos. Optional KV sync and Neon community gardens only activate when their env vars are configured.

**Are photos sent to the AI?**  
No. LLM routes operate on text (and JSON for Dream genomes). Reflection paths may include short text snippets from nearby memories—not image bytes.

**Which model runs in production?**  
`POST /api/llm` prefers **xAI Grok** when `XAI_API_KEY` is set; otherwise **Anthropic** Haiku (classify) or Sonnet (reflect / `jsonMode`). GitHub Spark environments may still expose `window.spark.llm` as an additional client fallback.

**What are camouflage and sleeping seed?**  
Community and open-world viewers can hide private plants entirely (**camouflage**) or show redacted **sleeping seed** placeholders on the contemplation ring—see `privacy-engine.ts` and `/api/gardens` `privacyMode`.

**How do I contribute or report an issue?**  
Open GitHub issues and pull requests on [kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden).
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
