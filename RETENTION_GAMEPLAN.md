# MemoryGarden 3D Walkthrough: Retention Game Plan & Master Architecture Specification

> **Version**: 1.0.0  
> **Target Subsystem**: 3D First-Person Garden Walkthrough (`src/components/open-world/`, `src/lib/open-world/`)  
> **Status**: Approved Architectural Master Document  
> **Target Deliverable**: `/home/keef/projects/memorygarden/RETENTION_GAMEPLAN.md`

---

## 1. Executive Summary & Mindful Product Vision

### 1.1 Philosophy of the Emotional Sanctuary
MemoryGarden is fundamentally an intimate, peaceful, and sacred digital sanctuary for human reflection. Unlike mainstream mobile and social gaming products that exploit dopamine-depleting dark patterns, artificial urgency, and punitive loss aversion, MemoryGarden's retention design is anchored in **mindful stewardship**. 

The 3D garden walkthrough (`src/components/open-world/`) transforms an abstract list of personal journal entries into a tactile, spatial reality. Users do not return to clear notifications or protect an arbitrary number from resetting; they return to walk among their memories, breathe in ambient garden soundscapes, observe how time and care have nurtured their thoughts into blooming botanical life, and tend to both their own memories and those shared by loved ones.

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MINDFUL RETENTION CORE PILLARS                    │
├───────────────────┬───────────────────┬────────────────────────────────┤
│ 1. Sanctuary      │ 2. Non-Punitive   │ 3. Frictionless Immersion     │
│    Over Casino    │    Gentle Cycles  │    in 3D Space                 │
│                   │                   │                                │
│ Intimate, calm    │ Zero permanent    │ Walk up, tend, water, inspect  │
│ emotional ground; │ death; dormant/   │ without modal jarring or       │
│ zero predatory    │ wintering states; │ interruption of spatial flow;  │
│ streaks or spam.  │ gracious return.  │ tactile WebGL physical presence│
└───────────────────┴───────────────────┴────────────────────────────────┘
```

### 1.2 Non-Punitive Gentle Retention: Zero Permanent Death
In nature, a garden does not die overnight when the gardener takes a journey. It slows its metabolism, drops blossoms, conserves moisture in deep root systems, and patiently awaits the next rainfall.

1. **Memories Never Perish**: No user memory will ever wither, die, degrade in quality, or be deleted due to inactivity. A memory planted five years ago remains permanently preserved, safe and cherished.
2. **Dormancy vs. Death**: If a plant goes unwatered or unvisited for extended periods, it enters a gentle **Dormant / Wintering State**. Its foliage softens into restful tones, blossoms draw inward into resting buds, and ground foliage rests under a quiet dusting of morning mist.
3. **Restorative Celebration**: The moment a user returns and pours water upon a dormant plant, it instantly experiences a celebratory revival: Quick-Water (`[Q]`) immediately restores moisture to **80.0%** (`thriving`), while Full Reflection Watering (`[E]`) restores it to **100.0%** (`thriving`). Stems stretch upward with spring-like vitality, moisture infuses the soil with dark rich loam, and petals unfurl accompanied by crystalline audio chimes. Returning after absence is greeted with warmth, forgiveness, and renewal, never guilt or shame.

### 1.3 Spatial Immersion Without Friction
A critical flaw identified in the initial 3D walkthrough implementation was interaction friction: approaching a plant within `INTERACT_RADIUS` (2.65m) and pressing `KeyE` immediately paused the 3D WebGL engine, exited pointer-lock, and launched a 2D DOM modal (`<MemoryCard>`). This jarring context shift pulled the user completely out of the world.

The retention game plan introduces **Direct In-World Micro-Tending**:
- **Dual Proximity Action HUD**: Approaching any plant presents two distinct interaction avenues:
  - `[Q] Quick Water / Tend`: Water directly within the 3D viewport. When active ($0\% < M < 75\%$), adds $+25\%$ moisture (up to $100\%$). When dormant ($M = 0\%$), awakens the plant immediately to $80\%$ (`thriving`). When satiated ($M \ge 75\%$), displays *"Soil is rich and moist"*. Translucent water particles arc from the player camera to the soil mound; the earth darkens, water drops ripple, and the plant gently bounces with turgor. The user remains in first-person immersion.
  - `[E] Deep Remember`: Opens the detailed memory card for journaling, photo viewing, audio listening, or AI reflection synthesis. Full watering via reflection restores moisture to $100\%$ with an 18-hour cooldown on major growth XP.
- **Atmospheric Sensory Immersion**: Dynamic day-and-night cycles, procedural weather (gentle rain showers, golden sunbeams, twilight mist), and spatial procedural Web Audio combine to create a tranquil space where users simply want to be.

### 1.4 Architectural Synthesis
The retention mechanics span five existing application layers, ensuring complete backwards compatibility and 60 FPS mobile performance:
1. **Pure Three.js Engine (`src/components/open-world/`)**: Imperative WebGL rendering, custom procedural meshes in `plant-mesh.ts`, instanced particles, and dynamic lighting rigs.
2. **Headless Math & Physics (`src/lib/open-world/`)**: DOM-free coordinate projection, cluster bed layouts (`layout.ts`), collision detection, and proximity queries (`locomotion.ts`).
3. **Reactive Data Store & Storage (`src/lib/storage.ts`, `src/hooks/use-memories-kv.ts`)**: Namespaced `localStorage` for rapid metadata, IndexedDB for binary blobs, and cloud sync hooks.
4. **Social & Identity Engine (`src/lib/local-user.ts`, `src/lib/social-tending.ts`)**: Pseudonymous local-first user identity, reciprocal watering bonds, and activity feeds.
5. **Community Backend (`api/gardens.ts`)**: Serverless Neon PostgreSQL database managing shared plots, visitor logs, and collaborative milestones.

---

## 2. R1. Retention Architecture & Multi-Tier Engagement Loops

To establish sustainable, lifelong engagement, retention mechanics are structured across three interlocking loop tiers: Daily, Weekly, and Long-Term.

```
       ┌───────────────────────────────────────────────────────────┐
       │               LONG-TERM LOOPS (Months - Years)            │
       │   Seasonal Equinoxes • Eternal Memory Radiance • Groves   │
       │   Rare Genetics • Community Unlocks • Cross-Pollination   │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
       ┌─────────────────────────────┴─────────────────────────────┐
       │                  WEEKLY LOOPS (Days - Weeks)              │
       │   Growth Stage Evolutions • Weekend Twilight Blooming     │
       │   Deep Reflection Cycles • Reciprocal Buddy Tending       │
       └─────────────────────────────┬─────────────────────────────┘
                                     │
       ┌─────────────────────────────┴─────────────────────────────┐
       │                   DAILY LOOPS (Minutes - Hours)           │
       │   Morning Dew Harvest • Direct 3D Quick-Water [Q]         │
       │   Garden Walkthrough Inspection • Gentle Streak Care      │
       └───────────────────────────────────────────────────────────┘
```

### 2.1 The Daily Loop (Micro-Tending & Mindfulness)
Designed to take 2 to 5 minutes, offering calm centering at the start or close of the day.

#### 2.1.1 Morning Dew Collection (The Dawn Ritual)
- **Time Window**: 05:00 to 09:00 local time (matching `todHours` and `realClockTod()`).
- **Mechanic**: At dawn, the central pond (`terrain.ts:177`) gathers a shimmering layer of mist and floating dewdrops. When the player walks to the pond edge (within 3.5m of `(0, -5.5)`), an interactive prompt appears: `[E · Harvest Morning Dew]`.
- **Sensory Feedback**: A soft crystalline chime plays via `GardenAmbientLayer`, floating cyan water sparkles drift into the HUD, and the player is awarded **+3 Dew Currency**.
- **Currency Decoupling & Rare Streak Shields**:
  - **Dew Currency (`dewCurrency` / `dew`)**: Common spendable currency earned daily (+3 at pond dawn harvest, +2 on quick-water) used for aesthetic seed unlocks, custom clay pots, spatial wind chimes, and particle colors.
  - **Dewdrops of Grace (`streakShields`)**: Rare, sacred protective talismans protecting against missed days, hard-capped at `maxStreakShields: 3`. Earned automatically upon reaching a 7-day perfect stewardship streak, or via the Pond Altar Transmutation (once per 7 calendar days, players may offer 30 Dew Currency to forge 1 Dewdrop of Grace if `streakShields < 3`).
- **Mindful Benefit**: Encourages a quiet morning moment of introspection before daily routines begin.

#### 2.1.2 3D Walkthrough Inspection
- **Mechanic**: The player takes a stroll through the five emotional-tone beds (Happy, Peaceful, Reflective, Nostalgic, Bittersweet).
- **Spatial Feedback**: Plants visually communicate their moisture needs. Plants with low moisture exhibit a soft, pulsing droplet icon hovering 0.4m above their foliage, while healthy plants gently sway in the breeze.
- **Minimap Integration**: The 116×116 minimap (`OpenWorldMinimap.tsx`) renders subtle pulsing cyan halos around plants that require watering.

#### 2.1.3 Direct In-World Quick-Water (`[Q]`)
- **Key Action**: Walking within 2.65m of a plant and pressing `KeyQ` (or tapping the water drop button on mobile HUD).
- **No Modal Interrupt**: Player remains in first-person mode with uninterrupted camera control.
- **Immediate Outcome & Tending State Logic**:
  - **Dormant Awakening ($M = 0\%$)**: Water restores moisture immediately to **$80.0\%$** (`thriving`). Stems spring upright, petals burst open in celebratory blooming, mist dissipates, and golden sparkle motes float outward.
  - **Active Micro-Tending ($0\% < M < 75\%$)**: Adds $+25\%$ moisture, clamped to $\min(100.0, M + 25.0)$.
  - **Biological Satiation Gate ($M \ge 75\%$)**: Soil is rich and damp; prompt informs *"Soil is rich and moist"*, disabling quick-water to prevent over-saturation.
  - Grants +5 Plant Vitality, +2 Dew Currency, and advances the user's garden-wide daily tending streak.
  - Spawns a 36-particle water droplet arc curving from camera to soil with soil darkening shader.

#### 2.1.4 Daily Reflection Prompts & Micro-Journaling
- The garden shed (`terrain.ts:455`) displays a small illuminated chalkboard near its doorway with a daily contemplative inquiry (e.g., *"What brought you unexpected warmth yesterday?"* or *"Whose laughter do you miss today?"*).
- Planting a new memory or attaching a reflection to an existing memory rewards +1 Dew, +1 Sunlight, and advances plant growth.

---

### 2.2 The Weekly Loop (Growth Rhythms & Reflection Cycles)
Designed for deeper weekly engagement, typically lasting 10 to 20 minutes on weekends or quiet evenings.

#### 2.2.1 Botanical Growth Milestones & Stage Evolution
- Over 4 to 7 days of consistent micro-tending, plants accumulate sufficient vitality and visit thresholds to trigger a **Stage Evolution** (e.g. `Sprout` -> `Seedling` -> `Young` -> `Bud` -> `Bloom`).
- When a plant is ready to evolve, its next watering triggers an elongated growth animation in `plant-mesh.ts`:
  - Camera subtly pulls back 0.5m.
  - Procedural stem lengthens, new leaves unfold via sine-eased scaling, and petals burst open with a shower of golden pollen particles.
  - An evolution fanfare chime plays in spatial audio.

#### 2.2.2 Deep Memory Review Cycles (`[E · Remember]`)
- Weekly re-immersion into cherished moments. Opening `<MemoryCard>` allows:
  - Listening to archived voice notes (`AudioRecording`).
  - Viewing high-resolution photos in full-screen lightbox.
  - Writing deeper chronological reflections (`Memory.reflections`).
  - Reviewing AI-synthesized memory connections and emotional trajectories.

#### 2.2.3 Weekend Twilight / Golden Blooming Peaks
- Every Saturday and Sunday evening during twilight (18:00–21:00), the garden experiences **The Golden Bloom**:
  - Directional sunlight shifts to rich amber (`#ffb05c`), hemisphere ambient light takes on indigo undertones, and all blooming plants gain an extra 50% emissive luminescence.
  - Plants watered during Golden Bloom receive a 1.5x vitality multiplier and drop double pollen currency.

