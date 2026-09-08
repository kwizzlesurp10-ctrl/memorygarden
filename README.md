# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter. Plant each memory like a seed on an infinite canvas, return to tend it through eight growth stages, and watch it bloom—never rushed, never noisy, always yours. Dream new hybrids, cross-pollinate memories, earn garden currencies as you reflect, and let the scene shift with day, season, and weather while your photos and stories stay local-first on your device.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Each memory advances through eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) as you visit, reflect, and optionally apply fertilizer boosts.
- **Reflect emotions** — Text is classified into emotional tones (happy, reflective, bittersweet, peaceful, nostalgic) that steer plant variety, palette, and growth character.
- **Encourage reflection** — Add notes when you revisit; ask Garden AI for gentle, poetic insights grounded in your words—not your photos.
- **Create connections** — Cross-pollinate two memories into a hybrid plant; spatial proximity and emotion-based clusters help you notice themes across seasons of your life.
- **Dream & store** — Dream-a-Plant turns an idea into a hybrid genome saved in your Storage Shed; Remembrance Candles float on the water for people you want to honor.
- **Adapt to seasons** — Day/night lighting, seasonal mood, optional ambient sound, and weather effects keep the garden tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored in IndexedDB), write about the moment, and watch your memory sprout on the infinite canvas.
- **Tending**: Revisit memories to advance growth; reflections deepen the story and earn unlock currencies.
- **Cross-pollination**: Blend two memories into a hybrid plant with merged traits, genetics, and parent links.
- **Fertilizer Boost**: Three cosmetic tiers—Garden Boost, Premium Fertilizer, Legendary Elixir—accelerate growth with distinct particle effects (no real payments).

### ✨ AI-Powered Insights
- **Emotional tone**: Classification steers plant variety, palette, and growth character; keyword fallback when the LLM is unavailable.
- **Garden AI**: Poetic reflections that connect nearby memory text without overwhelming your voice.
- **Dream-a-Plant**: Describe an idea; the LLM returns a hybrid genome (or a local fallback) you can save to the Storage Shed and plant later.
- **Memory Clusters**: Emotion-heuristic groupings (not LLM-driven) so you can browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Pan-and-zoom canvas with SVG plants, Storage Shed, Dream panel, and floating Remembrance Candles.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: Gallery spotlight for memories at bloom stage and beyond.
- **Explore**: Community Gardens browser (demo data today; `/api/gardens` ready for server-backed gardens).

### 🎁 Unlocks & Customization
- **Garden currencies**: Earn dew, sunlight, pollen, and starlight by planting, reflecting, revisiting old memories, tending clusters, and achievements.
- **Cosmetics**: Unlock palettes, patterns, adornments, and frames; customize plants via the trait system.
- **Achievements**: Seven milestones from First Reflection to Elder Grove.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Local-first shared spaces with invite links and owner/collaborator/viewer roles.
- **Private sharing**: Generate read-only share links for individual memories (reflections stay private).

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood & weather**: Subtle shifts for season, garden mood, and weather effects.
- **Ambient sound**: Optional audio that tracks time of day and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation across garden, timeline, clusters, and bloom (`?` opens the cheat sheet).
- **Protocol handlers**: `web+memorygarden://`, `web+plantmemory://`, and `web+viewmemory://` when installed as a PWA.
- **PWA**: Standalone shell via manifest; install for app-like chrome and protocol registration (no offline service worker yet).
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript 6** — UI and state (no external store; handlers flow from `App.tsx`).
- **Vite 8** — Dev server (port 5173) and production bundle to `dist/`.
- **Tailwind CSS 4** — Layout and responsive styling via `@tailwindcss/vite`.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI + shadcn-style components** — Accessible dialogs, tabs, and controls.
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per anonymous local user in **localStorage** (`memorygarden:` prefix); photos and audio spill to **IndexedDB** via `useMemoriesKV` when blobs exceed ~32KB.
- **AI** — `getLLMProvider()` resolves: HTTP **`POST /api/llm`** (Vercel Edge → Anthropic: Haiku for classify, Sonnet for reflect) → optional **`window.spark.llm`** → static fallback. The browser never sees `ANTHROPIC_API_KEY`; missing routes return `503` and the app degrades gracefully.

