# MemoryGarden PRD

[content-to-enhance id="prd-overview"]
A private, emotional digital garden where people plant and nurture personal memories through visual plant metaphors that grow and evolve over time, offering a calm alternative to traditional photo albums.

**Experience Qualities**:

1. **Peaceful** - Every interaction is slow, deliberate, and calming, creating a sanctuary from the chaos of everyday digital life
2. **Organic** - Plant growth, animations, and transitions feel natural and alive, mirroring real garden rhythms
3. **Intimate** - The space feels deeply personal and private, encouraging honest emotional reflection

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)

This app requires sophisticated state management for memory data, AI integration for emotional tone analysis and reflections, real-time growth animations, infinite canvas navigation with drag-and-drop, time-based visual changes, and multiple view modes. The feature set goes well beyond a simple CRUD app. Implementation is **local-first** (browser storage for memories and media) with **optional** cloud metadata sync and an **Edge-proxied LLM** when hosting provides API keys.
[/content-to-enhance]

[content-to-enhance id="prd-essential-features"]
## Essential Features

### 1. Onboarding Flow

- **Functionality**: Four-step guided welcome tour introducing garden concept, planting mechanics, growth system, and tending behaviors
- **Purpose**: Set emotional tone and ensure users understand the metaphor before creating their first memory
- **Trigger**: First-time user opens the app before completing onboarding (local profile established; no external login required for core flows)
- **Progression**: Welcome screen → Garden philosophy explanation → Planting tutorial → Growth & tending preview → Immediate prompt to plant first memory
- **Success criteria**: User completes tour and successfully plants their first memory seed within 3 minutes

### 2. Garden Canvas (Main View)
- **Functionality**: Infinite pannable/zoomable canvas displaying memories as visual plants with dynamic backgrounds, parallax effects, and day/night cycles
- **Purpose**: Create a non-linear, emotionally resonant spatial representation of life memories
- **Trigger**: Default landing screen after onboarding
- **Progression**: User enters → sees panoramic garden → can pan/zoom freely → click plants to open memories → drag to rearrange → add new plants via floating button
- **Success criteria**: Smooth 60fps animations, intuitive drag interactions, plants visually distinct by memory age/type/emotional tone

### 3. Memory Planting
- **Functionality**: Multi-step modal for creating new memory (photo upload + text + date + optional location)
- **Purpose**: Capture meaningful moments with context in a focused, distraction-free flow
- **Trigger**: Click floating "+ Plant New Memory" button or prompt after onboarding
- **Progression**: Button click → modal opens → drag/drop or select photo → write memory text (1-3 sentences) → set date (defaults today) → optional location autocomplete → plant → sprouting animation
- **Success criteria**: Upload completes under 5s, text supports markdown, date picker is calendar-based, animation feels satisfying and organic

### 4. Memory Tending & Growth
- **Functionality**: Click plant to view full memory card with photo, text, metadata, and action buttons for reflection or AI insights
- **Purpose**: Encourage revisiting memories to deepen emotional connection and see visual growth
- **Trigger**: User clicks any plant in garden
- **Progression**: Click plant → card opens with fade-in → view photo/text/date → choose "Water/Reflect" → add reflection note → plant grows visibly → OR choose "Ask Garden AI" → AI generates poetic reflection → card updates
- **Success criteria**: Plants visually evolve (size, bloom stage) with each interaction, AI responses feel gentle and insightful

### 5. Plant Visual Evolution
- **Functionality**: Plants change appearance based on memory age, visit frequency, emotional tone (bud → flower → mature plant → evergreen), and now include distinct plant varieties (flowers, trees, succulents, vines, herbs, wildflowers) with expanded growth stages
- **Purpose**: Make passage of time and emotional patterns visible and beautiful, with richer visual diversity representing different types of memories
- **Trigger**: Automatic background process checking memory metadata
- **Progression**: New memory starts as small seed → with visits becomes sprout → develops into seedling → grows to young plant → matures to full bloom/tree → reaches elder/ancient stage → emotional tone affects color palette, plant variety influences growth pattern and visual metaphor
- **Success criteria**: Clear visual differentiation between 8 growth stages and 6+ plant varieties, changes feel organic not sudden, colors map meaningfully to emotions, variety selection feels appropriate to memory characteristics

