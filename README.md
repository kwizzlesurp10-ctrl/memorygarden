# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed, return to tend it, and watch it advance through eight growth stages—from **seed** to **elder**—on an infinite canvas. No account required: your garden lives locally in the browser, with optional cloud sync for metadata only. Cross-pollinate two memories into hybrids, dream up new plants from a single idea, earn dew and starlight as you reflect, and let the garden's weather mirror how your memories feel. Never rushed, never noisy—always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Eight growth stages** — `seed → sprout → seedling → young → bud → bloom → mature → elder`. Visits, reflections, and time since planting all advance growth; vitality metrics can accelerate or slow the path.
- **Five emotional tones** — `happy`, `reflective`, `bittersweet`, `peaceful`, and `nostalgic`. AI classification (with keyword fallback) steers plant variety, palette, and growth character.
- **Garden weather** — Six moods (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) derived from the dominant tone across your garden—mixed when feelings are balanced.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Create connections** — Cross-pollinate two memories into a hybrid; cluster by tone; let spatial proximity reveal themes across seasons.
- **Four currencies** — Earn **dew** (planting, reflections), **sunlight** (revisiting old memories), **pollen** (cluster tending), and **starlight** (achievements) to unlock palettes, patterns, and adornments.
- **Adapt to seasons** — Light, mood, and optional ambient Web Audio follow real time and season so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the canvas. Thirteen plant varieties (flower, tree, succulent, vine, and more) with trait slots unlocked at each stage.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Cross-pollination**: Select two parent memories to blend traits into a hybrid offspring with its own genome.
- **Dream-a-Plant**: Describe an idea in words; the Garden AI returns a `HybridGenome` (with offline fallback) you can plant without a photo.
- **Fertilizer Boost**: Three tiers—Garden Boost (`standard`), Premium Fertilizer (`premium`), and Legendary Elixir (`legendary`)—accelerate growth with distinct particle effects (display prices only; no payment integration).

### ✨ AI-Powered Insights
- **Emotional tone**: Text classified via `claude-haiku-4-5` (fast) to steer variety, palette, and growth character.
- **Garden AI**: Poetic reflections via `claude-sonnet-4-6` that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Grouped by emotional tone (Joyful Moments, Looking Back, Quiet Calm, and more) when you have three or more memories.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants, weather particles, and layered backgrounds.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: Masonry gallery sized by growth stage—elder plants span the largest tiles.
- **Explore**: Browse demo community gardens (join/visit simulated; server wiring in progress).

### 🎁 Unlock System
- **Four currencies**: dew, sunlight, pollen, starlight—earned through planting, revisiting, cluster tending, and achievements.
- **15 unlockables**: palettes, patterns, and adornments across four rarity tiers (`common` → `legendary`).
- **Seven achievements**: green-thumb milestones that award starlight.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Create shared spaces with invite links and role-based access (`owner` / `collaborator` / `viewer`)—stored locally per device today.
- **Private sharing**: Generate link-based share IDs for individual memories (same-browser `localStorage` scope).

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time (`dawn` / `day` / `dusk` / `night`).
- **Seasonal mood**: Subtle shifts for spring, summer, autumn, and winter.
- **Garden weather**: Six derived moods with particle effects tied to emotional tone.
- **Ambient sound**: Optional Web Audio (brown noise + oscillators) driven by season, time, weather, and memory count—off by default.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: `Ctrl/Cmd+N` plant, `1–4` switch views, `Ctrl/Cmd+Shift+E` export, `?` cheat sheet.
- **Export**: Grid image, spatial garden view, or PDF "Memory Booklet" at standard (1080p) or high (4K) quality.
- **Protocol handlers**: `web+memorygarden://`, `web+plantmemory://`, and `web+viewmemory://` when installed as a PWA.
- **PWA**: Installable via manifest with share-target support; no service worker yet—offline reload requires a prior page load.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | React 19 + TypeScript 6 |
| Bundler | Vite 8 |
| Styling | Tailwind CSS 4 |
| Motion | Framer Motion 12 |
| Components | Radix UI primitives |
| Tests | Vitest 4 (578 cases across 22 files) |

### Persistence
- **`useKV`** (`@/lib/storage`) — namespaced **localStorage** keys (`memorygarden:{userId}:…`) scoped per auto-generated `LocalUser`.
- **`useMemoriesKV`** — photos and audio spill to **IndexedDB** (`memorygarden-photos` DB) when blobs exceed **32 KB**; smaller data URLs stay inline.
- **Legacy migration** — unscoped keys are copied to user-scoped keys on first load.

### AI provider chain (`getLLMProvider`)
1. `POST /api/llm` (disabled for the session after 503/404)
2. `window.spark.llm` (GitHub Spark environments)
3. Static empty fallback (`available: false`)

