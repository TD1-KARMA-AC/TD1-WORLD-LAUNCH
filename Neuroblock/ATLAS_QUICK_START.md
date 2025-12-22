# Atlas Quick Start Guide

## What is Atlas?

Atlas is a **spatial navigation system** for the web. Instead of searching, you navigate through a cognitive map like you would navigate a city.

## Key Concepts

- **Landmarks** = Important sources/pages
- **Neighbourhoods** = Topic areas (e.g., "NLP", "Computer Vision")
- **Routes** = Ways to move between topics
- **Current Location** = Where you are in the map

## How to Use

1. **Open explore.html** - You'll see your current location
2. **Type a direction** - e.g., "NLP tools", "computer vision", "AI agents"
3. **Atlas orients you** - Shows landmarks, nearby areas, and routes
4. **Click to navigate** - Click on nearby topics or routes to move
5. **Mark preferences** - Click "Prefer" on landmarks you like

## Example Interactions

### Navigate to a Topic
```
You: "NLP"
Atlas: "You're in the Natural Language Processing area. This is a well-mapped space."
```

### Explore Nearby
```
You: [Click on "Computer Vision" nearby topic]
Atlas: "You're in the Computer Vision area..."
```

### Unknown Area
```
You: "quantum computing"
Atlas: "I don't have that area mapped yet. This space is unmapped or low confidence."
```

## Language Principles

Atlas speaks like someone who **already knows**:

✅ "That lives here."
✅ "You're in the right area."
✅ "This sits next to..."
✅ "Go deeper here."
✅ "This is a well-mapped space."

## Personal Memory

Atlas learns your preferences:
- **Preferred sources** - Sources you mark as "Prefer"
- **Common paths** - Routes you take often
- **Rejected sources** - Sources you don't want to see

## Architecture

- **Runtime** = Zero internet access, only local graph traversal
- **Ingestion** = Separate system that builds the cognitive map
- **Personal Memory** = Stored in your browser (localStorage)

## Troubleshooting

**Module errors?** - Make sure you're serving via HTTP (not file://)

**Nothing showing?** - Check browser console for errors

**Can't navigate?** - Try typing the exact topic name from the seed data

## Next Steps

1. Expand the cognitive map with more topics
2. Add more landmarks
3. Build the ingestion system
4. Add voice input support
5. Create visual map visualization

