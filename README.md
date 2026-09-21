# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter—no accounts, no feeds, just you and a garden that grows with your life. A stable **LocalUser** identity (`getLocalUser()`) is created in the browser on first visit; memories persist through **`useMemoriesKV`**, which keeps structured fields in scoped **localStorage** and stores photos and audio in **IndexedDB** so large gardens stay within quota. Plant each memory as a seed, return to water and reflect, and watch it advance through **eight growth stages** on an infinite canvas—never rushed, never noisy, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to care, time, and feeling:

- **Grow over time** — Eight stages (`seed` → `sprout` → `seedling` → `young` → `bud` → `bloom` → `mature` → `elder`) advance with visits, reflections, and age; neglect and tenderness both leave traces you can feel on the canvas.
- **Reflect emotions** — Five **emotional tones** (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer variety, OKLCH palettes, and ambient **weather moods** (six types, e.g. sunny, mist, golden-haze).
- **Earn and spend garden currency** — Four currencies (**dew**, **sunlight**, **pollen**, **starlight**) reward tending; spend them on cosmetics, rerolls, and unlocks in the Garden Unlocks panel.
- **Unlock cosmetics & achievements** — **18** unlockable palettes, patterns, and adornments plus **7** achievements tracked in `unlock-system.ts`; trait **slots** (palette → pattern → adornment → accent → aura) open as each plant matures.
- **Hybrid & archival tools** — **Cross-pollinate** two memories on the canvas, **Dream-a-Plant** from a written idea (LLM-assisted genome), and stash overflow in the **Storage Shed** without losing the story.
- **Create connections** — Spatial proximity, memory clusters, and collaborative garden slots help you notice themes across seasons of your life.
- **Adapt to seasons** — Day/night lighting, seasonal gradients, and optional ambient audio tie the garden to real time and the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (validated, max **10 MB**), write about the moment (up to **2 000** characters), optional location/audio, and watch your memory sprout on the canvas.
- **Tending**: Open memories to water them, add reflections (up to **1 000** characters each), and deepen growth; visit counts and reflection history feed stage logic and trait unlocks.
- **Fertilizer Boost**: Three tiers—**Garden Boost** (standard), **Premium Fertilizer**, and **Legendary Essence**—apply `applyPremiumFertilizer` vitality jumps with distinct particle effects.

### ✨ AI-Powered Insights
- **Emotional tone**: Text classification via `getLLMProvider()` → **`POST /api/llm`** (`kind: classify`, **Claude Haiku 4.5**).
- **Garden AI**: Poetic reflections and prompts (`kind: reflect`, **Claude Sonnet 4.6**); truncated prompts (≤ **4 000** chars), no image bytes on the wire.
- **Memory Clusters**: Thematic or temporal groupings for browsing by mood as well as place.

### 🎨 Five primary views

| View | Role |
|------|------|
| **Garden** | Infinite pan/zoom canvas, animated plants, Dream-a-Plant panel, Storage Shed, cross-pollinate mode |
| **Timeline** | Chronological path through every planted moment |
| **Clusters** | AI/heuristic group cards for thematic exploration |
| **Explore** | Curated community garden gallery (demo seed data in-app; live **`/api/gardens`** when Neon `DATABASE_URL` is configured on Vercel) |
| **Bloom Wall** | Gallery spotlight for memories at **bloom** stage and beyond |

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Per-user `collaborative-gardens` KV spaces and invite links for shared tending (local-first; merges stay on-device).
- **Private sharing**: Link-based memory shares with optional adornment unlocks when a share is created.
- **Community API**: Edge route **`/api/gardens`** (join, plant, water, reflect) backed by **Neon Postgres** when `DATABASE_URL` is set; otherwise Explore remains on bundled showcase gardens.

### 🌓 Living Atmosphere
- **Day / night** and **seasonal** backgrounds driven by `garden-helpers` and `ambient-garden-params`.
- **Garden weather** derived from dominant emotional tone across your collection.
- **Ambient sound** engine with intensity tied to season, time of day, and weather.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Navigation, view switching, plant modal, export (`?` opens the cheat sheet from `keyboard-shortcuts.ts`).
- **PWA**: `public/manifest.json` — standalone display, **share target**, and `web+memorygarden` / `web+plantmemory` / `web+viewmemory` protocol handlers (no service worker yet—offline cache is a roadmap item).
- **Export**: Image, PDF, and garden-view exports from the header or shortcuts.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19** SPA tuned for smooth, organic motion and local-first data.

### Frontend stack

| Layer | Choice |
|-------|--------|
| UI | React **19.2** + TypeScript **6** |
| Bundler | Vite **8** (`@vitejs/plugin-react-swc`) |
| Styling | Tailwind CSS **4** + OKLCH theme tokens |
| Motion | Framer Motion **12** |
| Primitives | Radix UI + shadcn-style components in `src/components/ui/` |
| Commands | **cmdk**-based command palette wiring (Radix dialog) |
| Validation | **Zod**-backed helpers in `validation.ts` |

### Persistence & media
- **`useKV`** (`@/lib/storage`) — namespaced localStorage per **LocalUser** id.
- **`useMemoriesKV`** — strips Base64 blobs to **IndexedDB** (`idb://` refs in the serialized array); materializes data URLs in memory for the rest of the app.
- **Cloud sync** — optional metadata sync via **`/api/sync`** (Vercel KV / Upstash); photos stay on-device.

### LLM resolution (`getLLMProvider`)
1. HTTP **`fetch('/api/llm')`** → Vercel Edge → Anthropic (production default).
2. Optional **`window.spark.llm`** when the GitHub Spark SDK is present.
3. Static no-network fallback so the garden never hard-crashes on AI failure.

### Edge API routes (Vercel)

| Route | Purpose | Key env vars |
|-------|---------|----------------|
| **`/api/llm`** | Classify + reflect prompts | `ANTHROPIC_API_KEY` |
| **`/api/sync`** | Per-user JSON document LWW sync | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| **`/api/gardens`** | Community gardens CRUD + social actions | `DATABASE_URL` (Neon) |

### Quality gate
- **578** Vitest assertions across **22** test files (`src/lib/__tests__/`): growth logic, traits, unlocks, LLM client, storage, validation, canvas layout, and integration paths.
- **CI** (`.github/workflows/ci.yml`): `tsc --noEmit`, ESLint, Vitest + coverage, production build, npm audit (high+), **400 KB** per-chunk bundle budget, **pnpm-lock** frozen check, and **volatility-sentinel** pytest.

### Sub-projects & agents
- **`volatility-sentinel/`** — Standalone Python CoinGecko agent; exercised in CI from its own directory.
- **`agents/micro_forge/`** — Swarm Micro-Forge report runner (`docker compose --profile agents run --rm micro-forge`).
- **Docker** — Multi-stage **nginx** image on port **8080** with **`/healthz`**; dev profile serves Vite on **5173** (Edge APIs are not in the static image).
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (CI uses 20; Docker build uses 22)
- **npm** (ships with Node); repo also carries **`pnpm-lock.yaml`** for lockfile CI

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
   Matches `.npmrc` (`legacy-peer-deps=true`) for Vite 8 peer ranges.

### Development
```bash
npm run dev
```
Vite dev server (default **5173**). For AI locally, run on Vercel dev or set up Edge env vars; without them, classification falls back to heuristics and reflections stay static.

### Production build & preview
```bash
npm run build    # → dist/
npm run preview  # serve dist/ locally
```

### Quality checks
```bash
npm run lint
npm test              # 578 tests, 22 files
npm run test:watch
npm run test:coverage
```

### Docker
```bash
docker compose up --build              # nginx SPA → http://localhost:8080 (/healthz)
docker compose --profile dev up dev    # Vite → http://localhost:5173
docker compose --profile agents run --rm micro-forge
```
Static images do **not** include `/api/llm`, `/api/sync`, or `/api/gardens`—point those at Vercel or accept graceful degradation.

### Environment variables (local / Vercel)

| Variable | Used by |
|----------|---------|
| `ANTHROPIC_API_KEY` | `/api/llm` |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `/api/sync` |
| `DATABASE_URL` | `/api/gardens` (Neon) |
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
Static **`dist/`** SPA plus three Edge handlers:

1. **`/api/llm`** — Proxies to Anthropic (`claude-haiku-4-5-20251001` for classify, `claude-sonnet-4-6` for reflect). Missing `ANTHROPIC_API_KEY` → **503**; client disables further calls for the session.
2. **`/api/sync`** — Stores `mg:user:<id>` JSON (**memories** metadata, **preferences**, `updatedAt`). **Last-write-wins**; rejects payloads **> 1 MB** with **413**. Photos/audio remain in IndexedDB on each device.
3. **`/api/gardens`** — Community features when **`DATABASE_URL`** points at Neon; returns **503** when unset.

Pushes to **`main`** run CI (`npm ci`, typecheck, lint, test, build). Header **Sync to cloud** reflects `useCloudSync` status and backs off after **503** (KV not configured).

### Self-hosted static
Use the **Dockerfile** or any static host for `dist/`. Configure reverse proxy only if you add compatible Edge/API routes yourself; otherwise expect local-only storage and demo Explore gardens.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (scoped keys + IndexedDB). Nothing leaves the device except optional sync fields, share links you create, or API calls you configure.
- **AI payloads**: Text-only prompts; reflections may include short neighboring memory snippets—never photos, audio bytes, or GitHub profile data.
- **Export & reset**: Full-garden export from settings/shortcuts; clearing site data removes the LocalUser id and all local blobs—treat export as your backup before reset.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Wire Explore/Community views to live **`/api/gardens`** by default; invitations, presence, and conflict-safe merges for collaborative KV gardens.
- **Offline & PWA** — Service worker + asset precache so installed clients work without network; align share-target flows with background sync.
- **Command palette** — Surface navigation, planting, and export through **cmdk** (`Ctrl+K` / `⌘K`) for power users.
- **Export & print** — Higher-fidelity PDF/poster layouts from Bloom Wall and timeline exports.
- **Accessibility & i18n** — Audit canvas focus, modals, and shortcuts; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and blob prioritization for **500+** plants.
- **AI imagery** — Optional generative plant variety sketches when provider quotas allow (still local-first for user photos).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: `getLocalUser().id` scopes localStorage keys; `useMemoriesKV` stores heavy media in IndexedDB. Optional **`/api/sync`** uploads structured metadata only when KV env vars are set.

**Are photos sent to the AI?**  
No. `/api/llm` accepts text prompts only (max 4 000 characters). Images never leave the browser except when you export or share them yourself.

**Which models run in production?**  
Edge `api/llm.ts` uses **Claude Haiku 4.5** for classification and **Claude Sonnet 4.6** for reflections. Spark builds may still use `window.spark.llm` as a fallback in `llm-client.ts`.

**What are dew, sunlight, pollen, and starlight?**  
In-game currencies earned by planting, reflecting, revisiting, and achievements—spent on cosmetics and rerolls in Garden Unlocks.

**Why does Sync or Community return 503?**  
**503** means the route is missing or env vars are unset (`ANTHROPIC_API_KEY`, KV pair, or `DATABASE_URL`). The UI falls back to local-only mode or demo Explore gardens.

**What if sync fails with 413?**  
Your metadata document exceeded the **1 MB** Edge limit—export, prune old reflections, or split archives before retrying.

**How do I verify the codebase?**  
`npm test` runs **578** tests across **22** files; CI also enforces TypeScript, ESLint, coverage upload, and a **400 KB** JS chunk budget.

**How do I contribute or report an issue?**  
Open GitHub issues and pull requests on [kwizzlesurp10-ctrl/memorygarden](https://github.com/kwizzlesurp10-ctrl/memorygarden).
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