#### 2.2.4 Buddy Tending & Reciprocal Garden Visits
- Weekly prompt highlights a friend's garden or a shared collaborative plot:
  - *"Yuki's garden has two memories resting in gentle dormancy. Take an evening walk over to offer water."*
  - Visiting a friend's 3D garden and tending their memories maintains the weekly **Garden Bond** and earns rare Pollen.

---

### 2.3 The Long-Term Loop (Seasons, Genetics & Community Legacy)
Designed to provide rich rewards over months and years, making the garden a lifelong emotional heirloom.

#### 2.3.1 Seasonal Solstice & Equinox Transformations
The 3D environment dynamically adapts to real-world astronomical seasons:

| Season | Calendar Window | Visual Transformation in 3D Walkthrough | Atmospheric FX | Botanical Bonus |
| :--- | :--- | :--- | :--- | :--- |
| **Spring Equinox** | Mar 20 – Jun 20 | Lush emerald grass (`#3a5a2a`), blooming cherry blossom pergolas, vibrant wildflowers. | Drifting pink petals blowing across paths at 0.8 m/s. | Plants evolve stages 25% faster; double Sprout germination. |
| **Summer Solstice** | Jun 21 – Sep 21 | Warm golden sunlight, deep green canopy trees, blooming lotus pads covering pond. | 140 instanced glowing fireflies at dusk (`engine.ts:387`); golden afternoon haze. | **Summer Solstice Humidity**: Base evaporation slows by 20% ($W_{\text{summer}} = 0.80$, hydration lasts 25% longer); Golden Haze events provide +50% growth XP acceleration. |
| **Autumn Equinox** | Sep 22 – Dec 20 | Amber, ochre, and crimson foliage; fallen leaf blankets on stone paths; pumpkin lanterns at shed. | Crisp misty fog (`palette.fog = 12m to 60m`); drifting leaf particles. | Reflection rewards doubled; Starlight currency drops at dusk. |
| **Winter Solstice** | Dec 21 – Mar 19 | Quiet frost dusting on pergolas and fence rails; crystallized ice on pond edges; candle boats. | Soft, slow drifting snow flurries; cold indigo twilight sky. | Dormancy is visually protected under shimmering frost blanket. |

#### 2.3.2 Eternal Memories (Radiant Immortal Flora)
- **Qualification**: When a memory plant achieves:
  1. Age > 30 days since initial planting (`daysSincePlanted > 30`).
  2. Cumulative Vitality > 90 (`vitality >= 90`).
  3. Total reflections >= 5 or total visits >= 15.
- **The Ascended 3D State**:
  - The plant ascends into an **Eternal Memory**.
  - Its geometry in `plant-mesh.ts` receives an ethereal permanent golden ground aura (`geo.ring`), subtle crystalline starlight motes, and immunity to moisture decay.
  - Eternal plants never droop or enter dormancy, standing as permanent monuments to profound milestones in the user's life.

#### 2.3.3 Rare Procedural Genetics, Adornments & Cross-Pollination
- **Cross-Pollination**: Taking pollen from a mature Happy-toned Sunflower and brushing it against a Bittersweet-toned Rose produces a unique **Hybrid Seedling**.
- **Procedural Trait Mutations**:
  - Dual-tone gradient petals (e.g. violet fading into liquid gold).
  - Bioluminescent stems that illuminate the ground around the plant at night.
  - Rare ornamental adornments: hovering spirit butterflies, starlight rings, or floating glass terrarium domes.

#### 2.3.4 Community Grove Milestones ("The Grove Project")
- In shared collaborative gardens, members contribute to community-wide watering totals.
- Collective milestones unlock structural additions to the shared 3D world:
  - *Tier 1 (50 Community Tends)*: Unlocks Stone Lantern Pathway with gentle illumination.
  - *Tier 2 (150 Community Tends)*: Unlocks Center Starlight Fountain with animated water jets.
  - *Tier 3 (300 Community Tends)*: An Ancient Grandfather Sakura Tree sprouts at the garden edge, shedding blossoms across the world.
  - *Tier 4 (500 Community Tends)*: Unlocks Aurora Borealis celestial sky dome at night.

---

### 2.4 Direct Integration with Memory Creation & Reflection Lifecycles
The 3D walkthrough is not an isolated minigame; it is the physical representation of the user's emotional journal.

```
       [ Plant Memory ] ──► Spawns 3D Seed Mound in Tone Bed
              │
              ▼
       [ Morning Dew / Quick-Water ] ──► Sprout emerges with glistening dewdrop
              │
              ▼
       [ Revisit / Photo Viewing ] ──► Seedling grows leafy stem; turgor increases
              │
              ▼
       [ Deep Reflection / Voice Note ] ──► Bud forms; petals swell with color
              │
              ▼
       [ Social Tend / Friend Gift ] ──► Full Bloom; fragrance particles; aura ring
              │
              ▼
       [ Sustained Stewardship ] ──► Ascends to Eternal Radiant Botanical Flora
```

---

## 3. R2. Plant Tending and Memory Growth Mechanics

### 3.1 Exact Hydration Rules, Depletion Curves & Variety Multipliers

#### 3.1.1 The Moisture Depletion Formula
Plant moisture $M(t)$ is modeled as a continuous decay function parameterized by elapsed time, botanical species drought profile, and environmental coefficients, bounded strictly within $[0.0, 100.0]$:

$$M(t) = \min\left(100.0, \max\left(0.0, M_{\text{initial}} - \max(0.0, \Delta t) \times R_{\text{variety}} \times \bar{W}_{\text{env}}\right)\right)$$

Where:
- $M(t) \in [0.0, 100.0]$: Moisture percentage.
- $\Delta t = \min\left(720.0, \max\left(0.0, \frac{t_{\text{now}} - t_{\text{lastWatered}}}{3600}\right)\right)$: Elapsed time in hours, clamped against negative clock jumps and capped at 30 days (720h).
- $R_{\text{variety}}$: Base species depletion rate in $\% / \text{hour}$.
- $\bar{W}_{\text{env}}$: Effective environmental modifier coefficient ($0.20 \le \bar{W}_{\text{env}} \le 1.50$).

```typescript
export function computeCurrentMoisture(
  initialMoisture: number = 100.0,
  lastWateredAt: string | number,
  varietyRate: number,
  environmentalMultiplier: number = 1.0,
  nowMs: number = Date.now()
): number {
  const lastWateredMs = typeof lastWateredAt === 'string' ? new Date(lastWateredAt).getTime() : lastWateredAt;
  const elapsedHours = Math.max(0, (nowMs - lastWateredMs) / (1000 * 60 * 60));
  const safeElapsedHours = Math.min(720.0, elapsedHours); // 30-day cap against clock drift
  const decay = safeElapsedHours * varietyRate * environmentalMultiplier;
  const moisture = initialMoisture - decay;
  return Math.min(100.0, Math.max(0.0, Number(moisture.toFixed(2))));
}
```

#### 3.1.2 Botanical Species Depletion Profiles
Different botanical varieties have specialized physiological drought tolerances:

| Plant Variety | Base Depletion Rate ($R_{\text{variety}}$) | Hours from 100% to Thirsty (30%) | Hours from 100% to Dormant (0%) | Botanical Characteristics |
| :--- | :--- | :--- | :--- | :--- |
| **`succulent`** | `0.65% / hour` | 107.7 hours (~4.5 days) | 153.8 hours (~6.4 days) | Fleshy water-storing leaves, high drought resistance. |
| **`lotus`** | `0.90% / hour` | 77.8 hours (~3.2 days) | 111.1 hours (~4.6 days) | Aquatic root system in pond, steady moisture retention. |
| **`tree`** | `1.10% / hour` | 63.6 hours (~2.6 days) | 90.9 hours (~3.8 days) | Deep root system, resilient against short drought periods. |
| **`bush`** | `1.30% / hour` | 53.8 hours (~2.2 days) | 76.9 hours (~3.2 days) | Dense foliage, medium moisture consumption. |
| **`fern`** | `1.50% / hour` | 46.7 hours (~1.9 days) | 66.7 hours (~2.8 days) | Shade-loving fronds, requires regular humidity. |
| **`vine`** | `1.60% / hour` | 43.8 hours (~1.8 days) | 62.5 hours (~2.6 days) | Climbing tendrils, rapid vascular transport. |
| **`mushroom`** | `1.75% / hour` | 40.0 hours (~1.7 days) | 57.1 hours (~2.4 days) | Fungal hyphae, sensitive to dry soil. |
| **`flower` / `rose` / `wildflower`** | `2.00% / hour` | 35.0 hours (~1.5 days) | 50.0 hours (~2.1 days) | Delicate blooms, express visible thirst within 36 hours. |

#### 3.1.3 Environmental Weather Modifiers & Seasonal Integration
Moisture decay responds to both active in-session weather and offline seasonal baseline integration:
1. **Real-Time Active Sessions**: Dynamic weather events in `terrain.ts` modulate real-time depletion on tick:
   - **Rain / Overcast Shower**: $W = 0.20$ (Depletion slows by 80%; natural rainfall hydrates plants).
   - **Morning Mist / Dawn Dew**: $W = 0.60$ (Gentle humidity protects moisture).
   - **Clear Sky / Balanced Breeze**: $W = 1.00$ (Standard baseline depletion).
   - **Golden Haze / Warm Afternoon**: $W = 1.00$ (Decay neutral, growth multiplier $1.5\times$ acceleration).
