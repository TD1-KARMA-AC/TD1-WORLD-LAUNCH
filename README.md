# TD1.WORLD

A living 3D world of intelligence. Visitors land on a planet they can spin, zoom and fly around. Every landmass is an idea:

| Place | What it is |
| --- | --- |
| **The Origins** (amber) | The past: a short history of AI, marked by glowing monoliths |
| **Memory** (violet) | The foundations: memory, retrieval, graphs and infrastructure |
| **Intelligence** (cyan) | The present: reasoning and agents, with crystal peaks for unsolved problems |
| **Creation** (coral) | The workshop: developer tools |
| **The Future** (aurora green) | The projection: near, mid and far horizons |
| **Ocean of Data** | The flowing sea between every continent |
| **Uncharted Isles** | Small pale islands: ideas nobody has had yet |
| **Realm** (moon) | Connected world, served from `/realm/` |
| **Karma AC** (satellite) | Links out to Karma AC's own site |

The 50 TD1 products appear as **cities of light** on the continent that fits them, joined by pulses of data.

## How it's built

Plain static files, no build step. Netlify serves the repo root.

```
index.html            the world (page shell)
world/app.js          the 3D engine (three.js)
world/data.js         all the words: continents, history, peaks, projections, links
world/products.js     the 50 products (generated from Neuroblock/td1-products-data.js)
world/style.css       interface styling
world/vendor/         three.js r160, self-hosted
realm/                Realm (compiled app, kept as a connector)
Neuroblock/           NeuroBlock marketplace (Supabase)
website/              product demo pages + Stripe checkout pages (parked, still served)
netlify/functions/    Stripe checkout and email functions
_parked/legacy-home/  the old home page, Atlas and shared scripts (kept, not served)
docs/archive/         old setup and fix notes (kept, not served)
```

## Changing things

- **Words, history, peaks, projections:** edit `world/data.js`.
- **Karma AC link:** set `KARMA_AC_URL` at the top of `world/data.js`.
- **Move or add a continent:** each region in `REGIONS` has a `lat`, `lon` and `radius`.
- **Products:** regenerate `world/products.js` from the NeuroBlock catalogue, or edit it directly.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
