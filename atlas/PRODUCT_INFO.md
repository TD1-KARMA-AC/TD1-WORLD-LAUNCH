# TD1.ATLAS — Product Information

## Product Overview

**Name:** TD1.ATLAS  
**Type:** Cognitive Web Navigation System  
**Status:** Standalone Product  
**Location:** `C:\TD1WORLD\atlas\`

## Description

TD1.ATLAS is a spatial navigation system for the web. Unlike traditional search engines, Atlas treats the web as a spatial environment (like navigating a city) rather than a document collection (like searching a library).

## Key Differentiators

1. **No Search Engine Behavior**
   - Never performs runtime web search
   - Never says "let me look that up"
   - Never shows ranked results lists

2. **Spatial Navigation**
   - Navigate by location, not keywords
   - Shows current location and nearby areas
   - Plans routes between topics

3. **Cognitive Map**
   - Pre-built map of the web landscape
   - Landmarks, neighbourhoods, and routes
   - Zero runtime internet access

4. **Personal Memory**
   - Learns user preferences
   - Tracks common paths
   - Personalizes navigation

## Technical Architecture

- **Runtime:** Zero outbound internet access
- **Data:** Local graph traversal only
- **Storage:** localStorage for personal memory
- **Modules:** ES6 modules (requires HTTP server)

## File Structure

```
atlas/
├── index.html              # Standalone product page
├── atlas.js                # Main Atlas interface
├── README.md               # Full documentation
├── PRODUCT_INFO.md         # This file
├── core/                   # Core system
│   ├── types.js
│   ├── graph.js
│   ├── memory.js
│   └── orientation.js
├── data/                   # Seed data
│   └── initial-map.js
├── ui/                     # UI components
│   ├── atlas-ui.js
│   └── atlas-styles.css
└── ingestion/              # Ingestion system (separate)
    └── README.md
```

## Access

- **Standalone URL:** `/atlas/index.html`
- **Integration:** Can be embedded in other TD1.WORLD products
- **API:** Import `getAtlas()` from `atlas.js`

## Use Cases

1. **Web Navigation** - Navigate known web areas spatially
2. **Knowledge Discovery** - Explore topic neighbourhoods
3. **Personal Assistant** - AI that knows where things are
4. **Cognitive Interface** - Spatial UI for web content

## Next Steps

1. Expand cognitive map with more topics
2. Build ingestion system for map building
3. Add voice input support
4. Create visual map visualization
5. Integrate with other TD1.WORLD products