2. **Offline Long-Term Absence**: When simulating elapsed time $\Delta t$ between user sessions, moisture integrates over the astronomical seasonal baseline:
   $$\bar{W}_{\text{env}} = W_{\text{season}} \times W_{\text{diurnal}}$$
   - $W_{\text{season}}$: Spring ($0.95$), Summer ($0.80$, fulfilling Summer Solstice extended hydration), Autumn ($1.00$), Winter ($1.10$).
   - $W_{\text{diurnal}} = 0.90$ (accounts for slowed overnight transpiration).

#### 3.1.4 Closed Contiguous Hydration Health Thresholds
The mapping from moisture $M(t)$ to discrete `PlantHealthStatus` forms a complete, closed partition of $[0.0, 100.0]$ with zero unhandled gaps:
1. **`thriving` ($75.0\% \le M \le 100.0\%$)**: Plant exhibits maximum botanical turgor, upright stems, radiant petals, moist dark loam soil, breathing emissive luminescence, and floating dew motes.
2. **`healthy` ($30.0\% \le M < 75.0\%$)**: Normal nourished botanical state. Stable growth, natural sway, rich brown soil.
3. **`thirsty` ($10.0\% \le M < 30.0\%$)**: Early thirst. Leaves droop 15°, soil lightens to dusty earth, pulsing cyan droplet cue hovering overhead.
4. **`wilting` ($0.0\% < M < 10.0\%$)**: Severe dehydration. Stems bow up to 35°, colors desaturate by 30%, pale cracked soil mound.
5. **`dormant` ($M \le 0.0\%$)**: Restful wintering. Plant curls into protective posture under a quiet mist veil. Completely safe; watering immediately triggers celebratory revival into thriving bloom.

```typescript
export function computeWiltingFactor(moistureLevel: number): number {
  if (moistureLevel >= 30.0) return 0.0;
  if (moistureLevel <= 0.0) return 1.0;
  // Linear ramp from 0.0 at 30% moisture to 1.0 at 0% moisture
  return Number(((30.0 - moistureLevel) / 30.0).toFixed(3));
}
```

#### 3.1.5 Satiation Cooldown & Micro-Tending Reconciliation
- **Biological Satiation Gate ($M \ge 75.0\%$)**: A plant with $M \ge 75.0\%$ is fully satiated. Soil is rich and damp; prompt shows: *"Soil is rich and moist"*. Quick-water is disabled to protect against over-saturation.
- **Micro-Tending Window ($0.0\% < M < 75.0\%$)**: The moment moisture drops below $75.0\%$ (whether after 12.5h for flowers or 38h for succulents), **Micro-Tending (`[Q]`) unlocks immediately**, regardless of elapsed clock hours.
- **Full Watering & Reflection Cooldown**: The 18-hour cooldown applies solely to **Full Reflection Watering (`[E]`)** and its associated major growth XP / streak awards, preventing reflection reward spamming while keeping in-world 3D physical micro-tending responsive to natural biological need.
- **Dormant Awakening Ritual**: When watering a plant in `dormant` state ($M = 0\%$):
  - **Quick-Water in 3D (`[Q]`)**: Immediately sets moisture to **$80.0\%$** (`thriving`). Stems spring upright, mist dissipates, golden sparkles burst outward, and the plant instantly enters the celebratory thriving bloom.
  - **Full Reflection Watering (`[E]`)**: Sets moisture to **$100.0\%$** (`thriving`).
- **Active Plant Micro-Tending Rule ($0\% < M < 75\%$)**: Adds $+25.0\%$ moisture, clamped to $\min(100.0, M + 25.0)$.

```
┌────────────────────────┬───────────────────────────────────────────┬──────────────────────────────────────────┐
│ Moisture Range         │ In-World Quick-Water [Q]                  │ Memory Modal Deep Water [E]              │
├────────────────────────┼───────────────────────────────────────────┼──────────────────────────────────────────┤
│ **75% ≤ M ≤ 100%**     │ Satiated: Disabled ("Soil is moist")      │ Satiated: Opens card; water button disabled│
│ **0% < M < 75%**       │ Unlocked: Adds +25% (up to 100%)          │ Unlocked: Restores to 100% (+12 XP)      │
│ **M = 0% (Dormant)**   │ Unlocked: Awakening Revival (Sets to 80%) │ Unlocked: Full Awakening (Sets to 100%)  │
└────────────────────────┴───────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

### 3.2 Botanical Growth Stages & Transition Rules

Plant development progresses through 8 discrete biological phases:

```
Seed ──► Sprout ──► Seedling ──► Young ──► Bud ──► Bloom ──► Mature ──► Elder
(0)       (1)         (2)        (3)     (4)      (5)       (6)       (7)
```

#### 3.2.1 Exploit-Resistant Stage Progression Calculation Matrix
Stage progression is evaluated via a composite **Nurture Score ($S_N$)** debounced against proximity-spamming exploits:

$$S_N = (V_{\text{days}} \times 1.5) + (R \times 10.0) + (W \times 4.0) + (D \times 1.0) + (G \times 5.0)$$

Where:
- $V_{\text{days}} = \min(D, V_{\text{unique\_calendar\_days}})$: Visits count at most **once per unique calendar day**, completely eliminating proximity-spamming exploits.
- $R$: Approved reflections logged (`reflections.length`). Heavy weighting (10.0) rewards genuine mindful journaling.
- $W$: Distinct successful watering sessions (`wateringHistory.totalCount`).
- $D$: Days since planted (`daysSincePlanted`).
- $G$: Visitor gifts / external friend tends received (`gifts.length`).

#### 3.2.2 Stage Threshold Table

| Stage | Required $S_N$ | Min Days ($D$) | Min Reflections ($R$) | Min Waterings ($W$) | Evolution Gate Moisture | Visual Representation in `plant-mesh.ts` |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`seed`** | $0$ | $0$ | $0$ | $0$ | Any | Dark loam mound, seed coat shell (`#3c271e`), germinating green cone tip. |
| **`sprout`** | $10$ | $1$ | $0$ | $1$ | $\ge 20\%$ | Curving tender green stem (height 0.22m), 2 tiny cotyledon leaves, shining water drop. |
| **`seedling`** | $25$ | $2$ | $0$ | $2$ | $\ge 25\%$ | Stem height 0.45m, 4 true leaves, lateral leaf tilt, emerging taproot buttress. |
| **`young`** | $50$ | $4$ | $1$ | $4$ | $\ge 30\%$ | Stem height 0.85m, differentiated species morphology (e.g. tree boughs, succulent rosette). |
| **`bud`** | $90$ | $7$ | $2$ | $7$ | $\ge 30\%$ | Swollen central floral bud or canopy clusters; tone-tinted petal tips peeking through calyx. |
| **`bloom`** | $140$ | $10$ | $3$ | $10$ | $\ge 35\%$ | Unfurled petals, radiating floral coronas, visible stamens, emotional-tone emissive glow. |
| **`mature`** | $220$ | $18$ | $5$ | $15$ | $\ge 40\%$ | Maximum botanical height and foliage density; secondary flower nod; 7 fallen petals on soil. |
| **`elder`** | $350$ | $30$ | $7$ | $20$ | $\ge 50\%$ | Massive majestic form; subtle celestial ground ring; permanent hovering spirit particles. |

#### 3.2.3 Strict Stage Monotonicity Specification
1. **Strict Monotonic Progression ($\Delta \text{Stage} \ge 0$)**:
   Biological stages (`PlantStage`) represent permanent botanical maturity. Once a plant achieves a stage (e.g. `mature` or `elder`), it is permanently recorded in `Memory.plantStage`.
   **A plant NEVER de-evolves or demotes to an earlier stage under any circumstances.**
2. **Orthogonal Health Status**:
   Moisture depletion modulates only `PlantHealthStatus` (`thriving` $\leftrightarrow$ `healthy` $\leftrightarrow$ `thirsty` $\leftrightarrow$ `wilting` $\leftrightarrow$ `dormant`). An unwatered elder plant becomes a **dormant elder** (majestic ancient trunk resting in quiet mist), never a seedling or sprout.
3. **Evolution Gate Moisture Clarification**:
   The "Evolution Gate Moisture" in Table 3.2.2 is an **evolution trigger requirement**, evaluated only at the moment of stage advancement. Once evolved, falling below that threshold does not revert the stage.

```typescript
const STAGE_ORDER: PlantStage[] = ['seed', 'sprout', 'seedling', 'young', 'bud', 'bloom', 'mature', 'elder'];

export function checkStageProgression(
  currentStage: PlantStage,
  metrics: {
    nurtureScore: number;
    daysSincePlanted: number;
    reflectionsCount: number;
    wateringsCount: number;
    currentMoisture: number;
  }
): PlantStage {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  let highestEligibleIndex = currentIndex;

  for (let i = currentIndex + 1; i < STAGE_ORDER.length; i++) {
    const candidate = STAGE_THRESHOLDS[STAGE_ORDER[i]];
    if (
      metrics.nurtureScore >= candidate.minScore &&
      metrics.daysSincePlanted >= candidate.minDays &&
      metrics.reflectionsCount >= candidate.minReflections &&
      metrics.wateringsCount >= candidate.minWaterings &&
      metrics.currentMoisture >= candidate.gateMoisture
    ) {
      highestEligibleIndex = i;
    } else {
      break; // Stages must be achieved sequentially
    }
  }

  return STAGE_ORDER[highestEligibleIndex]; // Monotonic: never returns < currentIndex
}
```

---

### 3.3 Three-Tier 3D Visual Vitality States in `plant-mesh.ts`

The procedural mesh generator `createPlantGroup` (`src/components/open-world/plant-mesh.ts:41-576`) is extended to dynamically reflect health and moisture without performance penalty.

```
       ┌────────────────────────────────────────────────────────┐
       │              3D BOTANICAL VISUAL STATES                │
       ├─────────────────┬──────────────────┬───────────────────┤
       │ 1. Thirsty /    │ 2. Nourished /   │ 3. Thriving /     │
       │    Wilting      │    Healthy       │    Sparkling      │
       │                 │                  │                   │
       │ • Stem droop    │ • Erect posture  │ • Emissive pulse  │
       │   (20°-35°)     │ • Tone-saturated │ • Moist dark soil │
       │ • Pale colors   │ • Standard soil  │ • Dewdrop motes   │
       │ • Dry ochre bed │ • Balanced sway  │ • Radiant aura    │
       └─────────────────┴──────────────────┴───────────────────┘
```

