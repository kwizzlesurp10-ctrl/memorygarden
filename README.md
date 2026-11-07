# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow through eight living stages—from quiet **seed** to venerable **elder**—on an illustrated canvas, in a Three.js **Walk** meadow, or among friends in shared groves. Nothing is rushed; whispers and seasons invite you back without guilt.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Stages advance through visits, age, and care: `seed → sprout → seedling → young → bud → bloom → mature → elder`.
- **Reflect emotions** — Classification steers variety, OKLCH palette, and growth character across five **emotional tones** (`happy`, `reflective`, `bittersweet`, `peaceful`, `nostalgic`).
- **Dream and hybridize** — **Dream a plant** turns words into genome seeds stored in the **Storage Shed**; pollination links two parents into custom **hybrids** with motifs and graft lines.
- **Walk among memories** — **Walk** is a first-person Three.js open world: emotional tone beds, **Grove Project** milestones, **3D gifts**, and **sleeping seed** / **camouflage** privacy for visitors.
- **Encourage reflection** — Water & reflect, **Garden AI** reflections, **Garden Lens** loupe on the 2D canvas, and **gentle whispers** (rule-of-three re-engagement, never punitive).
- **Create connections** — Spatial clustering, timeline, Bloom Wall, **community explore** (`/api/gardens` + Neon), and optional KV metadata sync.
- **Adapt to seasons** — Day/night, seasonal mood, ambient audio, and weather accents follow real time so the garden stays tied to the world outside the screen.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Photo (IndexedDB-backed blobs + local metadata), text, date, optional location/voice, and emotional classification.
- **Tending**: Visits advance **`getPlantStage()`**; reflections deepen the story; trait slots unlock from growth history.
- **Fertilizer Boost**: Garden Boost is free; Premium and Legendary use Stripe Checkout—growth applies only after **webhook-verified** payment ([PAYMENTS.md](./PAYMENTS.md)).

### 🔬 Garden Lens (2D canvas)
- **Loupe**: Magnifying lens with adjustable zoom on the SVG garden canvas—parallax pauses while the lens is active for precise tending.

### 🧬 Hybrids, Dream & Shed
- **Dream a plant**: Describe an idea; `dreamPlant()` yields a **HybridGenome** (offline seed or AI-assisted when `/api/llm` is configured).
- **Storage Shed**: Keeps dreamt seeds, planted hybrids, memorial **candles**, and shed style (`antique` | `storybook` | `glass` | `modern`).
- **Pollination**: Link two parent memories, then plant a child with merged **generateHybridTraits()**.

### 🚶 Walk (open world)
- **Three.js** first-person garden: WASD movement, interact radius, tone-colored beds, procedural plant meshes through **elder**.
- **Grove Project** (five tiers at 25 / 75 / 150 / 300 / 500 collective waterings): birdbath → fireflies → sakura → starlight fountain → aurora skybox features unlock in Walk terrain.
- **3D gifts** on nearby plants: Blossom Note, Paper Lantern, Dewdrop Vial (+vitality), Wind Chime—leave, discover, and open gifts in the HUD.
- **Privacy**: **Camouflage** (Poisson filler flora, zero coordinate drift) and **sleeping seed** (contemplation-ring projection, redacted visitor view) via `privacy-engine`.

### ✨ AI-Powered Insights
- **Emotional tone**: `kind: 'classify'` → **Claude Haiku** (`claude-haiku-4-5-20251001`).
- **Garden AI / reflections**: `kind: 'reflect'` → **Claude Sonnet** (`claude-sonnet-4-6`).
- **Client resolution**: `getLLMProvider()` — `fetch('/api/llm')` first, optional `window.spark.llm` when present, static fallback when unavailable.

### 🎨 Beautiful Views
- **Garden**: Infinite pannable/zoomable canvas (primary 2D view) with animated plants and layered backgrounds.
- **Walk**: Three.js open world among your memories.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Thematic or AI-suggested groupings.
- **Bloom Wall**: Gallery spotlight for memories in full bloom / mature stages.
- **Community explore**: Browse and tend public gardens when `DATABASE_URL` backs `/api/gardens`.

### 👥 Collaboration & Sharing
- **Collaborative gardens**: Shared spaces with invites when enabled; Neon-backed community routes for join / plant / water / reflect.
- **Private sharing**: Link-based access you control; visitor projections respect privacy mode.
- **Gentle whispers**: On-this-day, social care, thirst nudges, and solstice invites—capped at three compassionate prompts per week.

