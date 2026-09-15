# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, local-first space for the moments that matter. Plant each memory like a seed, return to tend it, and watch it grow through eight stages—from **seed** to **elder**—on an infinite canvas. No account required: a **LocalUser** identity is created in your browser, photos spill into **IndexedDB**, and structured data lives in scoped **localStorage**. Optional cloud sync sends metadata only; your garden stays yours, never rushed, never noisy.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Eight growth stages** — `seed → sprout → seedling → young → bud → bloom → mature → elder`. Vitality from visits, reflections, and age drives progression; neglect and care both leave traces you can feel.
- **Five emotional tones** — `happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`. AI-assisted classification (with keyword fallback) steers plant variety, palette, and growth character.
- **Six weather moods** — The garden atmosphere (`sunny`, `mist`, `rain`, `rain-sun`, `golden-haze`, `partly-cloudy`) derives from the emotional mix across your memories.
- **Four currencies** — Earn **dew**, **sunlight**, **pollen**, and **starlight** through planting, revisiting, cluster tending, and achievements; spend them on cosmetics and rerolls.
- **Cross-pollination** — Select two memories to breed a hybrid plant with merged traits and rare variety chances.
- **Dream-a-Plant** — Describe a mood or scene; the Garden AI (or a local fallback) generates a hybrid genome you can plant or stash in the Storage Shed.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask the Garden AI.
- **Adapt to seasons** — Light, mood, and ambient sound follow real time and season so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (IndexedDB for blobs >32 KB), write about the moment, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them bloom and mature; reflections deepen the story each time you return.
- **Cross-pollination**: Pick two parents from the garden to create a hybrid with merged traits and legendary variety rolls.
- **Dream-a-Plant**: Bottom-left panel on the garden canvas—describe a vibe, get an AI (or local) genome, plant it or save to the **Storage Shed**.
- **Storage Shed**: Stash up to 60 seeds, planted hybrids, and 40 remembrance candles; choose a shed style (`antique`, `storybook`, `glass`, `modern`).
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects—visit-count boosts, no payment integration.

### ✨ AI-Powered Insights
- **Emotional tone**: Text classified via `/api/llm` (Haiku) with keyword fallback when offline or unconfigured.
- **Garden AI**: Poetic reflections (Sonnet) that connect nearby memories without overwhelming the original voice.
- **Memory Clusters**: Thematic groupings by emotional tone so you can browse by mood as well as by place.

### 🎨 Five Views
- **Garden**: Infinite pan-and-zoom canvas with animated plants, weather overlay, magnifying lens, and ambient audio.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: Gallery spotlight sized by growth stage.
- **Explore**: Demo community gardens (mock data today—backend API exists but is not wired).

### 🎁 Unlock & Trait Systems
- **Global unlocks**: 18 cosmetic items (7 palettes, 4 patterns, 7 adornments) and **7 achievements** awarding starlight.
- **Per-plant traits**: 23 trait entries across 5 slots (palette, pattern, adornment, accent, aura) unlocked as each plant grows.
- **13 plant varieties** including 4 legendary types (`ancient_oak`, `eternal_rose`, `phoenix_vine`, `starlight_succulent`).

### 👥 Collaboration & Sharing (local-first)
- **Share links**: Generate `?share=<id>` URLs stored in local KV—viewable without an account.
- **Collaborative gardens**: Create/join via invite URL (`?invite=&token=`); members panel and activity feed derive from local memory attribution.
- **Reactions**: Five reaction types toggled on memories (local persistence).
- **Honest limits**: Community Explore and watering are **mock UI**; `/api/gardens` (Neon Postgres) is deployed but not yet connected to the frontend.

### 🌓 Living Atmosphere & PWA
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood**: Subtle shifts for the current season and overall garden weather.
- **Ambient sound**: Optional audio that tracks time of day and season.
- **PWA manifest**: Installable shell with `web+memorygarden://` protocol handlers—**no service worker** yet (offline mode not shipped).

### ⌨️ Power User Affordances
- **Keyboard shortcuts**: `g` garden, `t` timeline, `c` clusters, `b` bloom wall, `?` cheat sheet.
- **Search & filter**: `SearchFilterBar` and `FilterPanel` for large gardens.
- **Export**: Full-garden export modal from settings.
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React app tuned for smooth, organic motion and local-first data.

### Frontend stack

| Layer | Choice |
|-------|--------|
| UI | React **19.2** + TypeScript **6** |
| Bundler | Vite **8** |
| Styling | Tailwind CSS **4** |
| Motion | Framer Motion **12** |
| Components | Radix UI primitives |
| Tests | Vitest **4** — **578 tests** across 22 files |