### 6. Time-Based Garden Changes
- **Functionality**: Background, plant types, and atmosphere shift with real-world time (day/night cycle) and seasons
- **Purpose**: Connect digital garden to user's lived reality and passage of time
- **Trigger**: Local device time and date
- **Progression**: System checks time → applies time-of-day lighting (dawn/day/dusk/night) → checks season → applies seasonal effects (spring blooms, summer lush, autumn colors, winter snow)
- **Success criteria**: Transitions are subtle and gradual, seasonal plants feel contextually appropriate

### 7. AI Reflection & Clustering
- **Functionality**: LLM analyzes memory text to classify emotional tone, suggest memory clusters, and generate gentle reflective prompts
- **Purpose**: Help users discover patterns and connections between memories they might not notice
- **Trigger**: User clicks "Ask the Garden AI" on a memory, or views Clusters tab
- **Progression**: User requests AI reflection → client sends memory text + nearby memory context through the app LLM layer (Edge `/api/llm` → Anthropic when configured; optional Spark SDK in compatible hosts) → receives poetic reflection or connecting question → displays in card
- **Success criteria**: Responses feel personal and insightful, clustering groups make intuitive sense, emotional tone detection is 80%+ accurate

### 8. Multiple View Modes
- **Functionality**: Three ways to explore memories - spatial Garden view (default), chronological Timeline, and AI-suggested Clusters
- **Purpose**: Support different browsing moods and discovery patterns
- **Trigger**: View toggle buttons in navigation header
- **Progression**: User clicks view selector → smooth transition to Timeline (linear scrollable list) OR Clusters (grouped cards by theme/time) → can click memory to see detail → return to Garden view
- **Success criteria**: All views show same memory data, transitions feel cohesive, each view offers distinct value

### 9. Export & Sharing
- **Functionality**: Generate beautiful static image of garden or PDF booklet of memories
- **Purpose**: Allow users to preserve and selectively share their garden outside the app
- **Trigger**: User clicks export button in settings/menu
- **Progression**: User chooses export type (image/PDF) → selects memories to include or entire garden → system renders high-quality output → downloads file
- **Success criteria**: Exported artifacts are print-quality beautiful, generation takes under 30s for 50 memories

### 10. Protocol Handlers & Deep Linking
- **Functionality**: Register custom web protocols (`web+memorygarden://`, `web+plantmemory://`, `web+viewmemory://`) when installed as PWA, enabling external apps and websites to trigger actions in MemoryGarden
- **Purpose**: Enable seamless integration with other apps and automation tools, allowing users to quickly plant memories or view specific ones from external sources
- **Trigger**: External application or website invokes a custom protocol URL, or user clicks a protocol link
- **Progression**: Protocol URL invoked → app receives protocol request → validates and parses parameters → executes corresponding action (open plant modal, view specific memory, etc.) → provides user feedback
- **Success criteria**: Protocol handlers register successfully on PWA installation, all three protocols work reliably, invalid requests show appropriate error messages, Share Target API allows direct photo sharing from camera/gallery

### 11. Fertilizer Boost System
- **Functionality**: Three-tier fertilizer system that accelerates plant growth with unique visual particle effects for each tier
- **Purpose**: Provide immediate gratification and visual spectacle for users wanting to rapidly grow specific memories
- **Trigger**: User clicks "Boost" button on a memory card
- **Progression**: Click boost → modal opens showing three tiers → user selects tier (Garden Boost/Premium/Legendary) → applies boost → tier-specific particle animation plays in modal → plant receives instant vitality boost → plant displays corresponding growth particle effect in garden → growth animation completes
- **Success criteria**: Each tier has visually distinct particles, animations feel impactful and satisfying, free tier encourages trying premium options, plant growth is immediately visible
- **Particle Effects**:
  - **Standard (Garden Boost)**: Gentle water droplets falling from top with subtle ripple waves radiating outward - calm and nurturing (25 droplets, 8 ripples, 2s duration)
  - **Premium Fertilizer**: Energetic spiral particles bursting outward with rotating sparkle stars and expanding rings - magical and transformative (40 spirals, 15 sparkles, 3 rings, 1.5s duration)
  - **Legendary Elixir**: Explosive radial burst with orbiting particles, expanding waves, floating crown stars, and central glow - epic and awe-inspiring (60 burst particles, 30 orbital particles, 8 waves, 20 crown stars, 2.5s duration)

