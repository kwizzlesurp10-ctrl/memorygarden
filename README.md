# MemoryGarden 🌱

A peaceful, emotional digital garden where you plant and nurture personal memories. Watch your memories grow from seeds to blooms as you revisit and reflect on them over time.

## What is MemoryGarden?

MemoryGarden reimagines how we preserve and interact with our memories. Instead of scrolling through static photo albums, your memories become living plants in a beautiful garden that:

- **Grow over time** - Memories evolve from seeds to sprouts to blooms based on how often you visit them.
- **Reflect emotions** - AI classifies the emotional tone of each memory (happy, nostalgic, peaceful, etc.).
- **Encourage reflection** - Add new thoughts to memories and receive gentle, poetic insights from the Garden AI.
- **Create connections** - Discover relationships between memories planted near each other.
- **Adapt to seasons** - The garden changes with real-world time, seasons, and weather.

## Features

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

## Technical Architecture

MemoryGarden is built as a modern, responsive web application with a focus on smooth, organic interactions.

### Frontend Stack
- **React 19 + TypeScript**: Core UI framework.
- **Vite**: Build tool and dev server.
- **Tailwind CSS**: Styling and responsive design.
- **Framer Motion**: Organic animations and transitions.
- **Radix UI**: Accessible UI components.
- **Spark SDK**: Handles authentication and persistent storage.

### Sub-projects
- **Volatility Sentinel**: A Python-based agent (located in `/volatility-sentinel`) that monitors price volatility using the CoinGecko API, providing an example of backend-style agent integration.

## Getting Started

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

## Privacy & Data

- **Completely Private**: All memories are stored securely in your GitHub account via the Spark SDK.
- **No External Services**: Your personal photos and data never leave the platform.
- **You Own Your Data**: Export your entire garden at any time from the settings menu.

---

**Remember**: Your garden is yours alone. Take your time, be gentle with yourself, and let your memories grow. 🌺