### Edge API routes (Vercel)
| Route | Purpose | Required env |
|-------|---------|--------------|
| `/api/llm` | Tone classification, reflections, Dream-a-Plant JSON | `ANTHROPIC_API_KEY` |
| `/api/sync` | Optional metadata sync (no photos/audio) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `/api/gardens` | Community garden CRUD (Neon Postgres) | `DATABASE_URL` |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent (CoinGecko); CI runs its pytest suite separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 22+ (current LTS recommended)
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
   Matches `.npmrc` and avoids peer-resolution issues with Vite 8 + `@vitejs/plugin-react-swc`.

### Development
```bash
npm run dev
```
Opens the Vite dev server on **5173** by default.

Or via Docker Compose (dev profile):
```bash
docker compose --profile dev up
```

### Production build
```bash
npm run build
```
Output goes to **`dist/`** for static hosting.

Or serve via nginx in Docker (port **8080**):
```bash
docker compose up memorygarden
```

### Quality checks
```bash
npm run lint      # ESLint
npm test          # Vitest single run
npx tsc --noEmit  # Type-check (also run in CI)
```

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally.

## Testing

Vitest (jsdom) covers garden logic, storage, LLM client wiring, unlocks, traits, protocol routing, and more under `src/lib/__tests__/`.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

CI also enforces a **400KB per-chunk** bundle-size gate and validates the lockfile with pnpm.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Env vars | Behavior without credentials |
|-------|----------|------------------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Returns `503`; app uses keyword tone + static reflections |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Returns `503`; local-only persistence |
| `/api/gardens` | `DATABASE_URL` (Neon Postgres) | Returns `503`; Explore view uses demo data |

**Sync details**: Only structured metadata syncs (memories, preferences)—photos and audio remain in IndexedDB. Documents cap at ~1MB; last-write-wins. Enable via **Sync to cloud** in preferences; the header control reflects real status and backs off on `503`.

**Docker Compose profiles**:
- Default — nginx on **8080** serving `dist/` (no Edge routes in the static image)
- `dev` — Vite on **5173**
- `agents` — Python micro-forge runner

Pushes to **`main`** run typecheck, lint, test (with coverage), build, bundle-size gate, and Volatility Sentinel pytest. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 compatible.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (scoped localStorage + IndexedDB). No account required—an anonymous local profile is generated on first visit.
- **AI payloads**: Classification uses truncated text; reflections may include short snippets from nearby memories—never photos or profile data.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Wire Explore view to `/api/gardens` (Neon) instead of hardcoded demo data; real join/visit/plant/water flows.
- **Server-backed sharing** — Move share links and collaborative gardens from localStorage to durable server state with conflict-safe merges.
- **Offline PWA** — Add a service worker for installable offline use; implement the manifest `share_target` route.
- **AI plant imagery** — Optional generated visuals for Dream-a-Plant hybrids beyond SVG motifs.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio. Cloud sync of metadata is optional and only active when KV credentials are configured on the server.

**Do I need an account?**  
No. MemoryGarden generates an anonymous local profile (e.g. “GentleGardener”) on first visit. There is no sign-in flow.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`POST /api/llm`** → Anthropic (`claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections). GitHub Spark environments may still expose `window.spark.llm` as a client fallback.

**What are dew, sunlight, pollen, and starlight?**  
Unlock currencies earned by planting, reflecting, revisiting old memories, tending clusters, and achievements. Spend them on cosmetic palettes, patterns, adornments, and frames.

**Does it work offline?**  
The garden runs fully offline for local planting and tending. AI features and optional cloud sync require network access; there is no service worker cache yet.

**How do I clear my data?**  
Use settings to export first if needed, then clear browser storage for the site (localStorage + IndexedDB).

**How do I contribute or report an issue?**  
Open GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
