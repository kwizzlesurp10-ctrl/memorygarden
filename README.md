# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed on an infinite garden canvas, return to tend it, and watch it grow through organic stages—never rushed, never noisy, always yours. Pan, zoom, or open **The Lens** when you want a magnified look at a corner of the garden without scaling the whole scene.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Memories move through stages (`seed → sprout → bud → bloom → mature → evergreen`) as you visit, reflect, and optionally boost growth with fertilizer tiers.
- **Reflect emotions** — AI-assisted tone classification steers plant variety, OKLCH palettes, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add reflections when you revisit; ask Garden AI for gentle, poetic prompts that stay close to your own words.
- **Create connections** — Canvas placement, cluster paths, and Memory Clusters help you notice themes across seasons of your life.
- **Adapt to seasons** — Day/night palettes, weather, and ambient mood follow local time and season so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored locally as Base64 / IndexedDB), write about the moment, and place the memory on the canvas.
- **Tending**: Revisit memories to advance growth; reflections and visit counts deepen the story over time.
- **Fertilizer boost**: Three tiers (standard, premium, legendary) via `applyPremiumFertilizer`—each tier bumps visits and unlocks distinct celebration effects.
- **Hybrids & shed**: Cross-pollinate parent memories into hybrid plants; stash seeds in the **Storage Shed** and plant them when you are ready.

### 🔍 The Lens
- **Loupe on canvas**: Toggle a circular magnifier that follows the cursor; zoom is clamped in `src/lib/garden/lens.ts` via `computeLoupeLayout` (magnifies a scene clone inside the loupe—never scales the whole garden).
- **Calibrated zoom**: Steps of **0.2×** between **1.6×** and **4×** (default **2.4×**) so pointer→scene mapping stays stable while you inspect dense beds.
- **Lens detail**: Open a focused memory card overlay (`GardenLensDetail`) for tending without leaving the garden view.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`classify` on `/api/llm`) to steer variety, palette, and traits.
- **Garden AI**: Reflection prompts that may include short text from nearby memories—never photos.
- **Memory Clusters**: Thematic or temporal groupings for browsing by mood as well as place.

### 🎨 Beautiful Views
- **Garden**: Layered SVG scene with parallax, weather, cluster paths, and draggable plants.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: Gallery layout for memories at full bloom (`bloom-wall-layout` helpers).
- **Explore / community**: Browse public gardens when the community API is configured.

### 👥 Collaboration & Sharing
- **Community gardens**: Edge API at `/api/gardens` (Neon Postgres) for list/join/plant/water/reflect on shared spaces.
- **Cloud sync**: Optional metadata sync via `/api/sync` (Vercel KV); blobs stay on-device.
- **Private sharing**: Link-based access for specific memories where that flow is enabled.

### 🌓 Living Atmosphere
- **Day / night**: `todPalette` and real-clock time-of-day controls on the canvas.
- **Seasonal mood**: Season picker plus weather overlays.
- **Ambient sound**: Optional audio keyed to time and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation (`?` opens the cheat sheet).
- **Protocol handlers**: `web+memorygarden://` deep links via `protocol-router.ts` when installed as a PWA.
- **PWA**: Installable shell with CSP-friendly static hosting on Vercel.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data. State lives in `App.tsx` and flows into view components; there is no global Redux-style store.

### Frontend stack
- **React 19 + TypeScript** — UI, hooks, and strict types in `src/lib/types.ts`.
- **Vite** — Dev server (default **5173**) and production bundle to `dist/`.
- **Tailwind CSS + OKLCH theme** — Layout and emotional palettes (`theme.css`, `garden-helpers.ts`).
- **Framer Motion** — Springs and transitions; `useReducedMotion` respects accessibility.
- **Radix UI** — Accessible primitives under `src/components/ui/`.
- **Persistence** — `useKV` from `@/lib/storage` namespaces **localStorage** per `LocalUser`; photos and heavy blobs use **IndexedDB** helpers so KV strings stay small.
- **Validation** — `src/lib/validation.ts` exposes `ValidationResult<T>` (ok/fail discriminated union) for memories, preferences, garden payloads, and search filters before they hit storage or sync.
- **LLM client** — `getLLMProvider()` in `src/lib/llm-client.ts` tries `POST /api/llm`, then optional `window.spark.llm`, then static fallbacks—all wrapped in `try/catch`.

