# TD1.ATLAS — Cognitive Web Navigation System

**Project Codename: Atlas**

Atlas is a spatial navigation system for the web. It treats the web as a **spatial environment** (like a city) rather than a document collection (like a library).

## Core Principle

**Atlas must never behave like a search engine.**

- ❌ No runtime web search
- ❌ No live browsing
- ❌ No "let me look that up" behaviour
- ❌ No ranked results lists

Instead, Atlas **navigates a pre-built cognitive map** using spatial reasoning.

## What is Atlas?

Atlas is a standalone TD1.WORLD product that provides cognitive web navigation. It's designed for users who want to navigate the web spatially, like navigating a familiar city, rather than searching through documents.

### Key Features

- **Spatial Navigation** - Navigate by location, not search
- **Cognitive Map** - Pre-built map of the web landscape
- **Personal Memory** - Learns your preferences and common paths
- **Zero Runtime Internet** - All navigation is local
- **Orientation-Based** - Shows where you are and what's nearby

## Architecture

```
atlas/
├── core/
│   ├── types.js          # Data structures (Landmark, Topic, Route)
│   ├── graph.js          # Graph traversal engine
│   ├── memory.js         # Personal memory layer
│   └── orientation.js    # Orientation logic
├── data/
│   └── initial-map.js   # Seed cognitive map data
├── ui/
│   ├── atlas-ui.js       # UI components
│   └── atlas-styles.css  # Spatial navigation styles
├── ingestion/            # Separate ingestion system (not runtime)
├── atlas.js              # Main interface
└── index.html            # Standalone product page
```

## Usage

1. Open `index.html` in a browser (must be served via HTTP, not file://)
2. You'll see your current location in the cognitive map
3. Type a directional command (e.g., "NLP tools", "computer vision")
4. Atlas orients you to that area
5. Click on nearby topics or routes to navigate
6. Mark sources as preferred to personalize your experience

## Key Concepts

### Landmarks
Authoritative sources/pages in the cognitive map.

### Neighbourhoods (Topics)
Conceptual areas or topic clusters.

### Routes
Relationships between topics (not just links):
- "often used with"
- "conceptual prerequisite"
- "deeper explanation of"
- "alternative approach"

### Personal Memory
User-specific routes, preferences, and corrections.

## Language & Tone

Atlas speaks like someone who **already knows**:

✅ "That lives here."
✅ "You're in the right area."
✅ "This sits next to…"
✅ "Go deeper here."
✅ "This is a well-mapped space."

❌ "Let me check"
❌ "Searching"
❌ "I found this online"
❌ "Top results suggest"

## Design Goal

> Build an AI that **orients users inside a remembered web landscape**, instead of searching it.

## Installation

1. Clone or download the Atlas directory
2. Serve via HTTP (e.g., `python -m http.server` or any web server)
3. Open `index.html` in your browser

## Development

Atlas uses ES6 modules. Ensure your server supports them.

Personal memory is stored in localStorage per user.

## License

Part of TD1.WORLD product suite.
