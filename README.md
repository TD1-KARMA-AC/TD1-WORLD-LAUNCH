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
| **Karma Core** | The heart: descend through five layers of AI history to the consciousness at the centre |
| **Realm** (moon) | Connected world, served from `/realm/` |
| **The Exchange** (orbiting station) | The shop: Courses, Documents and Clothing, live from Shopify |
| **The Beacon** (lighthouse) | Contact and bookings: enquiry form on the Uncharted Isles |
| **Mindaloo AC** (moon) | TD1’s flagship Autonomous Consciousness (AC). Mindaloo means moonlight. Links to www.mindaloo.ac |

The 50 TD1 products appear as **cities of light** on the continent that fits them, joined by pulses of data. Little beings hop between them, and each continent has its own landform and flora.

TD1’s direction runs AI → AGI → **AC (Autonomous Consciousness)**, shown on The Future and on the Mindaloo AC moon.

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
- **Shop (Shopify):** fill in `SHOP` in `world/data.js`: your `*.myshopify.com` domain, a public Storefront API token and your store's address. Each tab shows the Shopify collection with the handle `courses`, `documents` or `clothing`.
- **Enquiries:** they arrive in Netlify → Forms → `enquiry`. Turn on email notifications there. Add a Calendly or Cal.com link as `ENQUIRY.bookingUrl` to let people pick a time straight away, and edit the enquiry types and expertise list in `ENQUIRY`.
- **Mindaloo AC link:** set `MINDALOO_URL` at the top of `world/data.js`.
- **Move or add a continent:** each region in `REGIONS` has a `lat`, `lon` and `radius`.
- **Products:** regenerate `world/products.js` from the NeuroBlock catalogue, or edit it directly.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