#### 3.3.1 Tier 1: Thirsty / Wilting State (`healthStatus: 'thirsty' | 'wilting'`)
- **Mesh Deformation**:
  - The main stem (`stemMesh`) rotation pivots on Z and X axes proportionally to `wiltingFactor`:
    ```typescript
    stemMesh.rotation.z = Math.sin(seed + 1.2) * (0.15 + plant.wiltingFactor * 0.35);
    stemMesh.rotation.x = 0.12 + plant.wiltingFactor * 0.26;
    ```
  - Flower heads, rosette buds, or canopy foliage clusters tilt downward by up to $35^\circ$ toward the soil mound.
  - Leaves droop slightly via Y-axis downward scaling (`leaf.scale.y = 1.0 - plant.wiltingFactor * 0.25`).
- **Material & Color Tuning**:
  - Bloom and leaf materials increase `roughness` from $0.45 \to 0.92$, eliminating glossy sheen.
  - Foliage color is blended toward dusty ochre: `color.lerp(new THREE.Color('#7a6e58'), plant.wiltingFactor * 0.4)`.
  - Emissive glow is completely extinguished (`emissiveIntensity = 0.0`).
- **Soil Mound State**:
  - Soil mesh (`soilMat`) color switches from rich loam (`#231812`) to cracked, dry pale clay (`#4e4136`), with roughness increased to 0.98.
- **Dormancy Specialty (`healthStatus: 'dormant'`)**:
  - When moisture reaches 0, the plant gently folds inward (`scale.set(0.85, 0.75, 0.85)`).
  - A local translucent mist ring (`geo.ring` with opacity 0.35 and gentle vertical float) wraps around the plant base.

#### 3.3.2 Tier 2: Nourished / Steady State (`healthStatus: 'healthy'`)
- **Mesh Anatomy**:
  - Upright biological turgor (`rotation.z` and `rotation.x` remain within gentle $2^\circ$ natural resting angles).
  - Foliage and petals fully expanded to standard design specifications.
- **Material Saturation**:
  - Standard tone-matched palette colors with natural diffuse scattering (`roughness: 0.55`, `metalness: 0.08`).
  - Standard soil mound in rich dark brown loam (`#231812`).
- **Wind Dynamics**:
  - Participates normally in the global wind sway formula (`swayPlants` in `engine.ts:346-356`):
    ```typescript
    const sway = Math.sin(t * 1.8 + plant.x * 0.4 + plant.z * 0.3) * 0.045;
    group.rotation.z = sway;
    ```

#### 3.3.3 Tier 3: Thriving / Sparkling State (`healthStatus: 'thriving'`)
- **Emissive Breathing / Pulsation**:
  - The central bloom, flower petals, or mushroom gills exhibit a breathing emissive luminescence driven by animation time $t$:
    ```typescript
    bloomMaterial.emissiveIntensity = 0.35 + Math.sin(t * 2.2 + plant.x) * 0.15;
    ```
- **Soil Hydration**:
  - Soil mound renders rich, deeply saturated moist earth (`#120b07`) with reduced roughness (`0.30`), giving the appearance of damp, nutrient-rich soil.
- **Floating Dewdrop & Sparkle Motes**:
  - An instanced group of 8 to 12 tiny hovering sparkle particles (`THREE.Points`) floats gently in a 0.6m radius around the blossom head, drifting upward at 0.08 m/s before cycling back to the stem.
- **Harmonic Aura Ring**:
  - Plants that are mature or thriving display an illuminated ground ring (`geo.ring`) projecting the emotional tone's primary hue onto the grass bed.

#### 3.3.4 Procedural Anatomy Adaptation Across Botanical Kinds
- **`succulent`**: Under wilting, outer tier leaves flatten against the soil while inner leaves tighten into a clenched sphere. Under thriving, leaves plump outward with crystalline translucent green edges.
- **`lotus`**: Wilting curls pad edges upward; petals close. Thriving opens all 3 concentric tiers flat over water ripples with golden stamen glowing.
- **`tree`**: Wilting sheds 4 extra fallen leaf disks to the ground; canopy clusters contract slightly. Thriving spawns fruit/blossom speckles with golden highlights.
- **`mushroom`**: Wilting caps bow sideways with wrinkled stalk base. Thriving gill disks cast subtle ambient uplighting upon the baby companion shroom.
- **`fern`**: Fronds arch gracefully downward toward earth when thirsty; uncoil into tall, vibrant emerald plumes with glowing fiddleheads when thriving.

---

### 3.4 Mechanics Linking Memory Interactions to Plant Vitality

Retention is rooted in genuine reflection. Interactions with the memory's content directly infuse the plant with life:

```
┌──────────────────────────────────────┬───────────────────────────────────────────┬──────────────┬────────────────┐
│ Memory Interaction Action            │ Moisture Replenished                      │ Vitality     │ Currency       │
│                                      │                                           │ Added        │ Awarded        │
├──────────────────────────────────────┼───────────────────────────────────────────┼──────────────┼────────────────┤
│ **Quick-Water in 3D [Q]**            │ If dormant: Sets to 80% (thriving bloom); │ +5 Vitality  │ +2 Dew         │
│                                      │ If active: +25% moisture (cap 100%)       │              │                │
│ **Full Watering with Reflection [E]**│ +100% (Full Awakening & Satiation)        │ +12 Vitality │ +3 Dew         │
│ **Audio Recording Re-listen**        │ +15%                                      │ +6 Vitality  │ +1 Sunlight    │
│ **Photo Lightbox Review (>10 sec)**  │ +10%                                      │ +4 Vitality  │ +1 Sunlight    │
│ **AI Synthesis / Insight Prompt**    │ +35%                                      │ +15 Vitality │ +2 Starlight   │
│ **Cross-Pollination Weave**          │ +50%                                      │ +20 Vitality │ +3 Pollen      │
│ **Visitor Tend / Friend Water**      │ +40% (or awakens dormant to 80%)          │ +8 Vitality  │ +2 Dew (to v.) │
└──────────────────────────────────────┴───────────────────────────────────────────┴──────────────┴────────────────┘
```
*Note*: Spendable Dew Currency is earned on tending actions. Rare Dewdrops of Grace (`streakShields`, max 3) are awarded via 7-day perfect stewardship streaks or pond altar transmutation.

---

### 3.5 Re-Engagement Triggers & Gentle Notification System

MemoryGarden rejects high-frequency spam and anxiety-inducing notifications. All re-engagement triggers follow the **Rule of Three**: Maximum of 3 notifications per week, strictly contextual, deeply personal, and opt-in.

```
       ┌────────────────────────────────────────────────────────┐
       │             COMPASSIONATE NOTIFICATION TYPES           │
       ├────────────────────────────────────────────────────────┤
       │ 1. "On This Day" Whispers (Annual / Season Memories)   │
       │    "One year ago, you planted 'First Autumn Walk'.     │
       │     The leaves are turning golden in your garden..."   │
       │                                                        │
       │ 2. Social Care Whispers (Reciprocal Friend Tending)    │
       │    "Yuki walked through your grove and tended your     │
       │     Sakura tree. A new blossom has unfurled."          │
       │                                                        │
       │ 3. Gentle Thirst Whispers (Non-Shaming Renewal)        │
       │    "Your memory of 'Summer Ocean Sunrise' is resting   │
       │     in gentle dormancy. A cup of water awaits."        │
       │                                                        │
       │ 4. Seasonal Solstice Shifts (World Transformation)     │
       │    "The Spring Equinox has arrived in MemoryGarden.    │
       │     Cherry blossoms are drifting across the paths."    │
       └────────────────────────────────────────────────────────┘
```

#### Multi-Tier Progressive Delivery Channels:
1. **Level 1: In-App HUD Badge & Notification Bell (100% Universal)**: Unread actions accumulate silently in the top HUD. Zero OS-level intrusion.
2. **Level 2: Web Push API (PWA on Android / Desktop / iOS 16.4+)**: Delivered at user's preferred contemplation time (e.g. 08:00 morning or 20:00 evening).
3. **Level 3: Protocol URI Handler (`web+viewmemory://?id=xyz`)**: Deep links straight into 3D walkthrough, positioning the camera directly before the tended plant.

---

## 4. R3. Collaborative and Social Teamwork Mechanics

MemoryGarden's social design balances emotional intimacy with rock-solid boundary protection. Social mechanics must elevate empathy without exposing raw vulnerability.

### 4.1 Reciprocal 3D Watering System

#### 4.1.1 Spatial Walk-Up & Dual Interaction HUD
When visiting a shared or friend's garden in 3D walkthrough mode:
1. Visitor navigates to any planted memory within `INTERACT_RADIUS = 2.65m`.
2. The `OpenWorldHud` reveals visitor-specific contextual prompts:
   - `[E · Read Public Memory]`: Opens the public card (photo, title, date; private journal reflections remain hidden).
   - `[Q · Water with Loving Care]`: Instantly waters the host's plant in 3D.

#### 4.1.2 3D Water Particle Arc & Procedural Splash FX
- Pressing `KeyQ` triggers a procedural `WateringParticleSystem` in `OpenWorldEngine`:
  - 36 instanced droplet motes (`THREE.Points`) spawn from the player camera coordinates.
  - Droplets travel along a downward parabolic trajectory terminating at the plant's soil mound `(plant.x, 0.1, plant.z)`.
  - Upon impact, a momentary expanding cyan water ripple ring (`geo.ring` with opacity fade $1.0 \to 0.0$) expands across the soil, and the soil darkens to moist earth.
  - The plant executes a gentle turgor bounce (`scale.y` expands from $1.0 \to 1.08 \to 1.0$ over 450ms).

#### 4.1.3 Spatial Audio Ripple
- Integrated via `GardenAmbientLayer` and Web Audio API:
  - Triggers a soft crystalline water pour frequency sweep ($620\text{ Hz} \to 880\text{ Hz}$) mixed with a low-pass pink noise trickle, spatialized based on the plant's relative azimuth to the camera.

#### 4.1.4 Reciprocal Notification Dispatch
- The garden owner receives an immediate social toast:
  > *"🌱 GentleDreamer walked through your garden and watered 'Kyoto Summer Rain'. Their care nourished a fresh bloom."*
  - Includes a direct action button: `[Visit GentleDreamer's Garden]`.

#### 4.1.5 "Garden Bonds" (Twin Fireflies of Friendship)
- When two gardeners reciprocally water each other's memories within a rolling 48-hour window, their gardens establish a **Garden Bond**.
- **Visual Representation in 3D Walkthrough**:
  - A pair of twin golden fireflies (`THREE.Points` with orbiting sine offsets) permanently hovers near the entrance pergola arch (`terrain.ts:308`).
  - Walking beneath the arch gently triggers a harmonic chime, and each reciprocal tend grants $+1$ rare Pollen currency.