### 🌓 Living Atmosphere
- **Day / night** and **seasonal** gradients; optional ambient sound tied to time and season.
- **Weather & lens flare** accents on supported views.

### ⌨️ Power user affordances
- **Keyboard shortcuts** (`?` cheat sheet), **protocol handlers** (`web+memorygarden://` PWA), and **ValidationResult**-typed parsers in `src/lib/validation.ts` for safe imports and settings.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19 + TypeScript** app tuned for smooth, organic motion and local-first data.

### Frontend stack
| Layer | Choice |
|-------|--------|
| UI | React 19, Radix primitives, Tailwind, Framer Motion |
| Build | Vite 8 |
| Persistence | `useKV` → namespaced **localStorage** per `LocalUser`; large blobs in **IndexedDB** |
| 2D garden | SVG scene graph, Garden Lens loupe, hybrid builder UI |
| 3D Walk | **three** r184, custom plant meshes and terrain milestones |
| AI client | `src/lib/llm-client.ts` → `POST /api/llm` |
| Types & validation | `src/lib/types.ts`, discriminated **`ValidationResult<T>`** in `validation.ts` |

### Vercel Edge API (summary)
| Route | Purpose | Key env |
|-------|---------|---------|
| `POST /api/llm` | Anthropic proxy (classify / reflect) | `ANTHROPIC_API_KEY` |
| `GET/POST /api/sync` | KV metadata sync (last-write-wins; **photos not synced**) | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| `GET/POST /api/gardens` (+ join, plant, water, …) | Public / community gardens | `DATABASE_URL` (Neon) |
| `/api/payments/*` | Stripe Checkout, webhook fulfillment, entitlements | `STRIPE_*`, price IDs, KV for entitlements — see [PAYMENTS.md](./PAYMENTS.md) |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); exercised separately from the Vite app in CI.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- **Node.js** (current LTS recommended)
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
**Vitest**: **658** tests across **35** files (single run).

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

## Testing

Vitest drives automated checks for growth logic, storage edge cases, LLM client wiring, privacy projections, grove gifts, payments entitlements, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus Edge routes:

1. **`/api/llm`** — Proxies classification and reflection to Anthropic. Set **`ANTHROPIC_API_KEY`**. Without it, AI features degrade cleanly (dream/hybrid fallbacks remain).
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** via **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos stay on-device (IndexedDB); structured fields sync when enabled.
3. **`/api/gardens`** — Community gardens on **Neon** with **`DATABASE_URL`**. Returns **503** when unset; the explore UI backs off honestly.
4. **Stripe one-time purchases** — Fertilizer boosts (Premium / Legendary) and the Starlight cosmetic pack use **`/api/payments/*`** (Checkout + webhook fulfillment). See **[PAYMENTS.md](./PAYMENTS.md)** for Price IDs, webhook events, and required env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price env vars, plus KV for entitlements).

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync, share, or post to community gardens.
- **Visitor privacy**: **Camouflage** and **sleeping seed** modes reshape the Walk world for guests without leaking coordinates or media.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photo bytes or full account profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration depth** — Richer shared-garden invitations, presence, and conflict-safe merges for joint tending on Neon.
- **Whispers & PWA** — Web Push for gentle whispers and anniversary care without breaking the rule-of-three philosophy.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Audit across canvas, Walk controls, modals, and keyboard flows; extract copy for translation.
- **Performance at scale** — Continue canvas virtualization, Walk LOD, and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional (`/api/sync`) and only active when KV credentials are configured. Community garden posts require `DATABASE_URL`.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes. Sync also omits `photoUrl` blobs.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`** → Anthropic (**Haiku** for classify, **Sonnet** for reflect). Spark environments may still expose `window.spark.llm` as a secondary path in client code.

**What plant stages exist?**  
Eight stages: `seed`, `sprout`, `seedling`, `young`, `bud`, `bloom`, `mature`, `elder` — computed by **`getPlantStage()`** from visits, planting age, and boosts.

**How do Grove tiers work?**  
Collective watering counts unlock five Walk features at **25 / 75 / 150 / 300 / 500** waterings (birdbath through aurora). Progress is tracked locally and reflected in the Walk HUD.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
