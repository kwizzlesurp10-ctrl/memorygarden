# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed, return to tend it, and watch it advance through eight growth stages—from seed to elder—on an infinite canvas. No account required: an anonymous **LocalUser** identity is created on first visit, and everything lives in your browser until you opt into cloud sync. Earn dew, sunlight, pollen, and starlight as you reflect; cross-pollinate two memories into a hybrid; or dream up a new plant with Garden AI. The garden breathes with you—day and night, season and weather—never rushed, never noisy, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) driven by visits, reflections, and vitality metrics. Neglect and care both leave traces you can feel.
- **Reflect emotions** — Five tones (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer plant variety, palette, and growth character via AI classification with keyword fallback.
- **Encourage reflection** — Add notes when you revisit; ask the Garden AI for gentle, poetic insights that weave in nearby memories without drowning your voice.
- **Create connections** — Spatial proximity, memory clusters, and **cross-pollination** (two parents → one hybrid child) help you notice themes across seasons of your life.
- **Adapt to atmosphere** — Six weather moods (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) derive from your garden's dominant emotion; day/night and seasonal light keep the canvas tied to the world outside the screen.
- **Reward tending** — Four non-monetary currencies (dew, sunlight, pollen, starlight) unlock palettes, patterns, adornments, and frames as you plant, reflect, and earn achievements.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (large blobs spill to IndexedDB above 32 KB), write about the moment, attach optional voice notes or ambient recordings, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Cross-pollination**: Select two parent memories to plant a hybrid child with blended traits and lineage.
- **Dream-a-Plant**: Ask Garden AI to dream up a new plant genome from a short prompt—falls back to local generation when offline.
- **Fertilizer Boost**: Three tiers (Garden Boost +3 visits, Premium +8, Legendary +55) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights
- **Emotional tone**: Text classified via `/api/llm` (Haiku) with keyword fallback; steers variety, palette, and growth character.
- **Garden AI**: Poetic reflections (Sonnet) that connect up to three nearby memories without overwhelming your voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.

### 🎨 Five Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants and layered backgrounds.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.
- **Explore**: Browse public community gardens (mock data today; `/api/gardens` backend ready).

### 🏆 Unlocks & Achievements
- **17 unlockables** across palettes, patterns, adornments, and frames—purchased with dew, sunlight, pollen, or starlight.
- **7 achievements** (First Reflection, Green Thumb, Master Gardener, Night Owl, Memory Keeper, Time Traveler, Elder Grove) award starlight for milestones.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Local shared spaces with invite links (`?invite=…&token=…`), member panels, and reactions (sprout, water, bloom, heart, sparkle).
- **Private sharing**: Share specific memories via link (`?share=…`) with access you control.
- **Cloud sync**: Optional metadata sync to Vercel KV when configured; photos and audio stay on-device.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time (dawn, day, dusk, night).
- **Garden weather**: Six moods derived from your dominant emotional tone.
- **Ambient sound**: Web Audio synthesis (brown noise + soft oscillators) driven by season, time of day, and weather—toggle in the header.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: `Ctrl/Cmd+N` plant, `1–4` switch views, `Ctrl/Cmd+Shift+E` export, `?` cheat sheet.
- **Protocol handlers**: Three deep-link schemes (`web+memorygarden`, `web+plantmemory`, `web+viewmemory`) when installed as a PWA.
- **Export**: Memory grid, garden view, or multi-page booklet as PNG (standard or 4K).
- **PWA**: Installable via manifest for an app-like shell; no service worker yet—offline caching is on the roadmap.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript 6** — UI and state; no external global store.
- **Vite 8** — Dev server and production bundle.
- **Tailwind CSS 4** — Layout and responsive styling via `@tailwindcss/vite`.
- **Framer Motion 12** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Zod 4** — Runtime validation for external input.

### Persistence
- **`useKV`** (`@/lib/storage`) scopes keys per **LocalUser** in **localStorage** (`memorygarden:<userId>:…`).
- **`useMemoriesKV`** transparently spills photo and audio blobs above **32 KB** into **IndexedDB** (`idb://` references).
- Legacy unscoped keys are migrated automatically on first visit.

### AI provider chain (`getLLMProvider`)
1. `POST /api/llm` → Anthropic (server-side key)
2. `window.spark.llm` (GitHub Spark environments, if present)
3. Static empty fallback (keyword classification, local genome generation)

### Edge API routes (Vercel)

| Route | Env vars | Purpose |
|---|---|---|
| `POST /api/llm` | `ANTHROPIC_API_KEY` | Classification (Haiku) + reflections (Sonnet) |
| `GET/POST /api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional metadata sync (1 MB limit, last-write-wins) |
| `GET/POST /api/gardens/*` | `DATABASE_URL` | Community gardens via Neon Postgres (server ready; frontend uses mock data today) |

### Quality
- **578 Vitest tests** across 22 files (growth logic, storage, LLM client, unlocks, traits, and more).
- CI runs typecheck, lint, test, coverage, build, bundle-size gate (400 KB/chunk), security audit, and lockfile validation.

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent (CoinGecko); CI exercises it separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (matches CI)
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
   This matches the repo's `.npmrc` and avoids common peer-resolution issues with Vite 8.

### Development
```bash
npm run dev
```
Opens the Vite dev server (default port **5173**).

### Docker
```bash
# Production SPA (nginx on port 8080)
docker compose up --build

# Vite dev server (port 5173)
docker compose --profile dev up dev

# Micro-Forge agent report (stdout)
docker compose --profile agents run --rm micro-forge
```
Note: `/api/llm` is a Vercel Edge route—not included in the static Docker image.

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint      # ESLint
npm test          # 578 Vitest tests
npm run test:coverage
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Required env vars | Behavior when missing |
|---|---|---|
| `POST /api/llm` | `ANTHROPIC_API_KEY` | Returns `503`; client falls back to keyword classification and local genome generation |
| `GET/POST /api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Returns `503`; header sync toggle backs off gracefully |
| `GET/POST /api/gardens/*` | `DATABASE_URL` (Neon Postgres) | Community garden API unavailable; Explore view uses mock data |

Pushes to **`main`** trigger CI (typecheck, lint, test, coverage, build, bundle-size gate) then Vercel deploy. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

### Identity & sync
- **LocalUser**: Anonymous identity auto-created on first visit (`GentleGardener`-style login); no sign-up required.
- **Cloud sync**: Opt-in via preferences; syncs `{ memories, preferences, updatedAt }` keyed `mg:user:<id>` with last-write-wins semantics and a 1 MB document limit.
- **On-device only**: Photos and audio never leave the browser (IndexedDB); only structured metadata participates in sync.

### Privacy & Data
- **Local-first**: Memories and media default to the browser. Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles.
- **Export**: Memory grid, garden view, or booklet PNG from the export modal (`Ctrl/Cmd+Shift+E`).
- **Data clearing**: Settings panel can wipe local storage and IndexedDB when you want a fresh start.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire `/api/gardens`** — Connect Explore and CommunityGardenView to the live Neon backend instead of mock data.
- **Server-backed sharing** — Persist shared-memory links and collaborative gardens beyond local KV.
- **Offline PWA** — Add a service worker for installable offline access and cached assets.
- **AI plant imagery** — Generate visual plant art from hybrid genomes and emotional tone.
- **Global search** — Wire `Ctrl/Cmd+K` to a command palette across memories, views, and settings.
- **Accessibility & i18n** — Audit canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. A **LocalUser** identity is created automatically on first visit. Cloud sync is optional and only active when KV credentials are configured on the server.

**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for blobs above 32 KB. Cloud sync of metadata is opt-in.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (`claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections). Spark environments may expose `window.spark.llm` as a fallback.

**What are the unlock currencies?**  
Four non-monetary types: **dew** (planting, reflections), **sunlight** (revisiting old memories), **pollen** (cluster tending), and **starlight** (achievements). Spend them on palettes, patterns, adornments, and frames.

**Does it work offline?**  
The garden works offline for local tending, keyword classification, and local genome generation. AI reflections and cloud sync require network access. PWA install is supported but there is no service worker yet.

**How do I clear my data?**  
Use the data-clearing option in Settings to wipe localStorage and IndexedDB for a fresh start.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
