# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow across eight life stages on an infinite canvas. There is no account to create—a **LocalUser** identity is generated in your browser on first visit, and your garden stays **local-first** until you optionally sync metadata to the cloud. Photos and audio live in **IndexedDB**; structured memory data flows through **`useMemoriesKV`** so large blobs never blow past **localStorage** quotas. Never rushed, never noisy—always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Eight stages (`seed → sprout → seedling → young → bud → bloom → mature → elder`) driven by visits, reflections, and vitality—not a fixed calendar.
- **Reflect emotions** — Five **emotional tones** (happy, reflective, bittersweet, peaceful, nostalgic) steer variety, OKLCH palette, and growth character; AI classification fills gaps when you skip picking a tone.
- **Garden weather** — Aggregate mood maps to six **weather types** (sunny, mist, rain, rain-sun, golden-haze, partly-cloudy) so the atmosphere mirrors what you have planted.
- **Encourage reflection** — “Water & Reflect” adds journal entries; **Garden AI** offers brief, poetic prompts without drowning your voice.
- **Create connections** — Spatial proximity, **Memory Clusters**, and **cross-pollination** (blend two memories into hybrid genetics) reveal themes across seasons of your life.
- **Side spaces** — **Dream-a-Plant** imagines hybrid genomes from a short idea; the **Storage Shed** keeps dreamt seeds, planted hybrids, candles, and a chosen shed style per user.
- **Earn as you tend** — Four soft currencies (**dew**, **sunlight**, **pollen**, **starlight**) and **18 unlockable** palettes, patterns, and adornments plus **7 achievements** reward consistent tending without turning the garden into a grind.
- **Adapt to seasons** — Day/night, real-world season, and ambient audio follow local time so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo (stored in IndexedDB), write about the moment, set date/location, optional voice notes—then watch your memory sprout on the canvas.
- **Tending**: Revisit to increase visit count and vitality; reflections deepen the story and feed the trait system (palette, pattern, adornment, accent, aura slots unlock by stage).
- **Cross-pollination**: Pick two memories to generate shared hybrid traits and genetics seeds for new visual variety.
- **Fertilizer Boost**: Three tiers (Garden Boost, Premium, Legendary) accelerate growth with distinct particle effects.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified via **`/api/llm`** (`claude-haiku-4-5-20251001`) when configured; reflections use **`claude-sonnet-4-6`**.
- **Garden AI**: Poetic reflections and prompts that can reference nearby memory snippets—never image bytes.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.
- **Dream-a-Plant**: LLM-assisted hybrid genome from a short creative prompt, stashed automatically in the Storage Shed.

### 🎨 Beautiful Views
Five primary modes in the header tabs:
- **Garden** — Infinite pan-and-zoom canvas with animated plants, filters, and layered backgrounds.
- **Timeline** — Chronological path through every planted moment.
- **Clusters** — Grouped cards for thematic exploration.
- **Explore** — Browse public community gardens and visit others’ spaces (backed by **`/api/gardens`** when **`DATABASE_URL`** is set on Vercel).
- **Bloom Wall** — Gallery grid with stage-weighted tiles; elders claim the largest spans.

### 👥 Collaboration & Sharing
- **Community gardens**: Join, water, and reflect on shared memories when Neon Postgres is configured server-side.
- **Private sharing**: Link-based access for specific memories you choose to share.
- **Honest scope**: Full real-time co-editing of a single private canvas is not the default—shared gardens are API-driven where enabled.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time (`getDayPeriod`).
- **Seasonal mood**: Subtle shifts for spring/summer/autumn/winter and computed garden weather.
- **Ambient sound**: Optional Web Audio engine tuned to season and weather.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet).
- **PWA manifest**: Installable shell, share target, and **`web+memorygarden`** / related protocol handlers—**no service worker yet**, so offline cache is limited to browser defaults.
- **Export**: Settings and Bloom-oriented export paths for portable archives.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy React SPA tuned for smooth, organic motion and local-first data.

| Layer | Choices |
|-------|---------|
| UI | **React 19.2** + **TypeScript ~6** |
| Bundler | **Vite 8** + `@vitejs/plugin-react-swc` |
| Styling | **Tailwind CSS 4** + OKLCH theme tokens |
| Motion | **Framer Motion 12** (springs, no hard cuts) |
| Components | **Radix UI** primitives + shadcn-style wrappers |
| Tests | **Vitest 4** — **578** tests across **22** files |

### Persistence & identity
- **`getLocalUser()`** — Stable anonymous **`LocalUser`** (`id`, generated `login`, Gravatar-style `avatarUrl`).
- **`useKV`** — Preferences, unlock state, shed data, and small blobs under the `memorygarden:` **localStorage** prefix.
- **`useMemoriesKV`** — Memory arrays with **`idb://`** photo references in **IndexedDB** via **`blob-store`**.

### AI resolution
**`getLLMProvider()`** (`src/lib/llm-client.ts`) tries in order:
1. HTTP **`POST /api/llm`** (Edge → Anthropic; disables after 503/404 for the session).
2. Optional **`window.spark.llm`** when the GitHub Spark SDK is present.
3. Static empty fallback so UI never crashes.

Classification maps to **`kind: 'classify'`**; reflections to **`kind: 'reflect'`**.

