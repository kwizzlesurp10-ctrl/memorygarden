# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first space for the moments that matter. No account required — your garden lives in the browser under an anonymous local profile, with photos in IndexedDB and structured data in scoped localStorage. Plant each memory like a seed, return to tend it through eight growth stages up to **elder**, and watch it take root on an infinite canvas — never rushed, never noisy, always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) advance with visits, reflections, and age; neglect and care both leave traces you can feel.
- **Reflect emotions** — Five tones (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`) steer variety, palette, and growth character via AI classification, with keyword fallback when the LLM is unavailable.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask Garden AI.
- **Create connections** — Spatial proximity, emotional-tone clusters, and **cross-pollination** (two-parent hybrid genomes) help themes emerge across seasons of your life.
- **Adapt to seasons** — Six weather moods, real day/night lighting, and seasonal atmosphere tie the garden to the world outside the screen.
- **Earn as you tend** — Four currencies (`dew`, `sunlight`, `pollen`, `starlight`) unlock palettes, patterns, adornments, and achievements as you plant and reflect.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored as an IndexedDB `idb://` ref), write about the moment, pick a variety, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Cross-pollination**: Combine two parent plants into a hybrid genome with unique palette, motif, and adornment.
- **Dream-a-Plant**: Describe a plant in words — LLM JSON genome when `/api/llm` is available, local offline fallback otherwise; save seeds in the Storage Shed.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects (gameplay boosts — no payment integration).

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified to steer plant variety, palette, and growth character.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Grouped by **emotional tone** (rule-based, not LLM) so you can browse by mood as well as by place.

### 🎨 Beautiful Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants, weather overlay, magnifying lens, and growth ceremony.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for emotional exploration.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.
- **Explore**: Browse sample community gardens (demo data today; server API ready but not wired to the UI).

### 🔓 Progression & Cosmetics
- **Unlock system**: 18 cosmetic items (palettes, patterns, adornments) and 7 achievements earned through tending counters.
- **Per-plant traits**: Palette, pattern, adornment, accent, and aura slots unlock by growth stage.
- **Storage Shed & Remembrance Candles**: Side features on the garden canvas for saved hybrid seeds and quiet memorials.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Create shared garden metadata and invite links — memories remain local per browser today; server-backed sync is on the roadmap.
- **Private sharing**: Share specific memories via `?share=<id>` links backed by local KV (same-browser access, not server-hosted yet).

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood**: Six weather types (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) and overall garden weather.
- **Ambient sound**: Optional Web Audio layer that tracks time of day and season.

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet; `Ctrl/Cmd+N` plant, `K` search, `1–4` views).
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA (`/plant`, `/memory`, `/handle?protocol=`).
- **PWA**: Install for an app-like shell; manifest declares share target and protocol handlers (service worker not yet implemented).
- **Export**: Image, PDF, and garden-view canvas renders from settings.
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
| Tests | Vitest 4 — **578 cases** across 22 files |

### Persistence
- **`useKV`** (`@/lib/storage`) — structured state in **localStorage** keys scoped per anonymous `LocalUser`.
- **`useMemoriesKV`** + **`blob-store.ts`** — photos and audio in **IndexedDB** (`memorygarden-photos`); memory records hold lightweight `idb://<id>` refs.

### AI client chain (`getLLMProvider`)
1. **`POST /api/llm`** — Vercel Edge → Anthropic (`ANTHROPIC_API_KEY` on server; browser never sees the key).
2. **`window.spark.llm`** — optional GitHub Spark fallback when present.
3. **Static fallback** — empty string; keyword tone classification still works.

Classification maps to Haiku; reflections and Dream-a-Plant use Sonnet.

### Edge API routes

| Route | Env vars | Purpose |
|-------|----------|---------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Tone classification, Garden AI reflections, Dream-a-Plant JSON |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional metadata sync to Vercel KV (last-write-wins, 1 MB cap; no photos) |
| `/api/gardens` | `DATABASE_URL` | Neon Postgres community gardens CRUD — **backend ready; frontend uses demo data** |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); CI exercises it separately from the Vite app.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** (current LTS recommended; CI uses Node 20)
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

### Docker (optional)
```bash
docker compose up --build              # production SPA on :8080 (nginx)
docker compose --profile dev up dev    # Vite dev server on :5173
docker compose --profile agents run --rm micro-forge  # Python agent scan
```
The static Docker image does **not** include Vercel Edge routes — AI falls back gracefully without `/api/llm`.

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
CI also runs `npx tsc --noEmit`, coverage upload, bundle-size gate (400 KB per chunk), lockfile validation, and `npm audit`.

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

## Testing

Vitest drives **578 automated checks** for garden logic, storage edge cases, LLM client wiring, unlock rules, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

Typical areas covered include growth and stage logic, unlock/currency paths, trait helpers, local user migration, hybrid genomes, and HTTP LLM behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Env vars | Behavior without keys |
|-------|----------|------------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | Returns **503**; keyword tone + empty AI copy |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Returns **503**; local-only garden |
| `/api/gardens` | `DATABASE_URL` (Neon) | Returns **503**; Explore tab shows demo data |

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **503** (no KV), so users are never misled about what is actually syncing. Sync is last-write-wins with a 1 MB document cap; photos and audio never leave the device.

**Docker / static hosting**: `npm run build` → `dist/` served by nginx (port 8080). Edge routes require Vercel (or a compatible proxy).

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **Anonymous identity**: `LocalUser` profile — no GitHub OAuth or account required to use the garden.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories — never photos or account profiles in those paths.
- **Export**: Full-garden export from settings (image, PDF, garden-view) when you want a portable archive.
- **Clearing data**: Remove browser storage for the site to reset; cloud sync metadata can be overwritten on next sync if KV is configured.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire `/api/gardens`** — Connect the Explore tab to the Neon-backed community gardens API instead of hardcoded demo data.
- **Server-backed sharing** — Host share links and collaborative memory stores beyond same-browser local KV.
- **Richer collaboration** — Presence, invitations with conflict-safe merges for joint tending.
- **Offline PWA** — Service worker, cache strategy, and Share Target handler for `manifest.json` share_target.
- **AI plant imagery** — Wire `AIPlantRenderer` / `generatePlantImagePrompt()` into a real generation pipeline.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional and only active when KV credentials are configured.

**Do I need an account?**  
No. MemoryGarden uses an anonymous local profile (`LocalUser`). You can start planting immediately after opening the app.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (`claude-haiku-4-5-20251001` for classification, `claude-sonnet-4-6` for reflections). Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**What are the unlock currencies?**  
`dew` (planting and reflecting), `sunlight` (revisiting old memories), `pollen` (cluster tending), and `starlight` (achievements). Spend them on cosmetic rerolls and unlocks in the garden settings.

**Does it work offline?**  
Core planting, tending, and keyword tone classification work offline. AI reflections, Dream-a-Plant LLM mode, and cloud sync require network access to their respective endpoints.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
