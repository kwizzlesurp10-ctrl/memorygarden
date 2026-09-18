# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow through eight organic stages on an infinite canvas. A **LocalUser** identity (`getLocalUser()` in `src/lib/local-user.ts`) is created in your browser—no account signup—while **`useMemoriesKV`** keeps structured garden data in namespaced **localStorage** and heavy photo blobs in **IndexedDB**. Nothing leaves your device unless you turn on optional cloud sync or share a link you choose.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to care, time, and reflection:

- **Grow over time** — Eight stages (`seed` → `sprout` → `seedling` → `young` → `bud` → `bloom` → `mature` → `elder`) driven by visits, reflections, and vitality—not a fixed calendar.
- **Reflect emotions** — Five tones (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer variety, OKLCH palettes, and growth character via AI-assisted classification when `/api/llm` is configured.
- **Living atmosphere** — Seasonal light plus six weather moods (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) keep the canvas tied to real time.
- **Earn & spend** — Four garden currencies (`dew`, `sunlight`, `pollen`, `starlight`) and **18** unlockable cosmetics pair with **7** achievements in `unlock-system.ts`.
- **Cross-pollinate** — Select two memories on the canvas to blend traits into hybrid genomes; **Dream-a-Plant** (`dreamPlant`) and the **Storage Shed** (`shed-storage.ts`) extend experimentation with grafted hybrids and saved seeds.
- **Create connections** — Spatial proximity, filters, and AI-suggested clusters help you notice themes across seasons of your life.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (IndexedDB-backed), write about the moment, optional location/audio, and watch your memory sprout on the canvas.
- **Tending**: Revisit to water & reflect; trait slots unlock per stage (palette → pattern → adornment → accent → aura at **elder**).
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights
- **Emotional tone**: `getLLMProvider()` → `POST /api/llm` with `kind: 'classify'` (Haiku: `claude-haiku-4-5-20251001`) when `ANTHROPIC_API_KEY` is set; graceful fallbacks include optional GitHub Spark `window.spark`.
- **Garden AI**: Reflections use Sonnet (`claude-sonnet-4-6`) with short neighboring text—never image bytes.
- **Memory Clusters**: Thematic or temporal groupings for browsing by mood as well as place.

### 🎨 Five Views
| View | Role |
|------|------|
| **Garden** | Infinite pan/zoom canvas with animated plants |
| **Timeline** | Chronological path through planted moments |
| **Clusters** | Grouped cards for thematic exploration |
| **Explore** | Discovery-oriented layout across the garden |
| **Bloom Wall** | Gallery spotlight; tile span grows toward **elder** |

### 👥 Collaboration & Sharing
- **Local collaborative gardens**: Invite links and member panels via KV-scoped `collaborative-gardens` data.
- **Community gardens (optional)**: `GET/POST /api/gardens` backed by **Neon** (`DATABASE_URL`)—returns **503** when the database is not configured; UI degrades without implying live multiplayer.
- **Private sharing**: Per-memory share URLs (`?share=`) you control; shares can unlock adornments in the trait system.

### 🌓 Living Atmosphere
- **Day / night** and **seasonal** gradients from `garden-helpers.ts`.
- **Ambient sound** optional; tracks time of day and season when enabled.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: `?` opens the cheat sheet.
- **PWA**: `public/manifest.json` — standalone install, share target, and `web+memorygarden` / `web+plantmemory` / `web+viewmemory` protocol handlers; **no service worker yet** (offline cache is a roadmap item).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | **React 19.2** + **TypeScript 6** |
| Bundler | **Vite 8** (`@vitejs/plugin-react-swc`) |
| Styling | **Tailwind CSS 4** + OKLCH theme tokens |
| Motion | **Framer Motion** springs |
| Primitives | **Radix UI** (dialogs, tabs, etc.) |
| Persistence | `useKV` / **`useMemoriesKV`** — `memorygarden:` keys per **LocalUser**; photos in **IndexedDB** |
| AI client | **`getLLMProvider()`** (`llm-client.ts`): HTTP `/api/llm` → Spark SDK → static no-op |

### Vercel Edge routes
| Route | Purpose | Required env |
|-------|---------|----------------|
| **`POST /api/llm`** | Anthropic proxy (`classify` / `reflect`) | `ANTHROPIC_API_KEY` |
| **`GET/POST /api/sync`** | Per-user JSON blob in Upstash/Vercel KV (LWW, **1 MB** cap) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| **`/api/gardens`** | Public community gardens CRUD | `DATABASE_URL` (Neon) |

Static hosting: `vercel.json` SPA rewrite + CSP headers. Docker ships the **nginx** production image on **8080** (`/healthz`); Edge routes are **not** in the static image—local Docker uses the same graceful AI/sync fallbacks as production without keys.

### Quality & sub-projects
- **578** Vitest tests across **22** files (`npm test`).
- **Micro-Forge** (`agents/micro_forge/`, `docker compose --profile agents`) — optional Python scan/report agent.
- **Volatility Sentinel** (`volatility-sentinel/`) — standalone CoinGecko Python example; CI runs `pytest` separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (matches CI) or current LTS
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
   Aligns with `.npmrc` for Vite 8 peer resolution.

### Development
```bash
npm run dev
```
Vite on **5173** by default.

**Docker (optional)**
```bash
docker compose up --build              # production SPA → http://localhost:8080
docker compose --profile dev up dev      # hot reload → http://localhost:5173
docker compose --profile agents run --rm micro-forge
```

### Production build
```bash
npm run build
```
Output in **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint
npm test                 # 578 tests
npm run test:coverage
```

### Preview
```bash
npm run preview
```

### CI (`.github/workflows/ci.yml`)
On every push/PR to `main`: **tsc --noEmit**, ESLint, Vitest + coverage artifact, production **build**, npm audit (high+), **bundle-size** guard (400 KB/chunk), **pnpm-lock.yaml** frozen check, and **volatility-sentinel** pytest.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
### Vercel (recommended)
1. Connect the repo; build command `npm run build`, output **`dist/`**.
2. Set Edge env vars as needed:

| Variable | Route | When missing |
|----------|-------|----------------|
| `ANTHROPIC_API_KEY` | `/api/llm` | **503** — tone defaults, no reflections |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | `/api/sync` | **503** — local-only mode |
| `DATABASE_URL` | `/api/gardens` | **503** — community gardens unavailable |

**Sync semantics**: One JSON document per user (`mg:user:<id>`). Last-write-wins; payloads over **1 MB** return **413**. Photos stay on-device—only structured fields sync.

**LocalUser lifecycle**: Clearing site data or rotating storage removes the anonymous id; export from settings before reset if you need a portable archive.

**Docker production**: `MEMORYGARDEN_PORT` (default **8080**); health check `GET /healthz`. Edge APIs remain on Vercel unless you proxy them separately.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (scoped keys + IndexedDB). Cloud sync is opt-in metadata only.
- **AI payloads**: Truncated text for classification; reflections may include short snippets from nearby memories—never photos or OAuth profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable backup.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens UX** — Clearer empty/error states when `DATABASE_URL` is unset; richer planting and presence once Neon is live.
- **Offline PWA** — Service worker + cache strategy for installed clients (manifest and share target already ship).
- **Command palette** — Wire `cmdk` primitives for global navigation (`Ctrl+K` / `⌘K`).
- **Collaboration** — Conflict-safe merges and notifications for shared local gardens.
- **Export & print** — Higher-fidelity PDF/poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization for 500+ plants; optional on-device or gated AI imagery for thumbnails.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: a generated **LocalUser** id scopes `memorygarden:*` keys in localStorage; photos live in IndexedDB via `useMemoriesKV`. Optional **`/api/sync`** mirrors structured fields to KV when credentials exist.

**Are photos sent to the AI?**  
No. `/api/llm` receives text prompts only (classification and reflection paths).

**Which models run in production?**  
`api/llm.ts` maps `kind: 'classify'` → `claude-haiku-4-5-20251001` and `kind: 'reflect'` → `claude-sonnet-4-6`. Legacy Spark hosts may still expose `window.spark.llm` as a client fallback.

**What are dew, sunlight, pollen, and starlight?**  
In-garden currencies (`CurrencyWallet`) earned through tending, achievements, and milestones—spent on boosts and unlocks, not real money.

**Why does sync show unavailable?**  
`/api/sync` returns **503** without KV env vars, or **413** if the merged document exceeds **1 MB**. Photos are excluded from sync by design.

**How do I reset or export?**  
Use settings export for a JSON archive; clearing browser storage generates a new LocalUser and does not delete remote KV unless you POST an empty document with the same id.

**How do I contribute?**  
GitHub issues and pull requests on this repository. Run `npm test` (578 tests) before opening a PR.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