### Vercel Edge routes
| Route | Purpose | Required env |
|-------|---------|--------------|
| **`/api/llm`** | Tone + Garden AI | **`ANTHROPIC_API_KEY`** |
| **`/api/sync`** | Per-user JSON doc (LWW, **1 MB** cap); photos stay local | **`KV_REST_API_URL`**, **`KV_REST_API_TOKEN`** |
| **`/api/gardens`** | Public/community gardens CRUD + social tend | **`DATABASE_URL`** (Neon) |

### Sub-projects & agents
- **`volatility-sentinel/`** — Standalone Python example (CoinGecko); CI runs **`pytest`** from that directory.
- **`agents/micro_forge`** — Optional **`docker compose --profile agents run micro-forge`** report scanner (read-only mount).
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js 20+** (matches CI; current LTS recommended)
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
   Matches `.npmrc` (`legacy-peer-deps=true`) for Vite 8 peer ranges.

### Development
```bash
npm run dev
```
Vite dev server — default **http://localhost:5173**.

**Docker (optional):**
```bash
docker compose --profile dev up dev
```
Same app on **5173** with a cached `node_modules` volume.

### Production build
```bash
npm run build
```
Static output in **`dist/`**. Production image:
```bash
docker compose up --build
```
→ **http://localhost:8080** (health: **`/healthz`**). Edge **`/api/*`** routes are **not** in the static image—run on Vercel or proxy separately for full AI/sync/gardens.

### Quality checks
```bash
npm run lint
npm test
```
CI also runs **`npx tsc --noEmit`**, coverage upload, **npm audit** (high+), **bundle-size** gate (**400 KB** per JS chunk), **pnpm-lock** drift check, and **volatility-sentinel** Python tests.

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally.

## Testing

Vitest covers growth math, trait/unlock systems, storage edge cases, LLM client wiring, bloom-wall layout, cloud-sync helpers, and integration flows.

### Commands
- **One-off run**: `npm test` (**578** tests)
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus three Edge handlers:

| Variable | Route | Behavior if missing |
|----------|-------|---------------------|
| **`ANTHROPIC_API_KEY`** | `/api/llm` | **503** — tone defaults to peaceful; AI copy falls back |
| **`KV_REST_API_URL`**, **`KV_REST_API_TOKEN`** | `/api/sync` | **503** — local-only; header sync control backs off |
| **`DATABASE_URL`** | `/api/gardens` | **503** — Explore/community features unavailable |

**Sync semantics:** one JSON document per user (`mg:user:<id>`), **last-write-wins**, max **1 MB** serialized. **`Memory.photoUrl`** and audio **do not** sync—rehydrate media per device from IndexedDB after merge.

**LocalUser:** clearing **`memorygarden:*`** keys or site data resets identity, memories, shed, and unlock progress unless you exported first.

**Build:** pushes to **`main`** run **`npm ci`** + **`npm run build`** (see `.github/workflows/ci.yml`). **`legacy-peer-deps`** in `.npmrc` keeps React/Vite plugin peers aligned.

**Docker:** **`MEMORYGARDEN_PORT`** (default **8080**) for the nginx image; dev profile uses **`VITE_PORT`** (default **5173**).

## Privacy & Data

- **Local-first**: Memories and media default to the browser (**localStorage** metadata + **IndexedDB** blobs). Nothing leaves the device except optional sync metadata, shared links, or community posts you initiate.
- **AI payloads**: Truncated text (≤ **4000** chars per request); reflections may include short neighboring snippets—never photos or profile secrets.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Community gardens** — Richer planting UI in Explore, server-side share tokens, and conflict-safe merges for joint tending.
- **Offline & PWA** — Service worker for shell + cached assets; clearer offline limits for AI and sync.
- **Command palette** — **`Ctrl+K`** (or **`⌘K`**) quick navigation across views, filters, and actions.
- **AI imagery** — Optional generated motifs for Dream-a-Plant and hybrids with strict local retention defaults.
- **Export & print** — Higher-fidelity PDF and poster layouts from Bloom Wall and timeline.
- **Accessibility & i18n** — Canvas, modal, and keyboard-flow audit; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization and asset prioritization for very large gardens (**500+** plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: **`memorygarden:`** localStorage for structured fields and IndexedDB for photos/audio. Optional **`/api/sync`** stores metadata only when KV env vars are set.

**Do I need an account?**  
No. A **LocalUser** is created automatically in the browser. Sync and community gardens key off that **`id`** when cloud features are enabled.

**Are photos sent to the AI?**  
No. **`/api/llm`** receives text only (plus brief text context for reflections).

**Which models run in production?**  
**`claude-haiku-4-5-20251001`** for classification and **`claude-sonnet-4-6`** for reflections (`api/llm.ts`). Spark builds may still use **`window.spark.llm`** as a secondary path.

**What are dew, sunlight, pollen, and starlight?**  
Soft currencies earned by planting, reflecting, revisiting old memories, cluster tending, and achievements—spent in the unlock catalog (palettes, patterns, adornments).

**Why does sync say unavailable?**  
The app probes **`/api/sync`**; **503** means KV is not configured or the doc exceeded **1 MB**. Photos remain on each device regardless.

**How do I reset my garden?**  
Clear site data for the origin or remove **`memorygarden:*`** keys; export first if you need a backup.

**How do I contribute or report an issue?**  
Open GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
