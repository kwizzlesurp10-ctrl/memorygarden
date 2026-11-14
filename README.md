# MemoryGarden 🌱

[content-to-enhance id="introduction"]
MemoryGarden is a calm, emotional space for the moments that matter: plant each memory like a seed, return to tend it, and watch it grow on an illustrated canvas—or step through the garden gate into a first-person **Walk** among your plants. Nothing is rushed or noisy; the garden is local-first, gently AI-assisted, and always yours.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and revisit memories. Instead of flipping through static albums, your moments live as plants in a garden that responds to you:

- **Grow over time** — Plants advance through eight stages (`seed` → `elder`) as you visit and reflect; neglect and care both leave traces you can feel.
- **Reflect emotions** — AI-assisted tone classification steers variety, palette, and growth character so the garden mirrors how each memory feels.
- **Encourage reflection** — Add notes when you revisit; invite gentle, poetic insights when you ask Garden AI.
- **Create connections** — Spatial proximity, clustering, and optional **community gardens** help you notice themes across seasons of your life.
- **Adapt to seasons** — Light, mood, and atmosphere follow real time and season so the garden stays tied to the world outside the screen.
- **Choose how you look** — Six illustrated **art styles** (watercolor through photorealistic) carry across the 2D canvas and into Walk, including voxel-style terrain cues for pixel-art.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, pick a date, and watch your memory sprout on the canvas.
- **Tending**: Open memories often to see them advance; reflections deepen the story each time you return.
- **Traits & unlocks**: Cosmetic palettes, patterns, adornments, and auras unlock from tending history.
- **Fertilizer Boost**: Garden Boost is free; Premium and Legendary use Stripe Checkout. Growth applies only after webhook-verified payment.
- **Hybrids & Dream a Plant**: Combine varieties into hybrid genomes and preview dream-close-up silhouettes before planting.
- **Storage Shed**: Curate overflow memories and shed styles without losing your garden’s rhythm.

### ✨ AI-Powered Insights
- **Emotional tone**: Text is classified (`gpt-4o-mini` / Haiku-class on the server) to steer plant variety and color.
- **Garden AI**: Poetic reflections and prompts that connect nearby memories without overwhelming your voice.
- **Memory Clusters**: Thematic or temporal groupings so you can browse by mood as well as by place.
- **Gentle whispers**: Optional ambient, non-intrusive copy tied to streaks and tending—never spam.

### 🎨 Beautiful Views
- **Garden**: Illustrated pan-and-zoom canvas with animated plants, **Garden Lens** loupe, and layered backgrounds.
- **Walk**: First-person **Three.js** open world—CC0 Kenney/Quaternius scenery, dusk-friendly HUD, 3D plant meshes aligned with 2D growth stages, and optional virtual joystick on mobile.
- **Timeline**: Chronological path through every planted moment.
- **Clusters**: Grouped cards for thematic exploration.
- **Bloom Wall**: A gallery spotlight for memories that have reached full bloom.
- **Landscape & memory scenes**: Alternate layouts for large gardens and export-friendly framing.

### 👥 Collaboration & Sharing
- **Community gardens** (`/api/gardens` + Neon): Join public groves, plant, water, and reflect with privacy-aware redaction.
- **Privacy modes**: **Camouflage** (hide private text from non-owners on the wire) or **sleeping seed** (private slots appear as dormant seeds in Walk).
- **Private sharing**: Link-based access you control for individual memories.

### 🌓 Living Atmosphere
- **Day / night**: Background and lighting follow local time (including Walk surface tints after dusk).
- **Seasonal mood**: Subtle shifts for the current season and overall garden “weather.”
- **Ambient sound**: Optional audio that tracks time of day and season.

### 🎁 Walk extras
- **3D gifts**: Leave blossom notes, lanterns, dew vials, or wind chimes at a plant’s base in Walk.
- **The Grove Project**: Five community watering tiers unlock collective sanctuary features (sakura, benches, and more) in the 3D world.
- **Accessibility**: `GardenPlantAccessibilityLayer` and `memoryPlantA11yLabel` expose plant identity to screen readers; reduced-motion paths respect OS settings.

### ⌨️ Power user affordances
- **Keyboard shortcuts**: Fast navigation and actions (`?` opens the cheat sheet).
- **Protocol handlers**: Deep links such as `web+memorygarden://` when installed as a PWA.
- **PWA**: Install for an app-like shell and optional protocol registration.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is a client-heavy **React 19** app tuned for smooth, organic motion and local-first data.

### Frontend stack
- **React 19 + TypeScript** — UI and state; external input validated with **`ValidationResult<T>`** in `src/lib/validation.ts`.
- **Vite** — Dev server and production bundle.
- **Tailwind CSS** — Layout and responsive styling (OKLCH palettes in theme helpers).
- **Framer Motion** — Springs and transitions that feel alive.
- **Radix UI** — Accessible primitives (dialogs, tabs, etc.).
- **Three.js** — Walk mode terrain, CC0 GLTF props, and instanced plant meshes.
- **Persistence** — `useKV` from `@/lib/storage` scopes structured data per local user in **localStorage**; photos and heavy blobs use **IndexedDB** to stay under string quotas.
- **AI client** — `getLLMProvider()` posts to **`/api/llm`**; browser never sees provider keys. Optional **GitHub Spark** `window.spark` remains a fallback when present.