### 12. Keyboard Shortcuts
- **Functionality**: Global keyboard shortcuts for common actions with discoverable help panel
- **Purpose**: Power users can navigate and interact with the garden efficiently without reaching for the mouse
- **Trigger**: User presses keyboard shortcut (e.g., Cmd/Ctrl+N to plant a memory) or presses `?` to view all shortcuts
- **Progression**: User presses shortcut → action executes immediately → OR user presses `?` → shortcuts panel opens → displays categorized list of all available shortcuts with platform-specific formatting (⌘ on Mac, Ctrl on Windows)
- **Success criteria**: Shortcuts work reliably, don't conflict with browser shortcuts, shortcuts panel is easy to discover, formatting adapts to user's platform
- **Available Shortcuts**:
  - **Cmd/Ctrl+N**: Plant a new memory
  - **1**: Switch to garden view
  - **2**: Switch to timeline view
  - **3**: Switch to clusters view
  - **Cmd/Ctrl+Shift+E**: Export garden
  - **?**: Show keyboard shortcuts panel
[/content-to-enhance]

[content-to-enhance id="prd-edge-cases"]
## Edge Case Handling

- **No memories yet**: Show beautiful empty garden with gentle prompt and inspiration to plant first memory
- **Upload failures**: Graceful retry with clear error message, preserve user's text input
- **AI unavailable** (no API key, 503 from `/api/llm`, or network failure): Fallback copy, disable or soften AI affordances without blocking the rest of the garden
- **Slow network**: Show skeleton loaders, allow offline viewing of previously loaded memories
- **Very large gardens (500+ memories)**: Implement virtualization for canvas rendering, lazy-load images
- **Invalid dates**: Prevent future dates beyond today, handle very old dates (decades ago) gracefully
- **Missing photos**: Allow text-only memories with beautiful typography card
- **Browser compatibility**: Graceful degradation for browsers without modern canvas features
[/content-to-enhance]

[content-to-enhance id="prd-design-direction"]
## Design Direction

MemoryGarden should feel less like “software” and more like a threshold you cross into a private place: a **twilit garden** where the light is low, the colors are soft, and nothing demands your attention on a schedule. The emotional brief is **nostalgia without kitsch**, **calm without emptiness**, and **life without noise**.

### Qualities to protect

- **Restraint** — The interface never competes with the memories themselves. Chrome stays quiet; motion stays small until it celebrates something meaningful (a new plant, a boost, a seasonal shift).
- **Tactility** — Surfaces feel slightly organic: rounded corners, soft shadows, paper-like cards. Avoid glassy, neon, or hyper-minimal “dashboard” aesthetics.
- **Duration** — Interactions reward lingering. Nothing should feel optimized for “time on site” in the attention-economy sense; pacing should feel respectful of grief, joy, and ordinary days alike.
- **Coherence** — Every pattern ties back to the garden metaphor: growth, seasons, soil, water, light. If a feature cannot be described in that vocabulary, it probably needs reframing.

### What we deliberately avoid

- Transactional language (“Buy,” “Unlock now,” “Don’t miss out”) except where a real purchase or entitlement exists—and even then, soften tone.
- Sharp contrast spikes, strobing motion, or sudden full-screen flashes (photos already carry emotional weight).
- Dense data tables or spreadsheet mental models for memories; the spatial canvas and timeline exist precisely to escape that frame.

### Experience pillars

1. **Sanctuary** — The garden is a place to return to, not a feed to scroll. Empty states should feel inviting, not accusatory.
2. **Ritual** — Planting and tending are small ceremonies: predictable steps, gentle feedback, no punitive errors for imperfect input.
3. **Continuity** — Day, night, and seasons stitch the digital garden to lived time. Visual change should feel observed, not announced with alarms.