### Vercel Edge routes

| Route | Role | Required env |
| --- | --- | --- |
| `POST /api/llm` | Anthropic proxy (`classify` / `reflect`, Haiku vs Sonnet by kind) | `ANTHROPIC_API_KEY` |
| `GET/POST /api/sync` | Per-user JSON document in KV (last-write-wins; no photo bytes) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `GET/POST /api/gardens` | Community garden CRUD, join/plant/water/reflect | `DATABASE_URL` (Neon serverless) |

Missing credentials return **503**; the SPA keeps working in local-only mode.

### Garden rendering notes
- **The Lens** — `computeLoupeLayout` maps cursor position to loupe geometry; parallax is disabled while the lens is active so magnified content tracks the pointer. Zoom uses `clampLensZoom` / `stepLensZoom` with constants in `lens.ts`.
- **Growth** — `getPlantStage()` and visit signals in `garden-helpers.ts` drive SVG stage indices.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); run and test separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** (current LTS recommended)
- **npm** (ships with Node)

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
   This matches the repo’s `.npmrc` and avoids common peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Opens the Vite dev server (default port **5173** unless configured otherwise).

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint
npm test
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

Current suite: **578** tests across **22** files, including growth and stage logic, lens layout and zoom stepping, unlock/currency paths, trait and hybrid helpers, validation, local user migration, protocol URLs, bloom-wall layout, and HTTP LLM client behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA (`vercel.json` rewrites to `index.html`) plus three Edge handlers under `api/`:

1. **`/api/llm`** — Proxies classification and reflection prompts to Anthropic (`ANTHROPIC_API_KEY`). Without the key, responses are **503** and the client uses non-AI fallbacks.
2. **`/api/sync`** — Optional per-user document in **Vercel KV / Upstash** (`KV_REST_API_URL`, `KV_REST_API_TOKEN`). Syncs memories metadata, preferences, positions, traits, reflections—not `photoUrl` blobs (those remain in IndexedDB on each device).
3. **`/api/gardens`** — Community gardens backed by **Neon** (`DATABASE_URL` via `@neondatabase/serverless`). Without Postgres, community features return **503** while the personal garden still runs locally.

Pushes to **`main`** typically run `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off on **503**, so users are not told data is in the cloud when KV is unset.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (namespaced localStorage + IndexedDB). Nothing leaves the device except optional sync, community API calls you initiate, or sharing flows you choose.
- **AI payloads**: Classification uses truncated memory text; reflections may include short neighboring text—never image bytes or GitHub profile data in those requests.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Harden `/api/gardens` auth, moderation, and optimistic UI when planting or watering on shared beds.
- **Collaboration** — Real-time presence and conflict-safe merges for joint tending beyond last-write-wins sync.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Full audit of canvas, Lens loupe, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Virtualize distant plants and prioritize IndexedDB reads for gardens with 500+ memories.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio. Optional **`/api/sync`** uploads a JSON document when KV is configured; photos still stay local unless you export them yourself.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`POST /api/llm`** → Anthropic (`claude-haiku-4-5-20251001` for fast classification, `claude-sonnet-4-6` for richer reflection). GitHub Spark builds may still expose `window.spark.llm` as a secondary path in `llm-client.ts`.

**Why does community or sync show as unavailable?**  
Edge routes return **503** when `DATABASE_URL` (gardens) or KV credentials (sync) are missing. The personal garden continues to work offline-first.

**What is The Lens?**  
A canvas loupe powered by `computeLoupeLayout`—it magnifies a copy of the scene under your cursor (zoom **1.6×–4×**, default **2.4×**) so you can inspect dense areas without scaling the entire garden.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
