# GEMINI.md - MemoryGarden 🌱

## Project Overview
MemoryGarden is a peaceful, emotional digital garden where users plant and nurture personal memories. Memories are represented as living plants that grow and evolve based on user interaction (visits, reflections) and the passage of time.

### Core Metaphor
- **Seeds/Plants**: Represent individual memories.
- **Growth**: Plants transition through stages (seed → sprout → bud → bloom → mature → evergreen) based on visits and age.
- **Tending**: Adding reflections ("watering") promotes growth.
- **Seasons & Time**: The garden's appearance (colors, background) shifts based on real-world seasons and the local day/night cycle.

### Tech Stack
- **Framework**: React 19 + TypeScript + Vite.
- **Styling**: Tailwind CSS 4 + Radix UI components + OKLCH color spaces.
- **Animations**: Framer Motion for organic, spring-based movement.
- **Platform**: @github/spark SDK for:
  - **Authentication**: GitHub-based sign-in.
  - **Persistence**: `useKV` hook for memory and preference storage.
  - **AI**: GPT-4o/GPT-4o-mini for emotional tone classification and poetic reflections.
- **Visuals**: HTML5 Canvas API (via `GardenCanvas`) for the infinite pannable/zoomable workspace.
- **Icons**: Phosphor Icons and Lucide React.

## Project Structure
- `src/App.tsx`: Main application logic, state management, and view routing.
- `src/components/`:
  - `GardenCanvas.tsx`: The primary infinite canvas view.
  - `MemoryCard.tsx`: Detail view for a memory with tending actions.
  - `PlantMemoryModal.tsx`: Creation flow for new memories.
  - `Onboarding.tsx`: Guided tour for new users.
  - `MemoryClusters.tsx`: AI-suggested groupings of related memories.
  - `ui/`: Shared Radix-based UI components.
- `src/lib/`:
  - `garden-helpers.ts`: Core logic for growth stages, seasonal colors, and AI integrations.
  - `types.ts`: TypeScript interfaces for `Memory`, `Reflection`, and `UserPreferences`.
- `src/styles/`: Global styles and theme definitions using OKLCH.

## Building and Running
- **Development**: `npm run dev` (Starts Vite server)
- **Production Build**: `npm run build` (Runs `tsc` and `vite build`)
- **Linting**: `npm run lint` (Runs ESLint)
- **Preview**: `npm run preview` (Previews build locally)

## Development Conventions
- **Component Style**: Functional components using Tailwind CSS and Radix UI primitives.
- **State Management**: Use `@github/spark` hooks (`useKV`) for persistent user data. Avoid external state management libraries unless necessary.
- **Visual Harmony**: Adhere to the OKLCH color system defined in `garden-helpers.ts` and `theme.css`. Use Framer Motion for all non-static transitions.
- **AI Integration**: Use `window.spark.llm` for all AI features. GPT-4o-mini is preferred for classification; GPT-4o for creative/poetic generation.
- **Memory Storage**: Photos are stored as Data URLs (Base64) within the memory objects in the KV store.

## Important Context
- **Privacy**: All data remains in the user's GitHub-associated storage via Spark.
- **Interactions**: The "Garden" view is the primary interface; "Timeline" and "Clusters" are secondary views.
- **Metaphor Consistency**: Every feature should feel "organic" and "peaceful." Avoid harsh UI transitions or corporate aesthetics.