### Art direction summary

Think **hand-tended**, **dusk-lit**, **quietly alive**. Typography reads like a journal; color reads like soil, leaf, petal, and honey; motion reads like growth and weather—not like interface gimmicks.
[/content-to-enhance]

[content-to-enhance id="prd-color-selection"]
## Color Selection

The palette is anchored in **dusk in a real garden**—when greens deepen, warm surfaces hold light longer, and small accents (petal, honey) read as precious rather than loud. All specified colors use **OKLCH** so lightness and chroma stay perceptually stable across displays and future theme tuning.

### Semantic roles (how to think before picking a swatch)

- **Structure** — Large fields (page background, card shells) stay high-lightness, low-chroma neutrals so memories and plants remain the focal plane.
- **Navigation & chrome** — Sage carries “you are in the garden” identity; use it for persistent UI that should feel rooted, not shouty.
- **Emotion & highlight** — Pink and honey are sparing accents: blooms, gentle emphasis, primary actions that deserve a glint of warmth.
- **Memory legibility** — Body copy and long-form memory text always prioritize contrast on ivory/cream surfaces over decorative tinting.

### Core tokens

- **Primary — deep sage** `oklch(0.55 0.08 155)`  
  Use for primary buttons (when paired with appropriate foreground), key navigation affordances, and brand continuity. Reads as **growth and steadiness** without clinical green.

- **Secondary — earth brown** `oklch(0.45 0.05 65)`  
  Anchors metadata, dividers, and “grounding” UI: dates, captions, roots-and-soil metaphors. Keeps the eye from floating on undifferentiated gray.

- **Secondary — soft petal pink** `oklch(0.75 0.12 15)`  
  Tender highlights for emotional warmth—secondary labels, subtle fills, gentle emphasis on bittersweet or intimate content. Not bubble-gum; always dusk-tinted.

- **Accent — warm honey** `oklch(0.78 0.14 85)`  
  Sunlit moments: celebratory CTAs, seasonal hints, “something wonderful happened here.” Use **narrowly** so it never becomes the default button color everywhere.

### Paired surfaces (contrast targets documented for QA)

These pairings are the non-negotiable readability backbone for long reading sessions and outdoor-brightness devices:

| Role | Background | Foreground | Notes |
|------|------------|------------|------|
| Page / shell | Soft ivory `oklch(0.96 0.01 95)` | Dark charcoal `oklch(0.25 0.01 95)` | **12.8:1** — primary reading plane |
| Sage fills | Sage `oklch(0.55 0.08 155)` | Near white `oklch(0.98 0 0)` | **5.2:1** — large type & confident labels |
| Honey fills | Honey `oklch(0.78 0.14 85)` | Dark brown `oklch(0.25 0.01 65)` | **7.9:1** — short labels & chips |
| Cards | Cream `oklch(0.94 0.02 85)` | Dark charcoal `oklch(0.25 0.01 95)` | **11.5:1** — memory cards & dialogs |

### Implementation discipline

- Introduce **no ad-hoc hex/RGB** in new UI; extend tokens in OKLCH alongside `garden-helpers` / theme CSS.
- When emotional tone changes plant tint, **derive** from the shared maps—do not invent one-off saturated hues per memory.
- Seasonal gradients may shift globally; they should **never** reduce text contrast below comfortable reading for the chosen surface pair.
[/content-to-enhance]

[content-to-enhance id="prd-font-selection"]
## Font Selection

Typography carries half the emotional signal in MemoryGarden. Users are not scanning dashboards—they are **reading remembered life**. Type should feel **literary**, **warm**, and **enduring**: the visual cousin of a journal passed down, not a system notification.

### Type families

- **Crimson Pro (serif)** — Primary voice for **memory text**, long reflections, and narrative-heavy surfaces. Its rhythm suits paragraphs people read slowly; it photographs beautifully on cream cards and tolerates generous line height.
- **Space Grotesk (sans)** — Instrumentation layer: **navigation**, **buttons**, **metadata**, **short labels**. Geometric enough to feel contemporary; humanist enough not to clash with Crimson’s warmth. Never use sans for the main memory paragraph unless accessibility overrides demand it—and then increase size/weight deliberately.

