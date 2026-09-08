# GEMINI.md - MemoryGarden

## Project Overview

MemoryGarden is a peaceful, emotional digital garden where users plant and nurture personal memories. Memories are living plants that grow based on visits, reflections, and time.

### Core Metaphor

- **Seeds/Plants**: Individual memories.
- **Growth**: `seed → sprout → seedling → young → bud → bloom → mature → elder`.
- **Tending**: Reflections ("watering") promote growth.
- **Seasons & Time**: Appearance follows real-world season and local day/night.

### Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8.
- **Styling**: Tailwind CSS 4 + Radix UI + OKLCH.
- **Animations**: Framer Motion.
- **Deploy**: Vercel static SPA + Edge `/api`.
- **AI**: `POST /api/llm` via the Vercel AI SDK / AI Gateway (not `window.spark.llm`).
- **Persistence**: `useKV` (localStorage) + optional live pair (`/api/pair`) and cloud sync (`/api/sync`).
- **Visuals**: SVG garden scene (`GardenCanvas`) with a loupe lens.
- **Local agents**: `mcp/server.ts` stdio MCP.

## Building and Running

- **Development**: `npm run dev`
- **Production Build**: `npm run build`
- **Linting**: `npm run lint`
- **Tests**: `npm test`
- **MCP**: `npm run mcp`

## Development Conventions

- Functional components, Tailwind, Radix primitives.
- Persistent user data through `@/lib/storage` (`useKV`). Live pair for two-browser sessions.
- OKLCH only for new garden chrome.
- LLM through `getLLMProvider()` with try/catch fallbacks.
- Photos stay on-device; pair/sync strip blobs.