---

### 4.2 Collaborative Memory Plots: "The Sanctuary Circle"

#### 4.2.1 Deterministic Spatial Placement & Layout Generation
In `src/lib/open-world/layout.ts`, collaborative plots are dynamically allocated without colliding with personal emotional beds:
- Located at coordinates `(x: 0, z: -25)`, directly north of the central pond, or in dedicated shared world instances.
- Demarcated by a 14-meter diameter circular mossy stone border embedded into the terrain.

```
                         [ GATE ENTRANCE (0, 38) ]
                                    │
                                    ▼
       ┌─────────────────┐                     ┌──────────────────┐
       │   HAPPY BED     │                     │   PEACEFUL BED   │
       │   (-16, -15)    │                     │    (16, -15)     │
       └────────┬────────┘                     └────────┬─────────┘
                │                                       │
                │        [ THE SANCTUARY CIRCLE ]       │
                │              (0, -25)                 │
                │      Shared Collaborative Meadow      │
                │                                       │
                ▼                                       ▼
       ┌─────────────────┐   [ CENTRAL POND ]  ┌──────────────────┐
       │ REFLECTIVE BED  │       (0, -5.5)     │  NOSTALGIC BED   │
       │    (-17, 3)     │                     │     (17, 3)      │
       └─────────────────┘                     └──────────────────┘
```

#### 4.2.2 Architectural Scenery for Collaborative Plots
- **Rustic Wooden Gateway**: Hand-carved timber archway bearing the shared garden title (e.g., *"Family Milestones & Journeys"*).
- **Contributor Stones**: Stepping stones along the plot perimeter engraved with contributor initials.
- **The Central Basin**: A shared birdbath or starlight pool where community dew accumulates.