### Edge API routes (Vercel)
| Route | Role |
|-------|------|
| **`/api/llm`** | LLM proxy with rate limiting; prefers **xAI Grok** when `XAI_API_KEY` is set, else **Anthropic** (`claude-haiku-4-5-20251001` / `claude-sonnet-4-6`). Returns **503** when unconfigured. |
| **`/api/sync`** | Optional metadata sync to **Vercel KV / Upstash** (`KV_REST_*`). |
| **`/api/gardens`** | Community gardens backed by **Neon** when `DATABASE_URL` is set. |
| **`/api/payments/*`** | Stripe Checkout, webhooks, entitlements (KV). |
| **`/api/auth/*`** | Optional **Neon Auth** session link + entitlement restore when `NEON_AUTH_*` and `VITE_NEON_AUTH_URL` are configured. |

### Sub-projects
- **Volatility Sentinel** (`volatility-sentinel/` in the repo) — Standalone Python agent example (CoinGecko) you run separately from the Vite app; CI exercises it from its own directory.
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
As of the latest cron refresh: **857** Vitest examples across **85** files (all passing).

### Preview the production bundle
```bash
npm run preview
```
Serves **`dist/`** locally (Vite preview server).

## Testing

Vitest drives automated checks for garden logic, storage edge cases, LLM client wiring, Walk capture layouts, community privacy, payments entitlements, and more.

### Commands
- **One-off run**: `npm test`
- **Watch**: `npm run test:watch`
- **Coverage**: `npm run test:coverage`

Typical areas covered include growth and stage logic, unlock/currency paths, trait helpers, local user migration, Open World locomotion, and HTTP LLM behavior.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The production story on **Vercel** is a static SPA plus Edge routes:

1. **`/api/llm`** — Proxies classification and reflection prompts. Set **`XAI_API_KEY`** (Grok) and/or **`ANTHROPIC_API_KEY`**. Without either, AI features degrade cleanly while the garden keeps working.
2. **`/api/sync`** — Optional metadata sync to **Vercel KV / Upstash** using **`KV_REST_API_URL`** and **`KV_REST_API_TOKEN`**. Photos and audio stay on-device (IndexedDB); only structured fields participate when sync is on.
3. **`/api/gardens`** — Community gardens when **`DATABASE_URL`** (Neon Postgres) is set; privacy redaction is enforced server-side.
4. **Stripe one-time purchases** — Fertilizer boosts (Premium / Legendary) and the optional Starlight cosmetic pack use **`/api/payments/*`** (Checkout + webhook fulfillment). See **[PAYMENTS.md](./PAYMENTS.md)** for Price IDs, webhook events, and env vars (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, price env vars, plus KV for entitlements).
5. **Optional Neon Auth** — **`NEON_AUTH_BASE_URL`**, **`NEON_AUTH_JWKS_URL`**, and client **`VITE_NEON_AUTH_URL`** enable sign-in, account linking, and purchase restore without changing local-first defaults for signed-out users.

Pushes to **`main`** trigger `npm install` and `npm run build`. **`legacy-peer-deps`** in `.npmrc` keeps Vite 8 and `@vitejs/plugin-react-swc` compatible.

The header **Sync to cloud** control reflects real status and backs off when the API returns **`503`** (no KV), so users are never misled about what is actually syncing.

## Privacy & Data

- **Local-first**: Memories and media default to the browser (localStorage-scoped keys + IndexedDB for blobs). Nothing leaves the device except what you explicitly sync, share, or post to a community garden.
- **AI payloads**: Classification uses truncated memory text; reflections may include short snippets from nearby memories—never photos or account profiles in those paths.
- **Community**: Contributor content in public gardens is stored in Neon when enabled; private rows use visibility + camouflage/sleeping-seed modes at the API boundary.
- **Export**: Full-garden export from settings when you want a portable archive.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Directions worth prioritizing as MemoryGarden matures:

- **Collaboration** — Richer shared-garden invitations, presence, and conflict-safe merges for joint tending.
- **Export & print** — Higher-fidelity PDF and poster layouts from the Bloom Wall, timeline, and Walk capture frames.
- **Accessibility & i18n** — Continue canvas, Walk HUD, and modal audits; extract copy for translation.
- **Performance at scale** — Canvas virtualization, Walk LOD, and asset prioritization for very large gardens (500+ plants).
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where does my data live?**  
By default on your device: scoped localStorage for structured data and IndexedDB for heavy blobs. Cloud sync of metadata is optional (KV). Community garden rows live in Neon only when you participate and `DATABASE_URL` is configured.

**Are photos sent to the AI?**  
No. AI calls operate on text (and brief neighboring context for reflections), not image bytes.

**Which LLM runs in production?**  
Deployed apps use **`/api/llm`**: **Grok** when `XAI_API_KEY` is set, otherwise **Anthropic** Haiku/Sonnet model ids in `api/llm.ts`. Spark environments may still expose `window.spark.llm` as a fallback path in client code.

**What is Walk?**  
A Three.js first-person view of your garden with the same plant stages and art-style tinting as the 2D canvas. It is optional and works offline once assets are cached.

**How do I contribute or report an issue?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