### Edge API routes (Vercel)

| Route | Env vars | Purpose |
|-------|----------|---------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Anthropic proxy — Haiku for classify, Sonnet for reflect |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional metadata sync (photos/audio stripped) |
| `/api/gardens` | `DATABASE_URL` | Community gardens via Neon Postgres (backend ready; UI not wired) |

The browser never sees API keys. All routes return **503** when unconfigured; the app degrades gracefully.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — standalone Python agent (CoinGecko); CI exercises it separately.
- **Micro-Forge** (`agents/micro_forge/`) — repo-scan agent runnable via `docker compose --profile agents`.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (22 in Docker; CI uses 20)
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
   Matches `.npmrc` and avoids peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Vite dev server on port **5173** (configurable via `VITE_PORT`).

### Docker Compose
| Profile | Command | Result |
|---------|---------|--------|
| *(default)* | `docker compose up --build` | nginx SPA on **8080** (`/healthz`) |
| `dev` | `docker compose --profile dev up dev` | Vite on **5173** inside Node 22 |
| `agents` | `docker compose --profile agents run --rm micro-forge` | Micro-Forge repo scan |

> `/api/llm` is a Vercel Edge route—not bundled in the static Docker image. AI features fall back gracefully in container-only deployments.

### Production build
```bash
npm run build
```
Output → **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint          # ESLint
npx tsc --noEmit      # Type-check (also run in CI)
npm test              # 578 Vitest cases
npm run test:coverage # v8 coverage on src/lib/**
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally.

### CI (`.github/workflows/ci.yml`)
Push/PR to `main` runs typecheck, lint, test+coverage, build, security audit, bundle-size gate (400 KB/chunk), and Volatility Sentinel tests.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Required env | Behavior when missing |
|-------|-------------|----------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | 503 — AI falls back to keyword heuristics / empty |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | 503 — sync toggle disabled |
| `/api/gardens` | `DATABASE_URL` (Neon Postgres) | 503 — community API unavailable |

### Sync details
- Opt-in via **Sync to cloud** in the header (`preferences.cloudSyncEnabled`).
- KV key pattern: `mg:user:{userId}`; max document **1 MB**; last-write-wins.
- Photos and audio are **stripped** before upload—only structured metadata syncs.

### User identity
- No login or GitHub OAuth. A `LocalUser` (UUID + generated name like `CalmKeeper`) is created on first visit and stored in `memorygarden:user`.
- Collaborative member IDs and `plantedBy` fields reference this local profile.

Pushes to **`main`** trigger CI then deploy. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage + IndexedDB). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles.
- **Export**: Grid image, spatial layout, or PDF booklet from the header export menu (`Ctrl/Cmd+Shift+E`).
- **Clearing data**: Remove site data in browser settings (localStorage + IndexedDB `memorygarden-photos`); no in-app "wipe all" button yet.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire `/api/gardens`** — Connect Explore view and community planting to the Neon Postgres backend (currently demo/mock data).
- **Server-backed sharing** — Cross-device share links and collaborative gardens beyond same-browser `localStorage`.
- **Offline PWA** — Service worker for cached shell reload; complete `web+memorygarden://` deep-link routing and `/share` target handler.
- **Collaboration** — Presence indicators, conflict-safe merges, and real multi-user tending.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **AI plant imagery** — Generate unique SVG or texture assets from memory tone and hybrid genomes.
- **Accessibility & i18n** — Audit across canvas, modals, and keyboard flows; wire `Ctrl/Cmd+K` search; extract copy for translation.
- **Performance at scale** — Canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. MemoryGarden auto-creates a local profile (`LocalUser` with a UUID and friendly name) on first visit. No login, OAuth, or GitHub Spark user required.

**Where does my data live?**  
On your device by default: scoped localStorage for structured data and IndexedDB (`memorygarden-photos`) for blobs over 32 KB. Optional cloud sync uploads metadata only when KV credentials are configured.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), never image bytes.

**Which LLM runs in production?**  
`/api/llm` → Anthropic: `claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections. Spark environments may expose `window.spark.llm` as a fallback.

**What are the unlock currencies?**  
**Dew** (planting, reflections), **sunlight** (revisiting memories 30+ days old), **pollen** (cluster tending), and **starlight** (achievements). Spend them on palettes, patterns, and adornments in the unlock panel.

**Does it work offline?**  
The garden loads and runs from local storage after the first page load. AI, cloud sync, and community features need network. Dream-a-Plant falls back to a local genome generator offline. No service worker yet—refreshing without network requires a prior successful load.

**How do I clear all my data?**  
Clear site data in your browser (localStorage + IndexedDB). There is no in-app "reset garden" button today; hybrid-only clearing is available in the Storage Shed panel.

**How do I contribute or report an issue?**  
GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
