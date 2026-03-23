# MemoryGarden PRD

A private, emotional digital garden where people plant and nurture personal memories through visual plant metaphors that grow and evolve over time, offering a calm alternative to traditional photo albums.

**Experience Qualities**:
1. **Peaceful** - Every interaction is slow, deliberate, and calming, creating a sanctuary from the chaos of everyday digital life
2. **Organic** - Plant growth, animations, and transitions feel natural and alive, mirroring real garden rhythms
3. **Intimate** - The space feels deeply personal and private, encouraging honest emotional reflection

**Complexity Level**: Complex Application (advanced functionality, likely with multiple views)

This app requires sophisticated state management for memory data, AI integration for emotional tone analysis and reflections, real-time growth animations, infinite canvas navigation with drag-and-drop, time-based visual changes, and multiple view modes. The feature set goes well beyond a simple CRUD app.

## Essential Features

### 1. Onboarding Flow
- **Functionality**: Four-step guided welcome tour introducing garden concept, planting mechanics, growth system, and tending behaviors
- **Purpose**: Set emotional tone and ensure users understand the metaphor before creating their first memory
- **Trigger**: First-time user lands on app after GitHub authentication
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
- **Functionality**: Plants change appearance based on memory age, visit frequency, and emotional tone (bud → flower → mature plant → evergreen)
- **Purpose**: Make passage of time and emotional patterns visible and beautiful
- **Trigger**: Automatic background process checking memory metadata
- **Progression**: New memory starts as small bud → visited memories bloom into flowers → frequently-tended plants grow larger → old unvisited memories mature into trees → emotional tone affects color palette
- **Success criteria**: Clear visual differentiation between growth stages, changes feel organic not sudden, colors map meaningfully to emotions

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
- **Progression**: User requests AI reflection → system sends memory text + nearby memory context to Spark LLM → receives poetic reflection or connecting question → displays in card
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

## Edge Case Handling

- **No memories yet**: Show beautiful empty garden with gentle prompt and inspiration to plant first memory
- **Upload failures**: Graceful retry with clear error message, preserve user's text input
- **AI unavailable**: Fallback to encouraging message, disable AI features gracefully
- **Slow network**: Show skeleton loaders, allow offline viewing of previously loaded memories
- **Very large gardens (500+ memories)**: Implement virtualization for canvas rendering, lazy-load images
- **Invalid dates**: Prevent future dates beyond today, handle very old dates (decades ago) gracefully
- **Missing photos**: Allow text-only memories with beautiful typography card
- **Browser compatibility**: Graceful degradation for browsers without modern canvas features

## Design Direction

The design should evoke the feeling of stepping into a private, twilit secret garden — soft, nostalgic, and gently alive. Every element should feel organic and handcrafted, not corporate or sterile. The experience should slow users down, encourage presence, and feel like a meditative ritual. Colors should be muted and natural, animations should follow realistic physics with slight elasticity, and typography should feel warm and literary.

## Color Selection

Drawing from natural garden environments at dusk — the moment between day and night when colors are richest and emotions feel closest to the surface.

- **Primary Color**: Deep sage green `oklch(0.55 0.08 155)` — grounding, growth-oriented, calming
- **Secondary Colors**: 
  - Warm earth brown `oklch(0.45 0.05 65)` — roots, stability, memory foundation
  - Soft petal pink `oklch(0.75 0.12 15)` — gentle blooms, tender emotions, highlights
- **Accent Color**: Warm golden honey `oklch(0.78 0.14 85)` — sunlight, moments of joy, important CTAs
- **Foreground/Background Pairings**: 
  - Background (soft ivory) `oklch(0.96 0.01 95)`: Dark charcoal text `oklch(0.25 0.01 95)` - Ratio 12.8:1 ✓
  - Sage green `oklch(0.55 0.08 155)`: White text `oklch(0.98 0 0)` - Ratio 5.2:1 ✓
  - Honey accent `oklch(0.78 0.14 85)`: Dark brown text `oklch(0.25 0.01 65)` - Ratio 7.9:1 ✓
  - Card surfaces (cream) `oklch(0.94 0.02 85)`: Dark charcoal text `oklch(0.25 0.01 95)` - Ratio 11.5:1 ✓

## Font Selection

Typography should feel literary, warm, and timeless — like handwritten journal entries that have become treasured heirlooms.