### Hierarchy & intent

| Role | Treatment | Color intent |
|------|-----------|----------------|
| **Garden / app title (H1)** | Space Grotesk Bold, ~36px, tight tracking | Sage green — establishes place, not shouting brand |
| **Memory titles (H2)** | Crimson Pro Semibold, ~24px | Dark charcoal on ivory/cream — the emotional headline |
| **Memory body** | Crimson Pro Regular, ~18px, **1.7** line height | Dark charcoal — optimized for 45–75 character measure inside cards |
| **UI labels** | Space Grotesk Medium, ~14px, +0.02em tracking | Muted sage — supportive, not competing with memory voice |
| **Captions** (dates, places, micro-meta) | Space Grotesk Regular, ~12px, +0.03em tracking | Warm brown — ties to “earth” in the palette story |

### Composition rules

- **Measure** — Avoid full-bleed serif lines across ultra-wide modals; constrain text blocks (`max-width` in the `2xl` card neighborhood) so Crimson doesn’t sprawl into fatigue.
- **Pairing** — When serif and sans sit adjacent (title + date line), align baselines and keep sans **one step smaller** or **one weight lighter** so hierarchy stays obvious without size wars.
- **Numbers & dates** — Prefer Space Grotesk for numeric clarity; keep separators subtle so dates feel archival, not bureaucratic.
- **Localization headroom** — German and other expanded languages may need **+10–15% vertical rhythm**; hierarchy specs are targets, not traps—preserve line height before shrinking Crimson.

### Accessibility cross-check

- Minimum body size on mobile should not dip below comfortable reading for extended journaling; if density demands smaller type, **increase contrast** on the surface rather than shrinking forever.
- Never rely on color alone for tone labels—pair **badge copy** or icons with emotional-tone chips.
[/content-to-enhance]

[content-to-enhance id="prd-animations"]
## Animations

Motion is how the garden **proves it is alive**. Nothing should animate because “apps animate”—every curve should echo growth, weather, water, or breath. Prefer **springs and eased curves** over linear tweens; prefer **layered small moves** over single exaggerated transitions.

### Principles

- **Cause & effect** — Motion narrates user intent: planting completes with settlement; tending rewards with growth cues; boosts read as nourishment, not slot-machine payoff.
- **Energy budget** — Canvas and particles may run continuously at low amplitude; dialogs and lists stay conservative to protect focus and battery.
- **Interruptibility** — Users must never wait on ornamentation; decorative loops yield instantly to input.

### Specified behaviors

- **Plant growth** — On sprout or stage-up, use **elastic spring** easing: start small, overshoot slightly, settle (~**800ms**). This sells organic mass without rubber-band nausea (damping tuned per plant scale).

- **Fertilizer particles** — Tiered spectacle, same emotional grammar:
  - **Garden Boost** — Droplets + ripples: nurturing rain, low chaos.
  - **Premium** — Spirals + sparkles: joyful but contained magic.
  - **Legendary** — Radial burst + orbitals: awe without screen-filling glare; duration capped so it reads as celebration, not obstruction.

- **Canvas navigation** — **Momentum pan** with friction-like deceleration; **zoom** eases toward cursor focal point (~**300ms** ease-out). Avoid hard stops unless snapping to a bookmarked view.

- **Memory cards** — Enter with **fade + subtle scale-up** (~**400ms**); backdrop uses **blur** to isolate the memory photographically. Exit mirrors enter—never blink.

- **Hover on plants** — **~2px lift**, shadow bloom ~**200ms**. Hover should whisper “I’m here,” not jitters.

- **Background ambience** — Parallax leaf/grass drift on **3–5s** loops with **element-level phase offsets** so motion feels organic, not synchronized wallpaper.

- **Day / night** — When crossing threshold hours, transition global lighting over ~**2 minutes** wall-clock (not a snap). Users should *notice* the garden breathing through the day.

