# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow—from illustrated canvas to a first-person **Walk** among your plants. The garden stays local-first and private by default, with optional cloud sync and community spaces when you choose to share.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed` → `elder`) as you visit, reflect, and tend; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone classification shapes variety, palette, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights from Garden AI and **gentle whispers** nudging you toward memories that need care.
- **Create connections** — Spatial proximity, **Memory Clusters**, and hybrid **Dream-a-Plant** genomes help you notice themes across seasons of your life.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season; **day/night** and ambient audio keep the garden tied to the world outside the screen.
- **Protect privacy** — **Camouflage** keeps coordinates fixed while hiding sensitive copy; **sleeping seed** projects private memories onto a contemplation ring until you reveal them.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout on the canvas (six **art styles**: watercolor, botanical illustration, pixel-art, oil painting, studio-ghibli, photorealistic).
- **Tending**: Open memories often to see them bloom through `elder`; reflections, reactions, and trait unlocks deepen the story each time you return.
- **Fertilizer Boost**: Garden Boost is free; Premium and Legendary use Stripe Checkout. Growth applies only after webhook-verified payment.
- **Cosmetic traits**: Per-plant palette, pattern, adornment, accent, and aura slots unlock through tending history.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`peaceful`, `happy`, `reflective`, `bittersweet`, `nostalgic`) to steer plant variety and palette.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming your voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.
- **Gentle whispers**: Contextual nudges (e.g. thirsty plants, anniversaries) generated from garden state and season.

### 🎨 Beautiful Views
- **Garden**: Illustrated pan-and-zoom canvas with animated plants, optional **Garden Lens** loupe, parallax, and `GardenPlantAccessibilityLayer` screen-reader labels.
- **Walk**: First-person **Three.js** open world—CC0 **Kenney** / **Quaternius** scenery, voxel pixel-art parity for `pixel-art` plants, dusk HUD, and plant meshes aligned with 2D growth stages.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A gallery spotlight for memories at full bloom.
- **Landscape / world scenes**: Layered scenery and starter-garden decor including the signature elder tree.

### 🏡 Dream, Hybrids & Storage Shed
- **Dream a Plant**: LLM-assisted hybrid genomes with fullscreen close-up preview before planting.
- **Storage Shed**: Save seed lines, shed styles, candles, and planted hybrids; merge seeds from garden backup exports.

### 👥 Collaboration & Sharing
- **Community gardens** (`/api/gardens`): Join, plant, water, and reflect in shared spaces backed by **Neon Postgres** when configured.
- **Collaborative tending**: Bonds, reactions, and collective **Grove Project** milestones.
- **Private sharing**: Link-based memory access you control.

### 🎁 Grove Project & 3D Gifts
- **The Grove Project**: Five collective sanctuary unlock tiers at 25 / 75 / 150 / 300 / 500 waterings (birdbath → fireflies → sakura → starlight fountain → final tier).
- **3D gifts**: Blossom notes, paper lanterns, dew vials, and wind chimes left at plant bases in Walk mode.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time.
- **Seasonal mood**: Subtle shifts for the current season and overall garden “weather.”
- **Ambient sound**: Optional audio that tracks time of day and season.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet); roving focus on canvas plants.
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell and optional protocol registration.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19 + TypeScript** app tuned for smooth, organic motion and local-first data, deployed as a static **Vite** SPA with **Vercel Edge** routes.

### Frontend stack
- **Vite** — Dev server (port **5173**) and production bundle to `dist/`.
- **Tailwind CSS** + **OKLCH** theme tokens — Layout, contrast, and seasonal palettes.
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Three.js** — Walk mode rendering, CC0 glTF scenery, and procedural plant meshes.
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per **local user** in **localStorage**; photos and heavy blobs use **IndexedDB**.
- **Validation** — External payloads use **`ValidationResult<T>`** (`src/lib/validation.ts`) with Zod-style field errors.
- **AI client** — `getLLMProvider()` in `src/lib/llm-client.ts` posts to **`/api/llm`**; optional **`window.spark`** when present in GitHub Spark hosts.

### Edge API (Vercel)
| Route | Purpose |
|-------|---------|
| `POST /api/llm` | Classification & reflection; prefers **xAI Grok** when `XAI_API_KEY` is set, else **Anthropic** (`claude-haiku-4-5-20251001` / `claude-sonnet-4-6`). Rate-limited. Returns **503** when no key is configured. |
| `POST /api/sync` | Optional metadata sync to **Vercel KV / Upstash** (`KV_REST_API_*`). Media stays on-device. |
| `GET/POST /api/gardens` | Community gardens (Neon **`DATABASE_URL`**). |
| `POST /api/payments/*` | Stripe Checkout, webhooks, entitlements (KV-backed). |
| `GET/POST /api/auth/*` | Optional **Neon Auth** linking, me, restore entitlements. |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/`) — Standalone Python agent example (CoinGecko); CI runs it separately from the Vite app.
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

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

## Testing

Vitest drives automated checks for garden logic, Walk locomotion, storage edge cases, LLM client wiring, community API parsers, privacy modes, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

**Current suite (main):** **870** tests across **90** files — all passing.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus Edge routes:

1. **`/api/llm`** — Proxies prompts to xAI or Anthropic. Set **`XAI_API_KEY`** and/or **`ANTHROPIC_API_KEY`**. Without either, AI features degrade cleanly while the garden keeps working.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** using **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); only structured fields participate when sync is on.
3. **`/api/gardens`** — Community features require **`DATABASE_URL`** (Neon serverless). See `api/gardens.ts` for join/plant/water/reflect actions.
4. **Stripe one-time purchases** — Fertilizer boosts (Premium / Legendary) and the optional Starlight cosmetic pack use **`/api/payments/*`** (Checkout + webhook fulfillment). See **[PAYMENTS.md](./PAYMENTS.md)** for Price IDs, webhook events, and env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price env vars, plus KV for entitlements).
5. **`/api/auth/*`** — Optional Neon Auth JWT linking when auth env vars are configured.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync or share.
- **Privacy modes**: Camouflage and sleeping-seed rendering keep sensitive memories off the public canvas coordinates you expect.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Export**: Full-garden export from settings when you want a portable archive (including Storage Shed seeds when present).
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden invitations, presence, and conflict-safe merges for joint tending.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall and timeline.
- **Accessibility & i18n** — Continue Walk + canvas audits (`GardenPlantAccessibilityLayer`, reduced motion, contrast); extract copy for translation.
- **Performance at scale** — Canvas virtualization and asset prioritization for very large gardens (500+ plants); lazy CC0 model loading in Walk.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional and only active when KV credentials are configured. Community garden rows live in Neon when `DATABASE_URL` is set.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`POST /api/llm`**: **xAI Grok** when `XAI_API_KEY` is set, otherwise **Anthropic** Haiku/Sonnet model IDs in `api/llm.ts`. GitHub Spark hosts may still expose `window.spark.llm` as a client fallback.

**What is Walk mode?**  
A first-person Three.js scene where you stroll among memory plants, inspect close-ups, place 3D gifts, and see Grove Project unlocks in the world.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