- **Primary Font**: Crimson Pro (serif) for memory text and body content — elegant, readable, emotionally warm
- **Secondary Font**: Space Grotesk (geometric sans) for UI labels and buttons — clean contrast with serif, modern but friendly
- **Typographic Hierarchy**:
  - H1 (Garden Title): Space Grotesk Bold / 36px / tight letter spacing / sage green
  - H2 (Memory Titles): Crimson Pro Semibold / 24px / normal spacing / dark charcoal
  - Body (Memory Text): Crimson Pro Regular / 18px / 1.7 line height / dark charcoal
  - UI Labels: Space Grotesk Medium / 14px / 0.02em letter spacing / muted sage
  - Captions (Dates/Locations): Space Grotesk Regular / 12px / 0.03em letter spacing / warm brown

## Animations

Animations should feel like watching plants grow in time-lapse — smooth, organic, and mesmerizing. Every movement should have weight and natural physics. Use animations to reinforce the garden metaphor and create moments of quiet delight.

- **Plant Growth**: Elastic spring physics when plants sprout or grow from tending, starting small and bouncing slightly at full size (800ms duration)
- **Canvas Navigation**: Smooth momentum-based panning with gentle deceleration, zoom follows cursor position with 300ms ease-out
- **Card Transitions**: Fade and subtle scale-up when opening memory cards (400ms), backdrop blur effect
- **Hover States**: Gentle lift on plants (2px translateY) with soft shadow increase over 200ms
- **Background Elements**: Continuous subtle parallax movement on leaves/grass (3-5 second cycles), randomized per element
- **Time Transitions**: Day/night cycle fades over 2 minutes of real time when crossing threshold hours
- **Interaction Feedback**: Ripple effect when planting new memory, gentle pulse on "Water" action
- **Loading States**: Organic skeleton shimmer that feels like sunlight moving through leaves

## Component Selection

- **Components**:
  - **Dialog** for memory planting modal and memory detail cards — full-screen on mobile, centered on desktop
  - **Card** for timeline view memory items and cluster groups — soft shadows, rounded corners
  - **Button** for primary actions (Plant Memory, Water, AI Reflect) — use variants: default for primary sage, outline for secondary actions, ghost for tertiary
  - **Textarea** for memory text input and reflection notes — auto-resize, markdown preview toggle
  - **Calendar** (date-picker) for memory date selection — starts on selected/today, shows past dates primarily
  - **Tabs** for view mode switching (Garden / Timeline / Clusters) — underline indicator with slide animation
  - **Avatar** for user profile in header — shows GitHub avatar with subtle border
  - **Switch** for settings toggles (sound on/off, light/dark mode) — sage green when active
  - **Popover** for plant hover previews — shows mini memory preview without full card
  - **Scroll-area** for timeline and cluster views — custom scrollbar styled to match theme
  - **Separator** between memory sections and settings groups — subtle, uses border color
  - **Badge** for memory tags (location, emotional tone) — small, muted colors, rounded-full

- **Customizations**:
  - Custom infinite canvas component using HTML5 Canvas API for garden view rendering
  - Custom plant SVG components with animated paths for growth stages
  - Custom parallax background with layered SVG elements for depth
  - Custom drag-and-drop system using Framer Motion's drag constraints
  - Custom ambient audio player with fade in/out

- **States**:
  - Buttons: default, hover (slight lift + shadow), active (press down), disabled (reduced opacity + no pointer)
  - Plants: idle (subtle breathing animation), hover (lift + glow), selected (strong glow), dragging (semi-transparent + cursor grab)
  - Inputs: empty (placeholder visible), typing (border highlight), filled (checkmark icon), error (red border + message)
  - Cards: entering (fade + scale up), open (static), exiting (fade + scale down)

- **Icon Selection**:
  - Plant (for plant memory button)
  - Drop (for water/reflect action)
  - Sparkle (for AI reflection button)
  - CalendarBlank (for date picker)
  - MapPin (for location)
  - List (for timeline view)
  - Tree (for garden view)
  - GridFour (for clusters view)
  - Image (for photo upload)
  - CloudArrowUp (for upload state)
  - Export (for export feature)
  - Gear (for settings)
  - Moon/Sun (for time of day)

- **Spacing**:
  - Base unit: 4px (Tailwind default)
  - Canvas padding: 12 (48px) around edges
  - Card padding: 6 (24px) internal
  - Button padding: 3 (12px) vertical, 6 (24px) horizontal
  - Section gaps: 8 (32px) between major sections
  - Plant minimum spacing: 16 (64px) between plant centers
  - Memory card max-width: 2xl (672px)

- **Mobile**:
  - Navigation tabs become bottom sheet with icons only
  - Plant memory button becomes fixed bottom-right FAB
  - Memory cards are full-screen modals on mobile
  - Canvas gestures: pinch-to-zoom, two-finger pan, tap-and-hold to drag plants
  - Timeline view uses vertical scroll with cards at full viewport width
  - Reduce parallax complexity on mobile for performance
  - Garden canvas defaults to zoomed-out overview on small screens