- **Interaction ripples** — Planting a seed triggers a soft radial ripple; **Water / Reflect** uses a restrained pulse on the plant body—reassurance, not arcade FX.

- **Loading** — Skeletons use a **slow shimmer** like wind-light through foliage—never harsh diagonal raster stripes.

- **Boost button busy state** — Shimmer sweep plus **micro-particles** tied to selected tier language; must remain legible and cancel-friendly.

### Performance guardrails

- Cap simultaneous particle systems on low-power devices; degrade parallax before dropping frame budget on card transitions.
- Prefer **transform/opacity** animations; avoid animating expensive shadow chains on every frame during canvas drag.
[/content-to-enhance]

[content-to-enhance id="prd-component-selection"]
## Component Selection

Components should read as **garden furniture**: sturdy enough to use every day, quiet enough to disappear behind the plants. We stack **Radix-based primitives** from `src/components/ui/` for accessibility and consistency, then layer **custom canvas/SVG** where metaphor demands it.

### Shell & navigation

- **Tabs** — Primary view switching (**Garden / Timeline / Clusters**). Use an **underline + sliding indicator** so mode changes feel like sliding along a path, not swapping spreadsheets. Keyboard focus order follows visual order.

- **Avatar** — Profile anchor in the header: local user identity / optional GitHub image when linked—always **circular**, subtle border using semantic outline tokens (OKLCH), never a loud ring.

- **Switch** — Binary preferences (**sound**, **theme**, **sync-related toggles** where applicable). Active track uses **sage** family tones from the palette doc; avoid neon “on” colors.

### Memory workflows

- **Dialog** — Houses **planting** and **memory detail**. **Full-screen on small viewports** so photography feels immersive; **centered sheet on desktop** with generous breathing room. Trap focus; restore on close.

- **Card** — Timeline rows and cluster tiles: **soft shadow**, **rounded corners**, hover elevation subtle enough for long lists.

- **Button** — Variants map to intent:
  - **Primary** — Plant / affirm actions (sage fill when contrast-approved).
  - **Outline** — Secondary paths that still deserve weight.
  - **Ghost** — Tertiary actions that must not compete with memory content.

- **Textarea** — Memory body + reflections: **auto-grow**, optional **markdown preview** toggle; placeholder copy should sound human, not form-like.

- **Calendar** — Memory dates biased toward **past** selection; default intelligently to **today** or **memory’s existing date** when editing.

- **Popover** — Lightweight plant hover: **thumbnail + title snippet**, opens quickly, never obscures the canvas unnecessarily.

- **Scroll-area** — Timeline / clusters: theme-styled scrollbar; preserve **scroll-padding** so focused cards don’t sit under sticky headers.

- **Separator** & **Badge** — Separate sections within settings and tag metadata (**location**, **tone**). Badges stay **small**, **rounded-full**, **muted fills**—labels carry meaning, color only reinforces.

### Custom systems (non-Radix core)

- **Garden canvas** — HTML5 Canvas **infinite plane**: pan, zoom, layered rendering. Must degrade gracefully when GPU budget tightens.
- **Plant SVG system** — Stage-accurate silhouettes / paths with **Framer Motion**-driven growth transitions tied to `PlantStage`.
- **Parallax stack** — Layered SVG / canvas backgrounds for depth without stealing contrast from plants.
- **Drag & drop** — Framer Motion constraints for repositioning memories; collision/nudging rules respect **minimum plant spacing** below.
- **Ambient audio** — Optional loop player with **fade in/out** tied to user sound toggle and time-of-day profiles.

### Interaction states (contract for designers & engineers)

- **Buttons** — default → hover (lift + shadow) → active (compress) → disabled (opacity + `pointer-events: none`). Loading states swap label for **non-blocking** spinner/shimmer where appropriate.
- **Plants** — idle “breath” → hover lift → selected glow → dragging translucency + grab cursor. Selection glow must stay **readable on all seasonal backgrounds**.
- **Inputs** — empty placeholder → focused ring/highlight → filled validation → **error** with semantic destructive outline + text (derive from theme tokens, not one-off reds).
- **Cards / dialogs** — mount (fade + scale) → steady → unmount mirror; respect **reduced-motion** overrides.

