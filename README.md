# MemoryGarden 🌱

[content-to-enhance id="introduction"]
A peaceful, emotional digital garden where you plant and nurture personal memories. Watch your memories grow from seeds to blooms as you revisit and reflect on them over time.
[/content-to-enhance]

## What is MemoryGarden?

[content-to-enhance id="memory-garden-concept"]
MemoryGarden reimagines how we preserve and interact with our memories. Instead of scrolling through static photo albums, your memories become living plants in a beautiful garden that:

- **Grow over time** - Memories evolve from seeds to sprouts to blooms based on how often you visit them.
- **Reflect emotions** - AI classifies the emotional tone of each memory (happy, nostalgic, peaceful, etc.).
- **Encourage reflection** - Add new thoughts to memories and receive gentle, poetic insights from the Garden AI.
- **Create connections** - Discover relationships between memories planted near each other.
- **Adapt to seasons** - The garden changes with real-world time, seasons, and weather.
[/content-to-enhance]

## Features

[content-to-enhance id="core-features"]
### 🌿 Plant & Tend Memories
- **Planting**: Upload a photo, write about the moment, and watch your memory sprout.
- **Tending**: Visit memories to see them bloom and mature. Add reflections as you revisit moments.
- **Fertilizer Boost**: Use the three-tier fertilizer system (Garden Boost, Premium, Legendary) to accelerate plant growth with unique visual effects.

### ✨ AI-Powered Insights
- **Emotional Detection**: AI analyzes the tone of your memories to influence plant variety and growth.
- **Garden AI**: Receive poetic reflections and discovery of connections between related memories.
- **Memory Clusters**: AI-suggested groups of related memories based on theme or time.

### 🎨 Beautiful Views
- **Garden**: Infinite canvas with draggable, animated plants and parallax backgrounds.
- **Timeline**: Chronological list of all your memories.
- **Clusters**: Grouped view of related memories.
- **Bloom Wall**: A beautiful gallery of your fully matured memories.

### 👥 Collaboration & Sharing
- **Collaborative Gardens**: Create or join shared gardens with others to grow memories together.
- **Private Sharing**: Share specific memories with unique, secure links.

### 🌓 Living Atmosphere
- **Day/Night Cycle**: Garden background shifts based on your local time.
- **Seasonal & Weather Changes**: Subtle animations and visual shifts reflect the current season and the garden's "mood."
- **Ambient Sound**: Immersive garden sounds that adapt to the time of day and season.

### ⌨️ Power User Features
- **Keyboard Shortcuts**: Navigate and interact efficiently with shortcuts (press `?` for help).
- **Protocol Handlers**: Seamlessly plant or view memories from external apps using `web+memorygarden://`.
- **PWA Support**: Install MemoryGarden as a Progressive Web App for a native-like experience.
[/content-to-enhance]

## Technical Architecture

[content-to-enhance id="how-it-works"]
MemoryGarden is built as a modern, responsive web application with a focus on smooth, organic interactions.

### Frontend Stack
- **React 19 + TypeScript**: Core UI framework.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Styling and responsive design.
- **Framer Motion**: Organic animations and transitions.
- **Radix UI**: Accessible UI components.
- **localStorage + IndexedDB**: Memory metadata lives in localStorage; photo blobs spill to IndexedDB to avoid the ~5MB quota.
- **Vercel Edge function**: `/api/llm` proxies AI completions to Anthropic so the API key never reaches the browser.

### Sub-projects
- **Volatility Sentinel**: A Python-based agent (located in `/volatility-sentinel`) that monitors price volatility using the CoinGecko API, providing an example of backend-style agent integration.
[/content-to-enhance]

## Getting Started

[content-to-enhance id="usage"]
### Prerequisites
- Node.js (latest LTS recommended)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd memory-garden
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Development
Start the development server:
```bash
npm run dev
```

### Building for Production
Build the application:
```bash
npm run build
```
The output will be in the `dist` directory.

## Testing

MemoryGarden includes a comprehensive test suite covering core logic, edge cases, and UI components.

### Running Tests
- **Run all tests**: `npm test`
- **Watch mode**: `npm run test:watch`
- **Coverage report**: `npm run test:coverage`

The tests cover:
- **Growth Logic**: Validating plant progression and metrics.
- **Unlock System**: Ensuring achievements and currency work correctly.
- **Edge Cases**: Handling extreme data points and boundary conditions.
[/content-to-enhance]

## Deployment

[content-to-enhance id="configuration"]
The app deploys to Vercel as a static SPA with two Edge functions:

1. `/api/llm` — proxies prompts to Anthropic. Requires `ANTHROPIC_API_KEY`. Without it, AI features fall back gracefully and the rest of the app keeps working.
2. `/api/sync` — optional cloud backup of memory metadata. Requires `KV_REST_API_URL` and `KV_REST_API_TOKEN` (provided automatically when you enable a Vercel KV / Upstash Redis store on the project). Photos and audio recordings are NOT synced — they live on each device's IndexedDB.

Push to `main` — Vercel autodetects Vite and runs `npm install && npm run build`. The repo's `.npmrc` enables `legacy-peer-deps` to satisfy `vite@8` against `@vitejs/plugin-react-swc`.

The "Sync to cloud" toggle in the header dropdown surfaces sync status and disables itself if the server reports `503` (no KV configured), so the UI is honest about what's actually working in your deployment.

## Privacy & Data

- **Local-first**: All memories live in your browser (localStorage + IndexedDB). Nothing leaves your device unless you explicitly share a memory or join a collaborative garden.
- **AI requests are minimal**: Tone classification sends only your memory text (truncated to 600 chars). Reflections include nearby memory text snippets. No photos, no profile data.
- **You Own Your Data**: Export your entire garden at any time from the settings menu.
[/content-to-enhance]

## Roadmap

[content-to-enhance id="roadmap"]
Planned improvements and known next steps for MemoryGarden (prioritize and expand this list as the product evolves):

- Deeper collaboration features for shared gardens.
- Richer export formats and print-ready garden layouts.
- Additional accessibility and internationalization pass across views.
[/content-to-enhance]

## FAQ

[content-to-enhance id="faq"]
**Where is my data stored?**  
By default, memories stay on your device (browser storage). Cloud sync of metadata is optional and depends on project configuration.

**Do photos get sent to the AI?**  
No. AI features use text context only, within the limits described in Privacy & Data.

**How do I report issues or contribute?**  
Use GitHub issues and pull requests on this repository.
[/content-to-enhance]

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
