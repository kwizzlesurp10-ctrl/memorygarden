# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow through eight living stages on an infinite SVG garden—never rushed, never noisy, always yours. Everything starts local-first in your browser; optional cloud sync and community APIs extend the garden when you deploy with the right credentials.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone classification (with keyword fallback offline) shapes variety, palette, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Create connections** — Spatial proximity, emotional-tone clusters, and cross-pollination help you notice themes across seasons of your life.
- **Adapt to seasons** — Light, mood, weather, and atmosphere follow real time and season so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, pick a plant variety, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Eight growth stages**: From seed to elder—visits, reflections, and age all contribute to vitality and size.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.
- **Per-plant cosmetics**: Unlock palettes, patterns, adornments, accents, and auras as plants mature; earn dew, sunlight, pollen, and starlight through tending.

### 🧬 Dream-a-Plant & Cross-Pollination
- **Dream-a-Plant**: Describe an idea and the Garden AI (or a local fallback) generates a hybrid genome—name, essence, palette, and SVG motif—for planting on the canvas.
- **Storage Shed**: Save dreamed seeds, style your shed (antique, storybook, glass, modern), and keep private Remembrance Candles with dates and notes.
- **Cross-pollination**: Merge two memories into a hybrid plant with combined traits and parent lineage.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified to steer plant variety, palette, and growth character (LLM when `/api/llm` is available; keyword heuristics offline).
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Thematic groupings by emotional tone (heuristic, not LLM)—browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom SVG scene with animated plants, weather overlays, and cluster paths.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration by emotional tone.
- **Bloom Wall**: A masonry gallery spotlight for memories that have reached full bloom.
- **Explore**: Preview community garden concepts (demo data today; server API ready for wiring).

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Create shared spaces stored locally; invite links with token-based access and role-based permissions (owner, collaborator, viewer).
- **Activity feed & reactions**: See recent plants and reflections; react with sprout, water, bloom, heart, or sparkle.
- **Private sharing**: Share specific memories via link-based snapshots (local KV today—same-browser scope until server-backed shares land).
- **Community gardens API**: Edge route backed by Neon Postgres for public gardens (`/api/gardens`)—backend ready; Explore UI uses demo data until wired.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time (updates every minute).
- **Seasonal mood**: Subtle shifts for the current season and computed garden weather (sunny, mist, rain, golden haze, and more).
- **Ambient sound**: Optional audio engine that tracks time of day and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet; `⌘/Ctrl+N` to plant; `1–4` for views).
- **Search & filters**: Text, emotional tones, stages, date ranges, and locations.
- **Export**: PNG collage, PDF booklet, and garden-view image—all client-side.
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell with share-target and protocol registration.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state owned in `App.tsx`; no external global store.
- **Vite 8** — Dev server (port 5173) and production bundle to `dist/`.
- **Tailwind CSS 4** — Layout and responsive styling with OKLCH color tokens.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **SVG garden scene** — Primary view renders plants via `GardenSceneSvg` (not HTML5 Canvas; canvas is used only for export rasterization).
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage** (`memorygarden:<userId>:<key>`); photos and audio use **IndexedDB** blob refs (`idb://`) so you stay under typical string quotas.
- **Local user profile** — Auto-generated display name and UUID in `memorygarden:user` (no GitHub auth required to tend your garden).
- **AI** — `getLLMProvider()` resolves: `POST /api/llm` (Vercel Edge → Anthropic) → optional **GitHub Spark** `window.spark.llm` → static empty fallback. The browser never sees API keys.

### Edge API routes (Vercel)
| Route | Env vars | Purpose |
|-------|----------|---------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Tone classification (Haiku), reflections & Dream-a-Plant JSON (Sonnet) |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional metadata sync to Upstash-compatible KV (photos stay on-device) |
| `/api/gardens` | `DATABASE_URL` | Community gardens CRUD via Neon Postgres |

Without credentials each route returns **503** and the app degrades gracefully (offline heuristics, local-only mode).

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); CI exercises it from its own directory.
- **Docker** — Static nginx image on port 8080; Edge routes are not included in the container (AI/sync fall back locally).
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (current LTS recommended; matches CI)
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
Opens the Vite dev server on port **5173** (unless configured otherwise).

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
CI also runs `tsc --noEmit`, bundle-size checks, and npm audit.

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

### Docker (optional)
```bash
docker compose up --build        # nginx on 8080
docker compose --profile dev up dev   # Vite on 5173
```

## Testing

Vitest + jsdom drives automated checks for garden logic, storage edge cases, LLM client wiring, unlock/trait systems, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage` (scopes `src/lib/**/*.ts`)

Typical areas covered include growth and stage logic, unlock/currency paths, trait helpers, local user migration, memory search, bloom-wall layout, and HTTP LLM behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Required env vars | Behavior when missing |
|-------|-------------------|------------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | AI features use keyword/heuristic fallbacks |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Cloud sync disabled; local-only garden |
| `/api/gardens` | `DATABASE_URL` (Neon Postgres) | Community API unavailable; Explore uses demo data |

1. **`/api/llm`** — Proxies classification and reflection prompts to Anthropic. Models: Haiku for tone, Sonnet for reflections and Dream-a-Plant JSON.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash**. Photos and audio stay on-device (IndexedDB); only structured fields participate when sync is on. Last-write-wins merge with a 1 MB document cap.
3. **`/api/gardens`** — Public community gardens backed by Neon. Requires Postgres tables (`gardens`, `garden_members`, `garden_memories`, `garden_activity`); provision schema separately—no migration files ship in-repo yet.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable archive (PNG, PDF, or structured backup).
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Wire Explore UI to `/api/gardens` and Neon; ship SQL migrations and real-time presence for joint tending.
- **Server-backed sharing** — Cross-device share links and collaborative gardens beyond same-browser KV.
- **AI plant visuals** — Complete the generation pipeline behind `PlantStyleCustomizer` (preferences exist; image generation not yet wired).
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across SVG canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Canvas/SVG virtualization and asset prioritization for very large gardens (500+ plants).
- **Richer plant SVGs** — Expand procedural variety and hybrid motifs for Dream-a-Plant genomes.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional and only active when KV credentials are configured.

**Do I need an account?**  
No. MemoryGarden creates a local profile (display name + UUID) automatically. GitHub Spark hosts may still expose `window.spark` for LLM fallback, but auth is not required to plant and tend.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (`claude-haiku-4-5` for classification, `claude-sonnet-4-6` for reflections). Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**How do unlocks and currency work?**  
Tending earns dew, sunlight, pollen, and starlight. Plants unlock cosmetic traits (palettes, patterns, adornments) as they advance through growth stages. Achievements grant bonus starlight; rerolling traits costs dew.

**Does the app work offline?**  
Yes. Plant, tend, grow, dream hybrids, use the Storage Shed, export, and browse clusters—all without a backend. AI features fall back to keyword tone classification and static reflection copy.

**How do I clear my data?**  
Use settings export/backup first if needed, then clear site data for the origin (localStorage + IndexedDB). Cloud sync metadata in KV is separate and can be overwritten on next sync.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