#### 4.2.3 Multi-Planter Visual Attribution in 3D
- Each plant in a collaborative plot preserves its creator's identity:
  - A small, translucent contributor halo (colored according to the contributor's avatar palette) floats 0.25m above the plant canopy.
  - When the player enters proximity ($<2.65\text{m}$), the proximity HUD displays:
    `"Planted with love by Yuki • 3 days ago"`.

#### 4.2.4 "The Grove Project": Shared Goals & Environmental Rewards
Collaborative gardens feature community milestone bars tracked via Neon PostgreSQL:

| Milestone Tier | Collective Waterings | 3D Environmental Reward Unlocked in Shared Plot |
| :--- | :--- | :--- |
| **Tier 1: Whispering Grove** | 25 Tends | Stone Birdbath appears in circle center; birds visit at sunrise. |
| **Tier 2: Firefly Meadow** | 75 Tends | 40 permanent emerald fireflies hover over the collaborative bed. |
| **Tier 3: The Ancient Sakura** | 150 Tends | A towering, majestic Cherry Blossom Tree grows at the plot edge, showering pink petals across the path. |
| **Tier 4: Starlight Fountain** | 300 Tends | Central basin transforms into an illuminated Starlight Fountain with ambient water harmonics. |
| **Tier 5: Celestial Aurora** | 500 Tends | The night sky dome displays waving curtains of green and violet Aurora Borealis. |

---

### 4.3 3D Gift & Note Leaving System

Visitors can place meaningful, physical 3D tokens at the foot of any memory plant:

```
┌───────────────────┬──────────────────────────────┬───────────────────────────────┐
│ Gift Type         │ 3D Visual Mesh in Scene      │ Emotional Purpose & Mechanics │
├───────────────────┼──────────────────────────────┼───────────────────────────────┤
│ **Blossom Note**  │ Origami folded blossom       │ Visitor types a 140-character │
│                   │ hovering 0.15m beside stem.  │ message of comfort or love.   │
│                   │ Emits soft tone-matched aura.│ Owner unfolds note in 3D.     │
├───────────────────┼──────────────────────────────┼───────────────────────────────┤
│ **Memory Paper    │ Hexagonal paper lantern with │ Placed in quiet solidarity    │
│  Lantern**        │ warm point light (#ff9933).  │ or remembrance. Burns bright  │
│                   │ Bobs gently in night breeze. │ for 7 days, then transforms   │
│                   │                              │ into a keepsake river stone.  │
├───────────────────┼──────────────────────────────┼───────────────────────────────┤
│ **Dewdrop Vial**  │ Translucent glass vial with  │ Gift of pure vitality. Owner  │
│                   │ shimmering cyan liquid       │ uncorks vial to grant +20     │
│                   │ embedded in soil loam.       │ vitality boost to the plant.  │
├───────────────────┼──────────────────────────────┼───────────────────────────────┤
│ **Wind Chime**    │ Metallic tubes suspended     │ Visitor attaches a 15-second  │
│                   │ from lower plant bough       │ voice blessing. Plays gentle  │
│                   │ (`CylinderGeometry`).        │ chimes when player walks near.│
└───────────────────┴──────────────────────────────┴───────────────────────────────┘
```

#### 4.3.1 Life Cycle of a 3D Gift:
1. **Placement**: Visitor selects gift from the 3D interaction bar and confirms placement.
2. **Notification**: Owner receives a whisper: *"A gentle lantern was lit beside 'Graduation Day'."*
3. **Discovery in 3D**: Owner walks through their garden at dusk, spots the warm amber point light glowing in the distance, walks up to the plant, and presses `[E · Open Gift]`.
4. **Permanent Memorial**: Once opened, gifts transform into permanent subtle garden accents (e.g. an engraved pebble at the plant base or an entry in the memory's reflection archive).

---

### 4.4 Four-Tier Privacy & Permissions Architecture

MemoryGarden is an emotional sanctuary; user trust is sacred. Social features must never compromise privacy or leak unshared thoughts.

```
                          [ USER PRIVACY CHOICE ]
                                     │
      ┌──────────────────────────────┼─────────────────────────────┐
      ▼                              ▼                             ▼
[ TIER 1: PRIVATE ]          [ TIER 2: CIRCLE ]           [ TIER 3: PUBLIC ]
Sanctuary Default            Sanctuary Circle             Living Garden
100% local-first;            Invite token only;           Discoverable;
zero cloud sharing;          Max 10 trusted members;      curated public
walkthrough offline.         mutual tending & notes.      showcase walkthrough.
                                     │
                                     ▼
                    [ TIER 4: PER-MEMORY VISIBILITY ]
                     ├─ Public: Visible to all visitors
                     ├─ Circle: Visible to invited circle
                     └─ Private: Hidden / Protected in 3D
                                     │
                    ┌────────────────┴───────────────┐
                    ▼                                ▼
          [ MODE A: CAMOUFLAGE ]           [ MODE B: SLEEPING SEED ]
          Plant completely omitted         Closed crystal bud in mist;
          from 3D scene; zero              all text/photos redacted;
          gaps or holes in path.           anonymous water allowed.
```

#### 4.4.1 Tier 1: Private Sanctuary (Default Mode)
- 100% of memories, audio recordings, and photos remain on-device in IndexedDB and local storage.
- Walkthrough mode runs entirely offline. Zero network calls or external tracking.

#### 4.4.2 Tier 2: Sanctuary Circle (Invite-Only Companionship)
- Intended for romantic partners, immediate family, or tight-knit circles of friends (maximum 10 participants).
- Access granted exclusively via high-entropy cryptographic invite tokens (`?invite=<id>&token=<secret>`).
- Members can walk through the shared garden, water plants, leave blossom notes, and contribute to shared plots.

#### 4.4.3 Tier 3: Public Living Garden (Curated Discovery)
- Garden owner explicitly toggles `isPublic = true`.
- Garden appears in the community explorer (`api/gardens.ts`).
- Visitors can explore the 3D walkthrough, water plants, and leave lanterns.

#### 4.4.4 Tier 4: Granular Per-Memory Controls & Privacy Rendering Engines
When an external visitor enters a garden containing private memories:

##### Mode A: Fixed-Coordinate Camouflage (Default)
- **Zero-Drift Layout Invariance ($\vec{\Delta} \equiv \vec{0}$)**:
  - The canonical 3D layout coordinates $(x_i, z_i)$ of every plant are computed **once** over the complete memory set (public + circle + private) via `layoutGardenWorld()`.
  - **Re-relaxation is strictly prohibited**: `separatePlants()` is never re-invoked on a subset of memories.
  - The visitor scene is generated as a pure filtered projection: `canonicalWorld.plants.filter((p) => p.visibility === 'public')`. Public plants retain their exact canonical coordinates:
    $$\vec{\Delta}_i = \vec{p}_i^{\text{visitor}} - \vec{p}_i^{\text{owner}} \equiv \vec{0} \quad \forall i \in \text{PublicMemories}$$
  - Displacement is exactly $0.0000\text{ meters}$, completely invalidating differential relaxation triangulation attacks.
- **Negative-Space Masking (Procedural Filler Flora)**:
  - To prevent adversaries from inferring the presence of private memories by observing visual gaps in flower beds, each bed generates a deterministic Poisson-disc undergrowth grid of decorative ground flora (wild clover, mossy stone clusters, woodland grass) seeded by:
    ```typescript
    const fillerSeed = hashString(`${gardenId}:${bed.tone}:filler`);
    ```
  - A filler instance is rendered at grid position $(x_f, z_f)$ if and only if no public plant collider covers that position:
    $$\text{dist}(x_f, z_f, x_p, z_p) \ge r_p + 0.3\text{m} \quad \forall p \in \text{PublicPlants}$$
  - Because `fillerSeed` is decoupled from private memory locations, empty bed clearings are naturally populated with ambient flora, making private plant clearings visually indistinguishable from natural garden spacing.

##### Mode B: The Sleeping Seed & Central Contemplation Ring
- **Spatial Normalization to Central Contemplation Ring (Whispering Shore)**:
  - To eliminate semantic correlation between private memories and emotional tone beds (`happy`, `peaceful`, `reflective`, `nostalgic`, `bittersweet`), Sleeping Seeds are strictly prohibited from spawning inside `BEDS`.
  - Instead, they are normalized to the **Central Contemplation Ring** encircling the central reflecting pond:
    - Pond Center: $(c_x, c_z) = (0, -5.5)$, pond radius $r_{\text{pond}} = 5.4\text{m}$.
    - Contemplation Ring Radius: $R_{\text{ring}} = 7.2\text{m}$.
    - For $N$ private memories, seed $k \in \{0, \dots, N-1\}$ is placed at:
      $$\theta_k = \frac{2\pi \cdot k}{N} + \left(\frac{\text{hashString}(gardenId) \pmod{1000}}{1000} \cdot 2\pi\right)$$
      $$x_k = c_x + R_{\text{ring}} \cos(\theta_k), \quad z_k = c_z + R_{\text{ring}} \sin(\theta_k)$$
  - **Security Invariant**: Coordinates $(x_k, z_k)$ depend solely on the fixed pond geometry, garden ID, and seed index. Correlation with `emotionalTone` or original coordinates is **0.000**.
- **Botanical Uniformity & Redaction Contract**:
  - Clamped to uniform `sprout` bud ($r = 0.22\text{m}$, $h = 0.35\text{m}$) and `'peaceful'` tone, preventing age or revisit depth leakage.
  - Closed opalescent crystalline bud (`#d8c8f0`) wrapped in 6 gentle drifting mist motes (`THREE.Points`).
  - Title, date, photo, and text are 100% redacted (`title: "A quiet memory rests here in gentle contemplation"`, `text: ""`, `photoUrl: ""`, `reflections: []`).
- **Anonymous Visitor Watering**:
  - Visitors can press `[Q]` near a Sleeping Seed. A water splash plays with a 432 Hz healing chime.
  - HUD prompts: *"You offered water to a quiet thought. Warmth ripples outward."*
  - On the backend, moisture is replenished for the owner, while the public activity log records: `"A visitor watered a quiet thought in the garden"`, with `memory_id: NULL`.

#### 4.4.5 Strict Data Boundary Contract & Server-Side SQL Projections
Client-side redaction is insufficient for true privacy. The serverless backend (`api/gardens.ts`) strictly enforces data boundaries over the wire:

##### 1. Database Migration Schema
```sql
-- Migration: Add privacy, 3D world coordinates, and hydration columns
ALTER TABLE garden_memories 
  ADD COLUMN IF NOT EXISTS visibility VARCHAR(16) NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS world_x REAL,
  ADD COLUMN IF NOT EXISTS world_z REAL,
  ADD COLUMN IF NOT EXISTS moisture_level REAL NOT NULL DEFAULT 100.0,
  ADD COLUMN IF NOT EXISTS last_watered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS depletion_rate_per_hour REAL NOT NULL DEFAULT 1.2;

CREATE INDEX IF NOT EXISTS idx_garden_memories_public 
  ON garden_memories (garden_id, visibility) 
  WHERE visibility = 'public';
```

##### 2. Explicit SQL Column Projections in `api/gardens.ts`
Wildcard `SELECT *` is strictly prohibited. The API queries explicit columns and applies server-side reflection stripping:

```typescript
// 1. Explicit Projection Query for Public Memories (Never SELECT *)
const memories = await sql`
  SELECT 
    id, garden_id, contributor_id, contributor_name, contributor_avatar_url,
    photo_url, text, memory_date, location, position_x, position_y, world_x, world_z,
    emotional_tone, plant_variety, plant_stage, visit_count, last_visited,
    genetics_seed, moisture_level, last_watered_at, reflections
  FROM garden_memories 
  WHERE garden_id = ${gardenId}::uuid
    AND (visibility = 'public' OR visibility IS NULL)
  ORDER BY planted_at DESC
`

// 2. Strict Server-Side Reflection Filtering
// Personal journal reflections written by the owner are NEVER transmitted over the wire.
const sanitizedMemories = memories.map((mem) => {
  const rawReflections = Array.isArray(mem.reflections) ? mem.reflections : []
  // Only transmit reflections explicitly flagged as community tends / notes
  const publicTends = rawReflections.filter((r: any) => r && r.isTend === true)
  return {
    ...mem,
    reflections: publicTends,
  }
})

// 3. Sleeping Seed Projection (If garden has private memories and Mode B is enabled)
let finalMemories = sanitizedMemories
const gardenPrivacyMode = gardens[0].privacy_mode || 'camouflage'

if (gardenPrivacyMode === 'sleeping_seed') {
  const privateSeeds = await sql`
    SELECT id, world_x, world_z, moisture_level, last_watered_at
    FROM garden_memories
    WHERE garden_id = ${gardenId}::uuid AND visibility = 'private'
  `

  const sanitizedSleepingSeeds = privateSeeds.map((seed, idx) => ({
    id: `seed-blind-${idx}-${seed.id.slice(0, 8)}`,
    real_id_hash: seed.id,
    garden_id: gardenId,
    contributor_name: 'The Gardener',
    contributor_avatar_url: null,
    photo_url: '',
    text: 'A quiet memory rests here in gentle contemplation',
    memory_date: null,
    location: null,
    position_x: 0,
    position_y: 0,
    world_x: seed.world_x,
    world_z: seed.world_z,
    emotional_tone: 'peaceful',
    plant_variety: 'flower',
    plant_stage: 'sprout',
    visit_count: 0,
    last_visited: null,
    genetics_seed: 'sleeping-seed',
    moisture_level: seed.moisture_level ?? 100.0,
    last_watered_at: seed.last_watered_at,
    reflections: [],
    is_sleeping_seed: true,
  }))

  finalMemories = [...sanitizedMemories, ...sanitizedSleepingSeeds]
}

// 4. Activity Feed Sanitization (Mask Private Memory IDs)
const activity = await sql`
  SELECT 
    ga.id, ga.garden_id, ga.user_id, ga.user_name, ga.activity_type,
    CASE WHEN gm.visibility = 'private' THEN NULL ELSE ga.memory_id END AS memory_id,
    CASE WHEN gm.visibility = 'private' THEN 'A visitor watered a quiet thought in the garden' ELSE ga.description END AS description,
    ga.created_at
  FROM garden_activity ga
  LEFT JOIN garden_memories gm ON ga.memory_id = gm.id
  WHERE ga.garden_id = ${gardenId}::uuid
  ORDER BY ga.created_at DESC
  LIMIT 20
`

return jsonResponse(200, { garden: gardens[0], memories: finalMemories, activity })
```

---

## 5. R4. Phased Implementation Roadmap & Technical Alignment

### 5.1 System Architecture & Codebase Touchpoints

The implementation cleanly integrates with MemoryGarden's existing files without architectural rewrites:

```
src/
├── components/
│   ├── open-world/
│   │   ├── OpenWorldGarden.tsx     ◄── [Touchpoint 1: Wire quick-water [Q] key & HUD state]
│   │   ├── OpenWorldHud.tsx        ◄── [Touchpoint 2: Dual action prompts [E]/[Q] & thirst indicators]
│   │   ├── engine.ts               ◄── [Touchpoint 3: In-world water particle system & hook dispatch]
│   │   ├── plant-mesh.ts           ◄── [Touchpoint 4: 3-tier visual vitality, wilting droop & dew motes]
│   │   └── terrain.ts              ◄── [Touchpoint 5: Collaborative stone circle & seasonal scenery]
├── lib/
│   ├── open-world/
│   │   ├── types.ts                ◄── [Touchpoint 6: Extend WorldPlant with moisture & healthStatus]
│   │   ├── layout.ts               ◄── [Touchpoint 7: Sanctuary Circle layout & camouflage filtering]
│   │   └── plant-visual.ts         ◄── [Touchpoint 8: Map moisture/vitality into visual recipes]
│   ├── types.ts                    ◄── [Touchpoint 9: PlantMoisture, WateringRecord, GardenGift schemas]
│   ├── storage.ts                  ◄── [Touchpoint 10: Backward-compatible metadata serialization]
│   ├── tending-logic.ts            ◄── [NEW: Moisture decay formula & hydration state machine]
│   └── ambient-garden-engine.ts    ◄── [Touchpoint 11: Water pour & crystal chime Web Audio triggers]
api/
└── gardens.ts                      ◄── [Touchpoint 12: Neon Postgres schema for gifts, logs & milestones]
```

---

### 5.2 Concrete TypeScript Data Model Extensions & Architectural Reconciliation

The following strict TypeScript interfaces extend `src/lib/types.ts` and `src/lib/open-world/types.ts`. They reconcile existing codebase contracts with new retention primitives under a unified 4-tier vitality taxonomy.

#### 5.2.1 Unified 4-Tier Vitality Taxonomy & Reconciliation Formula
To prevent semantic collision between existing codebase `GrowthMetrics.vitality` (capped at 100 in `types.ts:199`), the cumulative growth XP $S_N$, and real-time hydration, the system defines four orthogonal tiers:
1. **`moistureLevel` ($0.0 \text{--} 100.0$)**: Real-time soil hydration. Decays continuously over hours; replenished by watering.
2. **`healthStatus` (`thriving` | `healthy` | `thirsty` | `wilting` | `dormant`)**: Discrete biological state derived from `moistureLevel`.
3. **`nurtureScore` ($S_N$, cumulative $0 \text{--} \infty$)**: Lifelong botanical growth points driving `PlantStage` progression.
4. **`GrowthMetrics.vitality` ($0 \text{--} 100$)**: Existing codebase metric in `src/lib/types.ts:199`. Reconciled as a composite vigor score combining hydration and developmental maturity:

$$\text{GrowthMetrics.vitality} = \min\left(100, \operatorname{round}\left(0.50 \times \text{moistureLevel} + 0.50 \times \min\left(100, \frac{S_N}{350} \times 100\right)\right)\right)$$

This formula guarantees:
- Always strictly bounded in $[0, 100]$, preserving existing `Math.min(100, ...)` constraints in `garden-helpers.ts:61`.
- When a plant is fully watered and fully matured to Elder ($S_N \ge 350$), vitality reaches 100.
- When a plant goes dormant ($M = 0$), vitality scales down proportionally to reflect wintering, but permanently retains up to 50 points from lifetime growth.

```typescript
// ============================================================================
// 1. Plant Hydration, Moisture & Vitality Models (src/lib/types.ts)
// ============================================================================

export type PlantHealthStatus = 'thriving' | 'healthy' | 'thirsty' | 'wilting' | 'dormant';

export interface PlantMoisture {
  /** Current moisture level: 0.0 (bone dry / dormant) to 100.0 (fully saturated) */
  level: number;
  /** ISO timestamp when moisture was last replenished */
  lastWateredAt: string;
  /** Depletion rate in percent per hour (variety-dependent: e.g. 0.65 to 2.0) */
  depletionRatePerHour: number;
  /** Cumulative Nurture Score (Growth XP) */
  nurtureScore: number;
  /** Unique calendar days visited */
  uniqueVisitDays: number;
}

export type WaterSource = 
  | 'direct_water_3d'    // Quick-water [Q] inside 3D walkthrough
  | 'reflection_modal'   // Full reflection submitted inside MemoryCard modal
  | 'social_visitor'     // Reciprocal tend from visiting friend
  | 'morning_dew_ritual' // Harvested dawn dew applied from pond
  | 'rain_weather';      // Ambient rainfall shower

export interface WateringRecord {
  id: string;
  wateredAt: string;
  wateredBy: {
    id: string;
    login: string;
    avatarUrl?: string;
    isOwner: boolean;
  };
  source: WaterSource;
  moistureAdded: number;
  vitalityGained: number;
  note?: string;
}

export interface WateringHistory {
  totalCount: number;
  /** Rolling ledger capped at the last 20 events for localStorage efficiency */
  recentLogs: WateringRecord[];
}

// ============================================================================
// 2. Garden-Wide Stewardship Streak & Per-Plant Care History
// ============================================================================

/** User-profile-level streak tracking: represents human visitation habit */
export interface GardenStreak {
  /** Current consecutive days the user has visited and tended the garden */
  currentStreak: number;
  /** Longest streak achieved */
  longestStreak: number;
  /** ISO date string of last tended action (YYYY-MM-DD) */
  lastTendedDate: string;
  /** Dewdrops of Grace currently protecting missed days: integer clamped to [0, 3] */
  streakShields: number;
  /** Hard cap for protective shields */
  maxStreakShields: 3;
  /** ISO date when a shield was last consumed (YYYY-MM-DD) */
  lastShieldConsumedDate?: string;
  /** Whether any mindful action was performed today */
  tendedToday: boolean;
}

/** Per-plant stewardship history (non-punitive cumulative care on Memory entity) */
export interface PlantCareHistory {
  /** Lifetime count of watering actions received by this memory */
  totalTends: number;
  /** ISO timestamp of most recent watering */
  lastTendedAt: string;
  /** Cumulative days maintained in thriving state (unlocks floral aesthetics) */
  thrivingDaysCount: number;
}

export interface DynamicVitalityMetrics extends GrowthMetrics {
  /** Real-time moisture level: 0.0 to 100.0 */
  moistureLevel: number;
  /** Current discrete biological health status */
  healthStatus: PlantHealthStatus;
  /** Droop / wilting coefficient: 0.0 (fully turgid / upright) to 1.0 (fully bowed) */
  wiltingFactor: number;
  /** Whether the plant has ascended into an immortal radiant state */
  isEternal: boolean;
}

// ============================================================================
// 3. 3D Gifts, Memorials & Shared Milestones (src/lib/types.ts)
// ============================================================================

export type GardenGiftType = 'blossom_note' | 'paper_lantern' | 'dew_vial' | 'wind_chime';

export interface GardenGift {
  id: string;
  memoryId: string;
  gardenId?: string;
  senderId: string;
  senderLogin: string;
  senderAvatarUrl?: string;
  giftType: GardenGiftType;
  message?: string;
  audioUrl?: string;
  createdAt: string;
  openedAt?: string;
  expiresAt?: string;
  positionOffset: { x: number; y: number; z: number };
}

export interface GroveProjectMilestone {
  currentWaterings: number;
  targetWaterings: number;
  unlockedFeatures: Array<'birdbath' | 'fireflies' | 'sakura_tree' | 'starlight_fountain' | 'aurora'>;
}

// ============================================================================
// 4. Extended Memory Entity (src/lib/types.ts)
// ============================================================================

export interface Memory {
  // --- Existing Core Fields ---
  id: string;
  photoUrl: string;
  text: string;
  date: string;
  location?: string;
  plantedAt: string;
  position: Position;
  emotionalTone: EmotionalTone;
  plantStage: PlantStage;
  plantVariety: PlantVariety;
  visitCount: number;
  lastVisited?: string;
  reflections: Reflection[];
  audioRecordings: AudioRecording[];
  
  // --- Backwards-Compatible Retention Extensions ---
  moisture?: PlantMoisture;
  wateringHistory?: WateringHistory;
  careHistory?: PlantCareHistory;
  dynamicMetrics?: DynamicVitalityMetrics;
  gifts?: GardenGift[];
  visibility?: 'public' | 'circle' | 'private';
}

// ============================================================================
// 5. Extended 3D World Plant Representation (src/lib/open-world/types.ts)
// ============================================================================

export interface WorldPlant {
  id: string;
  x: number;
  z: number;
  radius: number;          // Visual spread & bed placement radius (0.18m to 1.38m)
  colliderRadius: number;  // Physical trunk collision cylinder (0.12m to 0.22m)
  height: number;
  variety: PlantVariety;
  stage: PlantStage;
  tone: EmotionalTone;
  title: string;
  photoUrl: string;
  isHybrid: boolean;
  
  // --- Real-Time 3D Rendering Extensions ---
  moistureLevel: number;             // 0.0 to 100.0
  healthStatus: PlantHealthStatus;   // 'thriving' | 'healthy' | 'thirsty' | 'wilting' | 'dormant'
  wiltingFactor: number;             // 0.0 to 1.0 driving procedural mesh bone/stem tilt
  needsWater: boolean;               // True when moistureLevel < 30%
  isEternal: boolean;                // Triggers radiant starlight aura ring
  activeGifts?: GardenGift[];        // Spawns 3D lanterns, blossoms, or vials beside mesh
  tendedByVisitor?: string;          // Name of friend who recently watered this plant
}

// ============================================================================
// 6. Lazy Legacy Memory Hydration Specification (src/lib/tending-logic.ts)
// ============================================================================

/**
 * Pure hydration function guaranteeing existing memories from older app versions
 * initialize in a lush, blooming state with 100% moisture and 1 Dewdrop of Grace.
 */
export function hydrateMemoryVitality(memory: Memory, currentTime = Date.now()): Memory {
  if (memory.moisture && typeof memory.moisture.level === 'number') {
    return memory;
  }

  const varietyRate = 1.2;
  const isoNow = new Date(currentTime).toISOString();

  return {
    ...memory,
    moisture: {
      level: 100.0,
      lastWateredAt: isoNow,
      depletionRatePerHour: varietyRate,
      nurtureScore: 50,
      uniqueVisitDays: 1,
    },
    careHistory: {
      totalTends: 1,
      lastTendedAt: isoNow,
      thrivingDaysCount: 1,
    },
    dynamicMetrics: {
      vitality: memory.growthMetrics?.vitality ?? 85,
      height: memory.growthMetrics?.height ?? 1.0,
      width: memory.growthMetrics?.width ?? 1.0,
      bloomCount: memory.growthMetrics?.bloomCount ?? 3,
      foliageDensity: memory.growthMetrics?.foliageDensity ?? 0.8,
      rarityScore: memory.growthMetrics?.rarityScore ?? 1.0,
      lastInteractionAt: currentTime,
      healthScore: 90,
      healthStatus: (memory.visitCount || 0) >= 15 ? 'thriving' : 'healthy',
      moistureLevel: 100.0,
      wiltingFactor: 0.0, // Zero droop, upright posture
      isEternal: memory.plantVariety === 'eternal_rose' || (memory.visitCount || 0) >= 100,
    },
    visibility: memory.visibility ?? 'public',
  };
}
```

---

### 5.3 Four-Phase Implementation Roadmap

```
Phase 1: MVP In-World Tending & Quick-Water (Weeks 1-2)
  ├── Moisture decay state machine (`tending-logic.ts`)
  ├── Direct in-world watering key [Q] in `OpenWorldHud`
  ├── 3D water droplet particle arc (`WateringParticleSystem`)
  └── Audio water pour & ripple synthesis

Phase 2: Dynamic Vitality States & Gentle Streaks (Weeks 3-4)
  ├── 3-Tier visual mesh deformation in `plant-mesh.ts` (droop, pale soil, dew motes)
  ├── Dawn Morning Dew Harvest ritual at the 3D pond
  ├── Gentle Streak ledger & "Dewdrops of Grace" recovery
  └── Thirst indicators on 2D minimap radar

Phase 3: Collaborative Plots & Reciprocal Social Tending (Weeks 5-6)
  ├── "The Sanctuary Circle" shared plot layout in `layout.ts`
  ├── Reciprocal watering notifications & deep links
  ├── "Garden Bonds" with twin glowing fireflies at entrance
  └── Neon Postgres synchronization for collaborative plots

Phase 4: 3D Gifts, Shared Grove Milestones & Full Rollout (Weeks 7-8)
  ├── 3D Paper Lanterns, Blossom Notes, and Wind Chimes
  ├── "The Grove Project" community milestone unlocks (Sakura Tree, Fountain, Aurora)
  ├── 4-Tier Privacy Architecture & Camouflage vs. Sleeping Seed modes
  └── PWA Web Push notification whispers & performance optimization
```

#### Detailed Phase Breakdown:

#### **Phase 1: MVP In-World Tending & Quick-Water (Weeks 1–2)**
- **Objective**: Eliminate modal jarring by allowing players to water plants directly in first-person 3D.
- **Deliverables**:
  1. Create `src/lib/tending-logic.ts` implementing `computeCurrentMoisture()` and `waterPlant()`.
  2. Extend `OpenWorldHud.tsx` to display `[Q · Water]` whenever `nearby` plant is within $2.65\text{m}$.
  3. Implement `WateringParticleSystem` in `engine.ts` using a 36-particle `THREE.Points` arc.
  4. Connect procedural water sound in `ambient-garden-engine.ts`.
- **Exit Criteria**: Player can walk up to any plant in 3D, press `Q`, see the water splash and soil darken, hear the chime, and see moisture replenish without exiting walkthrough mode.

#### **Phase 2: Dynamic Vitality States & Gentle Streaks (Weeks 3–4)**
- **Objective**: Give plants living biological feedback and compassionate daily rhythm.
- **Deliverables**:
  1. Update `plant-mesh.ts` to implement the Three-Tier visual system (`wiltingFactor` droop, dry ochre soil, sparkling dew particles).
  2. Add Morning Dew Collection at pond during dawn hours ($05:00\text{--}09:00$).
  3. Surface Gentle Streaks in UI with "Dewdrops of Grace" streak protection.
  4. Render pulsing thirst indicators on `OpenWorldMinimap.tsx`.
- **Exit Criteria**: Neglected plants visibly droop and dry out over 3 days; watering instantly restores upright turgor; missed days do not penalize users.

#### **Phase 3: Collaborative Plots & Reciprocal Social Tending (Weeks 5–6)**
- **Objective**: Connect gardeners through shared spatial tending.
- **Deliverables**:
  1. Add "The Sanctuary Circle" shared meadow bed in `layout.ts`.
  2. Implement visitor quick-watering with reciprocal notification toast dispatch.
  3. Render "Garden Bonds" twin fireflies near entrance gate when reciprocal tending occurs.
  4. Wire Neon PostgreSQL backend tables in `api/gardens.ts` for multi-user event logging.
- **Exit Criteria**: User A can enter User B's garden, water their rose, and User B receives an in-app whisper leading back to User A's garden.

#### **Phase 4: 3D Gifts, Shared Grove Milestones & Full Rollout (Weeks 7–8)**
- **Objective**: Complete long-term emotional depth, community goals, and privacy safeguards.
- **Deliverables**:
  1. Procedural 3D gift meshes (`plant-mesh.ts`): Origami Blossom Notes, Paper Lanterns with night point lights, Dew Vials, and Wind Chimes.
  2. "The Grove Project" milestone bar unlocking the Ancient Sakura Tree and Starlight Fountain in 3D.
  3. Four-tier privacy engine with Camouflage Mode and Sleeping Seed mist buds.
  4. Web Push whisper notifications for anniversaries and friend gifts.
- **Exit Criteria**: Full regression test suite passing; 60 FPS maintained on mobile; all privacy boundaries strictly verified.

---

### 5.4 Verification, Testing & Performance Assurance Plan

#### 5.4.1 Unit & Integration Testing Strategy
- **Target Test Files**:
  - `src/lib/__tests__/tending-logic.test.ts`: Tests clamped moisture decay $M(t)$ across all botanical varieties, clock skew protection ($\Delta t \ge 0$), 30-day cap, continuous wilting factor, and satiation/micro-tending windows.
  - `src/lib/__tests__/open-world-vitality.test.ts`: Verifies mapping of `Memory` to `WorldPlant`, validating that `wiltingFactor` and `healthStatus` compute accurately with contiguous health state intervals ($75\%$, $30\%$, $10\%$, $0\%$) and zero NaN or coordinate drift.
  - `src/lib/__tests__/gentle-streaks.test.ts`:
    1. **Streak Grace Protection**: Verifies that missing a daily 24-hour calendar window consumes 1 Dewdrop of Grace (Streak Shield), preserving the garden-wide streak without resetting it to zero.
    2. **Biological Drought Timelines**: Confirms plants do NOT enter dormancy at 24 hours (e.g. flower remains at 52.0% healthy, succulent remains at 84.4% thriving). Verifies that dormancy occurs strictly after full species depletion curves have elapsed (50h to 154h), and that entering dormancy preserves plant stage, lifetime growth XP, and reflection history without permanent loss.
  - `src/lib/__tests__/privacy-camouflage.test.ts`:
    1. **Fixed-Coordinate Invariance**: Proves private memories are 100% excluded from visitor layout with zero coordinate drift ($\vec{\Delta} \equiv \vec{0}$) on public plants.
    2. **Poisson-Disc Filler Flora**: Verifies procedural ground foliage masks empty spaces in emotional tone beds.
  - `src/lib/__tests__/stage-progression.test.ts`: Verifies strict monotonicity ($\Delta \text{Stage} \ge 0$) and exploit-resistant nurture score gates ($V_{\text{days}}$ debounced, reflections and waterings required).

#### 5.4.2 WebGL Performance & Mobile Safeguards
- **Strict Draw Call Budget (Capped at $\le 450$ draw calls)**:
  - **Perimeter Fence Instancing**: The 324 individual fence posts and rails in `terrain.ts:473-503` are rendered using two `THREE.InstancedMesh` nodes (one for posts, one for rails), collapsing 324 draw calls down to **2 draw calls** (4 with shadow pass).
  - **Static Terrain Geometry Merging**: Distant hills (53 spheres) and pergola timbers are merged via `BufferGeometryUtils.mergeGeometries`, reducing baseline terrain draw calls from 470 to **18 draw calls**.
  - **Intra-Plant Material Merging**: Within each plant in `plant-mesh.ts`, sub-meshes sharing identical materials (stem components, canopy foliage, flower petals) are merged into single buffer geometries. Each plant issues at most **3 to 4 draw calls** (instead of 25–31), allowing 50 mature memories to render in $\le 175$ draw calls.
  - **Dynamic Light Budget**: The scene enforces a hard cap of **$\le 2$ active dynamic `PointLight` instances** (player proximity light and central fountain). All other glowing lanterns, fireflies, and motes MUST use unlit emissive materials (`MeshStandardMaterial.emissive` with bloom) to prevent shadow-map draw call multiplication.
  - **Total Scene Draw Call Audit**:
    | Render Layer | Prior Draw Calls (Meshes) | Revised Draw Calls (Instanced / Merged) | Shadow Pass Calls | Total Draw Calls |
    | :--- | :--- | :--- | :--- | :--- |
    | **Terrain Baseline** | 470 meshes | 18 meshes (2 fence, 1 hills, 15 accents) | 18 | 36 |
    | **50 Botanical Plants** | 1,237 meshes | 175 meshes (3.5 per plant) | 175 | 350 |
    | **Particle Systems** | ~40 individual calls | 3 `THREE.Points` (dew, water arc, fireflies) | 0 (no shadow) | 3 |
    | **3D Gifts / Lanterns**| 10–20 meshes | 10 meshes | 10 | 20 |
    | **TOTAL SCENE** | **1,747 meshes (>3,400 calls)** | **206 meshes** | **203 shadow calls** | **409 draw calls** |

- **Robust Memory Disposal Invariant**:
  - `disposePlantGroup()` (`plant-mesh.ts:578-586`) traverses all `THREE.Object3D` nodes, explicitly checking and disposing materials, textures, and non-static `BufferGeometry` instances across `THREE.Mesh`, `THREE.Points`, `THREE.Line`, and `THREE.InstancedMesh`:
    ```typescript
    export function disposePlantGroup(group: THREE.Group): void {
      group.traverse((obj: THREE.Object3D) => {
        if ('geometry' in obj && obj.geometry instanceof THREE.BufferGeometry) {
          if (!obj.userData.isSharedStatic) obj.geometry.dispose();
        }
        if ('material' in obj) {
          const mat = (obj as any).material;
          const materials = Array.isArray(mat) ? mat : [mat];
          for (const m of materials) {
            if (m instanceof THREE.Material) {
              for (const key of Object.keys(m)) {
                const prop = (m as any)[key];
                if (prop && prop instanceof THREE.Texture) prop.dispose();
              }
              m.dispose();
            }
          }
        }
      });
      group.clear();
      group.userData = {};
    }
    ```
  - Static geometry cache nodes (`geo.stem`, `geo.sphere`, etc.) are protected via `userData.isSharedStatic = true`, guaranteeing zero GPU RAM leaks on garden reload.
- **Mobile Hardware Clamping**:
  - `pixelRatio` is clamped to $\le 1.5$ on mobile viewports.
  - Directional shadows are automatically disabled on devices reporting `reducedMotion` or low GPU capabilities (`engine.ts:90`).

#### 5.4.3 Layout & Collision Safety
- **Trunk Collider Decoupling**:
  - Physical collision cylinders are strictly decoupled from visual botanical canopy size.
  - `plantColliderRadius(stage, variety)` clamps physical trunk collision cylinders to $r_{\text{col}} \le 0.22\text{m}$ across all plant stages ($0.12\text{m}$ for sprout up to $0.22\text{m}$ for elder).
  - Players can walk freely under the spreading canopies of large trees ($r_{\text{canopy}} = 1.38\text{m}$) without colliding with invisible boundary walls.
- **Continuous Collision Depenetration Vector**:
  - `stepPlayer()` in `locomotion.ts` incorporates iterative depenetration vector resolution (`resolveDepenetration`).
  - If a plant evolves while the player is standing within interaction range ($2.65\text{m}$), the player is smoothly pushed outward along the collision normal vector $\vec{n}$, eliminating player entrapment and soft-locks.
- **Walkway Navigation Clearance**:
  - `SEPARATION_GAP` in `constants.ts` is expanded from $0.4\text{m}$ to $1.10\text{m}$ ($> 2 \times \text{PLAYER\_RADIUS} = 0.84\text{m}$).
  - Guarantees open walking corridors between all adjacent plants in emotional tone beds, completely preventing player wedge-trapping.

---

## 6. Conclusion & Acceptance Criteria Verification Matrix

This comprehensive retention game plan directly satisfies all requirements defined in `ORIGINAL_REQUEST.md` and `SCOPE.md`:

| Requirement / Criterion | Section Reference in Game Plan | Verification Mechanism |
| :--- | :--- | :--- |
| **R1: Daily, Weekly, Long-Term Loops** | Section 2.1, 2.2, 2.3 | Validated via defined loops: Morning Dew, In-world [Q], Twilight Blooming, Seasons, Eternal Flora. |
| **R1: Integration with Memory Creation & Review** | Section 2.4, 3.4 | Memory creation spawns seed; review and journaling directly replenish moisture and advance growth. |
| **R2: Plant Hydration & Depletion Curves** | Section 3.1.1, 3.1.2 | Mathematical formula $M(t)$, species depletion rates (succulent to flower), weather multipliers. |
| **R2: Growth Stages & Transition Rules** | Section 3.2.1, 3.2.2 | 8 discrete stages (Seed to Elder), Nurture Score $S_N$, explicit threshold matrix. |
| **R2: 3-Tier 3D Visual Vitality States** | Section 3.3.1 – 3.3.4 | Thirsty/Wilting (droop, pale soil), Nourished (erect), Thriving (emissive pulse, dew motes) in `plant-mesh.ts`. |
| **R2: Re-Engagement Triggers & Notifications** | Section 3.5.1 – 3.5.4 | "On This Day" whispers, social care alerts, gentle non-punitive notification philosophy. |
| **R3: Reciprocal 3D Watering** | Section 4.1.1 – 4.1.5 | In-world [Q] key, 36-particle water arc, Web Audio ripple, notification dispatch, Garden Bonds. |
| **R3: Collaborative Plots & Shared Goals** | Section 4.2.1 – 4.2.4 | "The Sanctuary Circle" layout, contributor aura runes, "The Grove Project" milestone unlocks. |
| **R3: 3D Gift & Note Leaving System** | Section 4.3.1 | Blossom notes, glowing paper lanterns, dew vials, wind chimes with voice blessings. |
| **R3: 4-Tier Privacy & Permissions Model** | Section 4.4.1 – 4.4.5 | Private, Circle, Public tiers; Fixed-Coordinate Camouflage ($\vec{\Delta} \equiv \vec{0}$) vs. Central Contemplation Ring Sleeping Seed; server-side SQL projections and reflection filtering. |
| **R4: Architectural Touchpoints** | Section 5.1 | Exact touchpoints identified in `open-world/`, `types.ts`, `storage.ts`, and `api/gardens.ts`. |
| **R4: Concrete TypeScript Data Models** | Section 5.2 | Full schemas for `PlantMoisture`, `WateringRecord`, `GardenStreak`, `PlantCareHistory`, `DynamicVitalityMetrics`, `GardenGift`, `WorldPlant`. |
| **R4: 4-Phase Implementation Roadmap** | Section 5.3 | Phased roadmap from MVP In-World Tending to Full Rollout over 8 weeks. |
| **R4: Dedicated Master Document in Repo** | Master Path | Successfully authored to `/home/keef/projects/memorygarden/RETENTION_GAMEPLAN.md`. |
