# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first garden for the moments that matter. Plant a memory with a photo and a few words, return to water and reflect, and watch it grow through eight organic stages on an infinite canvas—no account required. A stable **LocalUser** identity (generated in your browser) scopes your data; heavy photos and audio live in **IndexedDB** via `useMemoriesKV`, while structured fields stay in namespaced **localStorage**. Optional cloud sync and community features layer on only when you deploy the Edge APIs with credentials.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to how you tend them:

- **Eight growth stages** — `seed → sprout → seedling → young → bud → bloom → mature → elder`, driven by visits, reflections, age, and optional **growth metrics** (including fertilizer boosts).
- **Five emotional tones** — `happy`, `reflective`, `bittersweet`, `peaceful`, and `nostalgic` steer variety, OKLCH palette, and ambient mood.
- **Living weather** — Six canvas weather moods (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) plus day/night and seasonal atmosphere.
- **Four garden currencies** — Dew, sunlight, pollen, and starlight reward planting, revisits, reflections, and achievements; spend starlight on cosmetic rerolls.
- **Cross-pollination** — Select two memories on the canvas to blend traits and occasionally spawn rare hybrid varieties.
- **Dream-a-Plant & Storage Shed** — Describe an imagined plant (LLM-assisted when `/api/llm` is configured), save hybrid genomes as seeds, and display planted hybrids beside your memory garden.
- **Encourage reflection** — Revisit cards to add reflections; **Garden AI** offers gentle, poetic prompts without replacing your voice.
- **Notice connections** — Spatial proximity, emotional clustering, and timeline views surface themes across seasons of your life.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (IndexedDB-backed), add text, date, optional location/audio, and place the sprout on the pannable canvas.
- **Tending**: Visits and reflections advance stage and unlock per-plant **trait slots** (palette, pattern, adornment, accent, aura).
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.
- **Cross-pollination**: Pair two memories to merge cosmetics and roll for rare mutations.

### ✨ AI-Powered Insights
- **Emotional tone**: Keyword + LLM classification (`claude-haiku-4-5` via `/api/llm` when configured) steers plant variety and color.
- **Garden AI**: Reflections use richer model output (`claude-sonnet-4-6`) with nearby-memory context—text only, never image bytes.
- **Memory Clusters**: Group browsing by dominant emotional tone and visit patterns.
- **Dream-a-Plant**: Hybrid genome generation from a short creative prompt when AI is available.

### 🎨 Five Views
- **Garden** — Infinite pan/zoom canvas with animated plants, Storage Shed, and Dream-a-Plant panels.
- **Timeline** — Chronological path through every planted moment.
- **Clusters** — Thematic cards grouped by emotional tone.
- **Bloom Wall** — Gallery spotlight for memories in bloom and beyond.
- **Explore** — Community garden browser backed by `/api/gardens` when `DATABASE_URL` is set (contributing plants is still rolling out in UI).

### 🎁 Unlocks & Achievements
- **18 unlockable cosmetics** — Palettes, patterns, and adornments gated by reflections, visits, night sessions, and mature/elder plants.
- **7 achievements** — Milestones (first reflection, green thumb, master gardener, night owl, memory keeper, time traveler, elder grove) award bonus starlight.

### 👥 Collaboration & Sharing (honest scope)
- **Collaborative gardens** — Stored in per-user KV for local/shared-session workflows; not a full multi-user server yet.
- **Private sharing** — Link-based shared memory views persisted in KV (`?share=` query); recipients see a read-focused card.
- **Community gardens** — Neon-backed API exists; Explore UI lists and visits gardens when the database is configured.

### 🌓 Living Atmosphere
- **Day / night** — Background and lighting follow local time.
- **Seasonal mood** — Subtle shifts for the current season.
- **Ambient sound** — Optional audio tied to time and season (user preference).

### ⌨️ Power user affordances
- **Keyboard shortcuts** — Global registry (`?` opens the cheat sheet).
- **Search & filters** — Header search bar with emotional tone, stage, and date filters (command palette patterns via `cmdk` in UI primitives).
- **PWA manifest** — Installable shell, protocol handlers (`web+memorygarden`, `web+plantmemory`, `web+viewmemory`), and Web Share Target—**no service worker** yet, so offline caching is limited.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19** SPA tuned for organic motion and local-first data.

| Layer | Choices |
|-------|---------|
| UI | React **19.2**, TypeScript **~6.0**, Vite **8**, Tailwind **4**, Framer Motion **12**, Radix UI |
| State | `App.tsx` owns handlers; `useKV` / **`useMemoriesKV`** persist per **LocalUser** id |
| Blobs | **IndexedDB** (`idb://` refs in KV) for photos and audio |
| LLM | **`getLLMProvider()`** → `POST /api/llm` (HTTP) → optional **`window.spark`** → static empty fallback |
| Tests | **578** Vitest cases across garden logic, storage, validation, unlocks, and LLM client wiring |

### Edge API routes (Vercel)

