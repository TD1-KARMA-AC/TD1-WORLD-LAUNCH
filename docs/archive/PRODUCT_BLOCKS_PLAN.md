# TD1.WORLD Product Blocks - Implementation Plan

## Strategy: Blocks of 5 Products

Focus on creating beautiful, functional product displays in blocks of 5 with working API connections.

## Block 1: Core Infrastructure (First 5)
1. **TD1.MEM** - AI Memory Engine (Port 3000)
2. **TD1.GRAPH** - Graph Reasoning Engine  
3. **TD1.INTENT** - Human Intent Parser
4. **TD1.MIRROR** - Perspective Engine
5. **TD1.ROUTER** - Multi-Model Orchestrator

## Design Style (from DEMO_LAUNCHER.html)
- Clean product cards with tier badges
- Product name + description
- Benefits list with checkmarks
- Pricing + value proposition
- Working "Try Interactive Demo →" button
- Each connects to actual API backend

## Implementation Steps

### Phase 1: Block 1 (Current)
1. Update PRODUCTS_INDEX.html with block-based layout
2. Create clean product cards matching DEMO_LAUNCHER style
3. Ensure all 5 demos connect to working APIs
4. Test each demo works properly
5. Commit and push

### Phase 2: Blocks 2-10 (Future)
- Continue building in blocks of 5
- Each block gets unique UX while maintaining consistency
- All demos must work with API connections

## API Connection Requirements

Each demo needs:
- Backend API running (Docker containers)
- Health check endpoint
- Functional demo page
- Error handling
- Connection status indicator

## Files to Update
1. `website/PRODUCTS_INDEX.html` - Main products page with blocks
2. `website/demos/*_demo.html` - Ensure each connects to API
3. Product READMEs - API connection info