### Persistence
- **`useKV`** (`@/lib/storage`) — namespaced **localStorage** keys scoped per **LocalUser** id.
- **`useMemoriesKV`** — wraps memories; photos and audio >32 KB spill to **IndexedDB** (`idb://` refs).
- **Storage Shed** — separate raw KV key per user.

### AI provider chain (`getLLMProvider`)
1. **`POST /api/llm`** — Vercel Edge → Anthropic (browser never sees the key).
2. **`window.spark.llm`** — optional GitHub Spark fallback when present.
3. **Static empty fallback** — graceful no-AI mode.

### Edge API routes

| Route | Env vars | Purpose |
|-------|----------|---------|
| `POST /api/llm` | `ANTHROPIC_API_KEY` | Classification (`claude-haiku-4-5-20251001`) & reflection (`claude-sonnet-4-6`) |
| `GET/POST /api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Optional metadata sync (Upstash/Vercel KV); strips photos/audio |
| `GET/POST /api/gardens/*` | `DATABASE_URL` (Neon) | Community gardens CRUD — **backend ready, frontend mock** |

Sync uses last-write-wins merge and re-attaches local blobs by memory ID. Payloads are capped (~1 MB).

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python FastAPI agent (CoinGecko volatility alerts). Run separately; CI exercises it independently.
- **Micro-Forge** (`agents/micro_forge/`) — Python agent runner available via `docker compose --profile agents`.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** 20+ (LTS recommended; Docker dev image uses 22)
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
Opens the Vite dev server (default port **5173**).

### Docker (optional)
```bash
docker compose up --build              # production SPA on :8080 (nginx, /healthz)
docker compose --profile dev up dev    # Vite dev server on :5173
docker compose --profile agents run --rm micro-forge   # agent scan
```
Edge API routes (`/api/llm`, `/api/sync`, `/api/gardens`) are **not** in the static Docker image—AI and sync fall back gracefully in container-only deploys.

### Production build
```bash
npm run build
```
Output → **`dist/`** for static hosting.

### Quality checks
```bash
npm run lint          # ESLint
npx tsc --noEmit      # typecheck (also run in CI)
npm test              # 578 Vitest cases
npm run test:coverage
```

CI also runs **bundle-size** gate (no JS chunk >400 KB), **security audit**, **pnpm lockfile sync**, and **volatility-sentinel** pytest.

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge routes:

| Route | Required env | Behavior without it |
|-------|--------------|---------------------|
| `/api/llm` | `ANTHROPIC_API_KEY` | 503 → client keyword fallback, no reflections |
| `/api/sync` | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | 503 → "Sync to cloud" backs off; local-only |
| `/api/gardens/*` | `DATABASE_URL` | Community API unavailable; Explore stays mock |

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

### Identity & privacy
- **LocalUser**: Anonymous browser identity (`memorygarden:user`); no sign-up required.
- **Local-first**: Memories and media default to localStorage + IndexedDB. Cloud sync sends structured metadata only.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or profiles.
- **Export**: Full-garden export from settings; keyboard shortcut available in-app.

### Data clearing
Remove site data in browser settings or use in-app reset—clears LocalUser, memories, IndexedDB blobs, and preferences.

### Docker static hosting
`docker compose up --build` serves the built SPA on port **8080** via nginx. Health check at `/healthz`. No Edge routes in the image.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Wire `/api/gardens`** — Replace hardcoded Explore mocks with live Neon-backed community gardens; enable real plant contributions (today: "coming soon" toast).
- **Server-backed shares** — Move share links from local KV to durable storage with Open Graph preview cards.
- **Offline PWA** — Register a service worker; honor `share_target` (`POST /share`) declared in the manifest.
- **AI plant imagery** — `AIPlantRenderer` and `generatedPlantImages` field exist but are unwired; connect image generation pipeline.
- **Search wiring** — `cmdk` palette and `web+searchmemories://` protocol are documented but not fully connected.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across canvas, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Do I need an account?**  
No. A **LocalUser** id is auto-generated in your browser. Optional cloud sync requires Vercel KV credentials on the server side, not a user login.

**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for photos/audio. Cloud sync of metadata is optional and only active when KV credentials are configured.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic: **`claude-haiku-4-5-20251001`** for classification, **`claude-sonnet-4-6`** for reflections. Spark environments may still expose `window.spark.llm` as a fallback.

**What are the unlock currencies?**  
**Dew** (plant, reflect), **sunlight** (revisit old memories), **pollen** (cluster tending), **starlight** (achievements). Spend dew to reroll cosmetics (5 dew per reroll).

**Does it work offline?**  
The garden UI works offline with local data. AI features fall back to keyword classification; sync and community features require network. There is **no service worker** yet—reinstalling or clearing site data removes local gardens unless exported.

**How do I export or clear my garden?**  
Use **Export** in settings for a portable archive. Clear all data via browser site settings or the in-app reset option.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