| Route | Purpose | Required env |
|-------|---------|----------------|
| **`/api/llm`** | Anthropic proxy; `kind: classify \| reflect` picks **Haiku** vs **Sonnet** model IDs | `ANTHROPIC_API_KEY` |
| **`/api/sync`** | Last-write-wins JSON document per user in KV (metadata only—no photo bytes) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| **`/api/gardens`** | Community gardens CRUD/join/plant/water/reflect | `DATABASE_URL` (Neon) |

Without keys, routes return **503** and the client degrades gracefully (no AI, local-only sync, Explore empty).

### Agents & sub-projects
- **Micro-Forge** (`agents/micro_forge/`) — Python scanner/reflector run via `docker compose --profile agents` or CI-adjacent workflows.
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone CoinGecko Python example; CI runs `pytest` in that directory separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (matches CI)
- **npm** (or **pnpm** 9 for lockfile validation in CI)

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
   Matches `.npmrc` (`legacy-peer-deps=true`) for Vite 8 + `@vitejs/plugin-react-swc`.

### Development
```bash
npm run dev
```
Vite dev server (default **5173**).

**Docker alternative:**
```bash
docker compose --profile dev up dev    # hot reload on :5173
docker compose up --build              # production nginx image on :8080 (/healthz)
docker compose --profile agents run --rm micro-forge
```
Static Docker images do **not** include Edge routes—run on Vercel or emulate `/api/*` separately for full AI/sync.

### Production build
```bash
npm run build
```
Output in **`dist/`**.

### Quality checks
```bash
npm run lint
npx tsc --noEmit   # also enforced in CI
npm test           # 578 tests
npm run test:coverage
```

### Preview
```bash
npm run preview
```

CI on **`main`** also runs bundle-size gate (**400KB** per JS chunk), security audit (high/critical), Python sentinel tests, and frozen **pnpm-lock.yaml** validation.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
Static SPA from **`dist/`** plus Edge functions in **`api/`**.

| Variable | Route | Effect if missing |
|----------|-------|-------------------|
| `ANTHROPIC_API_KEY` | `/api/llm` | 503 — tone/reflection fallbacks only |
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | `/api/sync` | 503 — local-only mode |
| `DATABASE_URL` | `/api/gardens` | 503 — Explore community features unavailable |

**Sync semantics:** Documents keyed `mg:user:<id>`; **last-write-wins**; max **1MB** JSON per POST (`413` if exceeded). Photos remain on-device in IndexedDB.

**Identity:** `getLocalUser()` creates or restores an anonymous gardener id in localStorage—no OAuth required for solo use.

**Header “Sync to cloud”** reflects pull/push status and backs off when sync returns **503**, so users are not told data is in the cloud when KV is unset.

### Privacy & Data
- **Local-first**: Memories and media default to the browser; only structured fields sync when KV is configured.
- **AI payloads**: Truncated memory text for classification; reflections may include short neighboring snippets—never photos or profile secrets.
- **Export**: Full-garden export from settings (`ExportGarden`) when you want a portable archive.
- **Clearing data**: Remove namespaced `memorygarden:*` keys and IndexedDB blob store from browser devtools to reset a profile; Storage Shed hybrids can be cleared from the shed panel.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Near-term directions aligned with the current codebase gaps:

- **Community gardens** — Finish planting/contribution flows in Explore; harden `/api/gardens` auth and rate limits.
- **Server-backed shares** — Move share links from KV-only to durable storage with optional expiring URLs.
- **Offline PWA** — Add a service worker and precache strategy without breaking large IndexedDB gardens.
- **AI plant imagery** — Optional generated thumbnails for Dream-a-Plant hybrids (still local-first).
- **Command search** — Wire a global **Ctrl+K** palette to memory jump actions atop existing `cmdk` primitives.
- **Export & print** — Higher-fidelity PDF/poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Audit canvas, modals, and shortcuts; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for 500+ plants.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. A **LocalUser** id is created in your browser. Cloud sync uses that same id when you opt in and KV is configured.

**Where does my data live?**  
Structured memory rows in localStorage (per user id); photos/audio in IndexedDB. Optional KV sync stores metadata only (no image bytes).

**Are photos sent to the AI?**  
No. `/api/llm` receives text prompts only.

**Which models run in production?**  
`claude-haiku-4-5-20251001` for classification-style calls and `claude-sonnet-4-6` for richer reflections (see `api/llm.ts`). GitHub Spark environments may still expose `window.spark.llm` as a fallback in client code.

**What are dew, sunlight, pollen, and starlight?**  
In-game currencies earned by tending; starlight unlocks achievement bonuses and cosmetic rerolls in the unlock shop.

**Does the app work offline?**  
Core planting and browsing work offline once loaded, but there is no service worker yet—refresh requires network unless cached by the browser. AI and sync need reachable `/api/*` routes.

**How do I reset my garden?**  
Clear site data for the origin (localStorage + IndexedDB) or use in-app shed/garden clear actions where available.

**How do I export?**  
Use the export flow in settings to download a portable archive of your garden metadata (and linked media where included).

**How do I contribute?**  
Open GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
