# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow through eight living stages on an SVG garden scene—never rushed, never noisy, always yours. No account required: an anonymous local profile keeps everything on your device until you choose to sync metadata to the cloud.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone classification shapes variety, OKLCH palette, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Create connections** — Spatial proximity, cross-pollination between memories, and emotion-based clustering help you notice themes across seasons of your life.
- **Adapt to seasons** — Light, mood, weather, and atmosphere follow real time and calendar season so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the garden scene (`PlantMemoryModal`).
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story and earn unlock currencies each time you return.
- **Cross-pollination**: Pick two memories as parents to merge traits into a hybrid offspring with a rare variety mutation chance.
- **Fertilizer Boost**: Three tiers (Garden Boost +3 visits, Premium +8, Legendary +15) accelerate growth with distinct particle effects—display pricing only, no payment integration.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Dream-a-Plant**: Describe an idea in words; the LLM returns a hybrid genome you can plant or save as a seed in your shed.
- **Memory Clusters**: Emotion-heuristic groupings (not LLM clustering) so you can browse by mood as well as by place.

### 🎨 Five Views
- **Garden**: Pan-and-zoom SVG scene with animated plants, day/night palette, weather, parallax, and a magnifying loupe.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards by emotional tone for thematic exploration.
- **Bloom Wall**: Masonry gallery spotlight for memories that have reached full bloom.
- **Explore**: Community gardens browser (mock data today; backend API exists but is not yet wired).

### 🏚️ Garden Extras
- **Storage Shed**: Per-user seed vault for Dream-a-Plant hybrids, planted specimens, private notes, and shed style themes.
- **Remembrance Candles**: Private floating candles on water (up to 40) stored alongside shed data.
- **Unlocks & currencies**: Earn **dew** (planting, reflections), **sunlight** (revisiting old memories), **pollen** (cluster tending), and **starlight** (achievements) to unlock palettes, patterns, adornments, and more.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Shared spaces stored locally in KV—create, invite via URL token, and tend together on the same browser.
- **Private sharing**: Generate link-based access for specific memories (localStorage demo today—not yet server-backed).
- **Reactions & leaderboard**: Sprout, water, bloom, heart, and sparkle reactions plus contributor rankings in shared gardens.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local clock (`dawn`, `day`, `dusk`, `night`).
- **Seasonal mood**: Subtle shifts for spring, summer, autumn, and winter.
- **Garden weather**: Computed mood drives sunny, mist, rain, golden-haze, and partly-cloudy overlays.
- **Ambient sound**: Optional Web Audio engine that tracks time of day and season.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet; `Ctrl/Cmd+N` plant, `K` search, `1–4` views).
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell; manifest declares protocol handlers and share target.
- **Export**: Full-garden image, PDF, and garden-view export from settings.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state owned by `App.tsx`; no external global store.
- **Vite 8** — Dev server (port **5173**) and production bundle to `dist/`.
- **Tailwind CSS 4** — Layout and responsive styling with OKLCH theme tokens.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.) from `src/components/ui/`.
- **Garden rendering** — `GardenCanvas.tsx` draws an SVG scene with `SeededPlantSvg` (not an HTML5 canvas); supports drag, loupe, weather, and cluster paths.
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage**; photos and audio spill to **IndexedDB** (`memorygarden-photos`) when blobs exceed ~32 KB.
- **AI** — `getLLMProvider()` in `src/lib/llm-client.ts` resolves: HTTP **`POST /api/llm`** (Vercel Edge → Anthropic) → optional **GitHub Spark** `window.spark.llm` → static empty fallback. The browser never sees `ANTHROPIC_API_KEY`.

### Edge API routes
| Route | Env vars | Purpose |
|-------|----------|---------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Classification (Haiku) and reflections (Sonnet); 503 without key |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional metadata sync to Vercel KV/Upstash; no photos or audio |
| `/api/gardens` | `DATABASE_URL` (Neon Postgres) | Community gardens CRUD; UI not yet wired |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent (CoinGecko); CI runs `pytest` from its own directory.
- **Micro-Forge agents** (`agents/micro_forge/`) — Python reflection/expansion/guardian agents; run via `docker compose --profile agents`.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (current LTS recommended; CI uses Node 20)
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
Opens the Vite dev server on port **5173** (configurable in `vite.config.ts`).

### Production build
```bash
npm run build
```
Output is written to **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint      # ESLint
npm test          # Vitest single run
npm run test:watch
npm run test:coverage
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

### Docker
```bash
docker compose up --build              # Production SPA → http://localhost:8080
docker compose --profile dev up dev    # Vite dev server → http://localhost:5173
```
The static nginx image does **not** include `/api/*` Edge routes—AI and sync fall back gracefully inside Docker.

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, unlock/currency paths, trait helpers, and local-user migration.

CI (`.github/workflows/ci.yml`) also runs TypeScript `--noEmit`, bundle-size gates (400 KB/chunk), security audit, and the Volatility Sentinel Python suite.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Required env | Behavior |
|-------|--------------|----------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Proxies classification and reflection prompts to Anthropic |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional per-user metadata sync to Vercel KV/Upstash |
| `/api/gardens` | `DATABASE_URL` | Community gardens REST API (Neon Postgres); UI not wired yet |

Without `ANTHROPIC_API_KEY`, AI features degrade cleanly while the garden keeps working. Without KV credentials, sync returns **503** and the header toggle reflects real status so users are never misled.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (`memorygarden:{userId}:*` keys in localStorage + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **Anonymous profile**: `getLocalUser()` auto-creates a UUID-scoped profile (e.g. `CalmDreamer`)—no GitHub OAuth or account required.
- **Cloud sync scope**: Only structured fields (text, reflections, position, traits, preferences)—never `photoUrl` or `audioRecordings`.
- **AI payloads**: Classification uses truncated memory text (≤600 chars); reflections may include ≤50-char snippets from up to three nearby memories—never photos or account profiles.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Wire `ExploreView` to `/api/gardens` (Neon backend exists; UI currently uses mock data).
- **Server-backed sharing** — Replace localStorage-only share links with durable, cross-device access.
- **Collaboration sync** — Multi-device merge and conflict-safe tending for shared gardens.
- **AI plant imagery** — Connect `PlantStyleCustomizer` preferences to an image-generation pipeline (`generatedPlantImages` today is stubbed).
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across SVG garden, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue scene virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional and only active when KV credentials are configured and you enable **Sync to cloud**.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (Haiku for classify, Sonnet for reflect). Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**Do I need an account?**  
No. MemoryGarden creates an anonymous local profile automatically. Collaborative gardens and share links work within the same browser today.

**What are unlock currencies?**  
**Dew** from planting and reflections, **sunlight** from revisiting memories older than 30 days, **pollen** from tending clusters, and **starlight** from achievements. Spend dew to re-roll plant genetics (5 dew per roll).

**Does the app work offline?**  
Yes for planting, tending, growth, and unlocks—all local. AI and cloud sync require network access to their respective `/api/*` routes.

**How do I clear my data?**  
Remove site data for the origin in your browser settings, or use export-then-clear flows in app settings. IndexedDB database `memorygarden-photos` holds large blobs separately from localStorage keys.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