### Icon vocabulary (Phosphor family unless noted)

Keep metaphors literal to gardening and archives:

| Icon | Use |
|------|-----|
| Plant | Primary “plant memory” |
| Drop | Water / reflect |
| Sparkle | Ask Garden AI |
| CalendarBlank | Date picking |
| MapPin | Location |
| List / Tree / GridFour | Timeline / Garden / Clusters |
| Image / CloudArrowUp | Photo picker & upload progress |
| Export | Share / export flows |
| Gear | Settings |
| Moon / Sun | Time-of-day hints |

### Spacing scale (Tailwind-native)

- **Base unit**: 4px.
- **Canvas edge padding**: `12` (48px) so plants never hug the bezel awkwardly on notched phones.
- **Card interior**: `6` (24px); **buttons**: `py-3 px-6` equivalent unless compact rows demand tighter rhythm.
- **Section gaps**: `8` (32px) between major settings clusters.
- **Minimum plant spacing**: `16` (64px) between centers at default zoom bands—prevents unreadable overlap without forbidding dense gardens at higher zoom-out.
- **Memory dialog max width**: ~`2xl` (672px) for comfortable Crimson measure.

### Mobile adaptations

- **Tabs** compress to **bottom icon bar** or equivalent thumb-friendly control; labels optional where icons are universal.
- **FAB** for planting — fixed **bottom-end**, safe-area aware.
- **Memory surfaces** — prefer **full-screen dialog** over cramped split views.
- **Canvas gestures** — pinch-zoom, two-finger pan, **long-press drag** for plants; tune sensitivity so pans don’t fight vertical scroll on hybrid devices.
- **Timeline** — single-column cards at **full bleed width** with comfortable vertical rhythm.
- **Performance** — reduce parallax layers and particle counts before lowering canvas resolution; never silently drop text contrast when saving GPU budget.
- **Default zoom** — slightly **zoomed-out overview** on first land so large gardens feel navigable on small screens.
[/content-to-enhance]

[content-to-enhance id="prd-testing-qa"]
## Testing & Quality Assurance

### Test Coverage
The application includes comprehensive test suites covering:

- **Edge Case Test Suite** (`src/lib/__tests__/edge-cases.test.ts`) - 130+ tests
  - Growth calculation extremes (zero interactions, massive clusters, overflow prevention)
  - Plant stage transitions (rapid progression, boundary values)
  - Emotional tone classification (empty strings, unicode, emojis, long text)
  - Search and filter combinations (5000-memory stress tests, contradictory filters)
  - Garden mood computation (empty gardens, balanced distributions)
  - Unlock system boundaries (maxed counters, negative values, duplicate prevention)
  - Trait system scenarios (genetics determinism, visual resolution)
  - Time and date boundaries (seasons, DST, leap years, year transitions)
  - Concurrent operations (immutability, sequential boosts)
  - Data type boundaries (extreme coordinates, undefined fields)

- **Unit Test Suites**
  - `garden-helpers.test.ts` - Core garden logic functions
  - `unlock-system.test.ts` - Currency and achievement systems
  - `trait-system.test.ts` - Genetic trait generation
  - `local-user.test.ts` - User profile management
  - `utils.test.ts` - Utility functions
  - `llm-client.test.ts` - LLM provider selection and `/api/llm` HTTP behavior

- **Integration Test Suite** (`src/lib/__tests__/integration.test.ts`)
  - End-to-end feature workflows
  - Cross-system interactions
  - State management validation

### Test Execution
```bash
# Run all tests
npm test

# Run specific test suite
npm test -- src/lib/__tests__/edge-cases.test.ts

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Quality Standards
- ✅ All edge cases properly handled with graceful degradation
- ✅ Deterministic results for identical inputs
- ✅ Immutability preserved through all operations
- ✅ Scalability validated up to 5000+ memories
- ✅ Boundary value testing for all numeric thresholds
- ✅ Temporal logic verified across seasons, day periods, and date transitions

See `EDGE_CASE_TEST_REPORT.md` and `TEST_UPDATES.md` for detailed test documentation.
[/content-to-enhance]
