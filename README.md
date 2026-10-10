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

Grab the world and spin it any way you like; left alone it turns on a tilted axis like Earth, under a visible sun. Spin it hard enough and the Ocean of Data spills: it surges against the coasts and drains in places to reveal Easter eggs on the seabed (`EGGS` in `world/data.js`). Add `#spill` to the address to see it straight away.

**VR:** on a Meta Quest (or any WebXR headset) an **Enter VR** button appears. You stand in space beside the world: grab it (grip or pinch) to spin it, point and pull the trigger to select places and read floating cards, use the thumbstick to move closer, B/Y for Karma Core and A/X to close. Spin it hard and the ocean spills in VR too.

**Cinematic:** the site opens on a gate (TD1.WORLD, *Enter the world*). That one tap is what lets the browser play sound, so the music is there from the first frame: a deep hit, a rising rush, and a shimmering chord as the sun breaks the horizon. *Enter without sound* is there too, and remembered. Then comes a letterboxed sunrise over the planet's edge and a pull-back reveal (tap or press any key to skip; `#cine=2000` freezes the shot at 2 s for framing). Everything renders through a film pipeline: bloom, lens flare, vignette, grain, lens fringing and a filmic grade. VR renders directly for headset performance. Flights bank like a drone, close-ups pull focus, and an original ambient score (`world/sound.js`, generated live, no audio files) follows you from place to place. Sound is on by default and can be switched off in the top bar.

**Alive and real:**
- **Night side:** as the world turns away from the sun its towns light up, with suburbs and winding roads glowing between them, and a golden-hour band runs along the line between day and night.
- **Towns:** every product is a real town of modelled buildings, with windows that light up at night and a landmark spire at its heart.
- **Weather:** clouds cast shadows on the land and sea. Thunderstorms flash with lightning (you hear the thunder) and aurora curtains ripple over both poles at night.
- **Life:**
  - Forests grow on every continent, and little robots work:
    - The Origins: miners with picks
    - Memory: gardeners
    - Intelligence: surveyors with scanners
    - Creation: builders with hammers
    - The Future: welders with torches
  - Courier robots carry glowing data blocks from town to town.
  - Robots come in three builds (tracked, two-legged walkers and hover bots) and many paint jobs. Fly down and tap one: it stops, turns to you, waves, beeps hello and tells you what it's doing.
  - Cargo drones fly overhead, flocks of birds wheel over the land and container ships cross the Ocean of Data with wakes and navigation lights.
  - Satellites orbit, and a comet streams its tails away from the sun.
- **Real stars and real time:** the sky is the real night sky (5,044 stars down to naked-eye brightness, the Milky Way where it really is, the constellations drawn faintly), lined up with the world's axis. You arrive on the side of the world that matches your own clock (night if it's night where you are), with the sun as high or low as it is today. Then days pass in about three and a half minutes. The HUD shows local time below you.
- **Landing:** keep zooming in, or press **Fly down and look around** on any continent, and the camera drops to drone height. The view tips up to the horizon and the sky turns blue (gold at sunset, starry at night), with haze in the distance and clouds overhead. Drag up and down to fly, side to side to turn.

TD1’s direction runs AI → AGI → **AC (Autonomous Consciousness)**, shown on The Future and on the Mindaloo AC moon.

## How it's built

Plain static files, no build step. Netlify serves the repo root.

```
index.html            the world (page shell)
world/app.js          the 3D engine (three.js)
world/data.js         all the words: continents, history, peaks, projections, links
world/sound.js        the live ambient score and sound effects
world/models.js       robots, drones, birds, ships, trees, satellites
world/stars.js        the real night sky (star catalogue and constellation lines)
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

**Always smooth:** the world watches its own frame rate and steps detail down on slower devices (sharpness, cloud shadows, bloom, focus blur, forest density), and back up once if there's room. Phones start one step lighter. Add `#q=0`, `#q=1` or `#q=2` to the address to force a level.

**Finding the business:** fly close to any town and its product introduces itself (demo link and *Ask about it*). Every continent panel ends with *Book expertise*, and the opening has *or see what TD1 makes →*.

## Launch day checklist

- [ ] Netlify has credit and the site deploys from `TD1-World-Live` (or merge it into `main`).
- [ ] Netlify → Forms → `enquiry`: turn on email notifications so enquiries reach you. If the form can't send, it falls back to an email to `td1@td1.world` (`ENQUIRY.email`).
- [ ] Shop: the TD1WORLD store (`td1world.myshopify.com`) is connected. Clothing shows the **Shop** collection. Create **courses** and **documents** collections in Shopify and those tabs fill themselves. Prices show in the store's currency (currently USD).
- [ ] Optional: a Calendly or Cal.com link in `ENQUIRY.bookingUrl`, and your real expertise list in `ENQUIRY.expertise`.
- [ ] Open it on a phone and on the Quest 3, then check the opening with sound, flying down, tapping a robot, the shop and the contact form.

## Changing things

- **Words, history, peaks, projections:** edit `world/data.js`.
- **Shop (Shopify):** `SHOP` in `world/data.js` points at the TD1WORLD store. Products load without a token (Shopify's tokenless Storefront access); if the store can't be reached, each tab links straight to that collection in the store instead. Each tab shows the Shopify collection with its handle (`shop`, `courses`, `documents`).
- **Enquiries:** they arrive in Netlify → Forms → `enquiry`. Turn on email notifications there. Add a Calendly or Cal.com link as `ENQUIRY.bookingUrl` to let people pick a time straight away, and edit the enquiry types and expertise list in `ENQUIRY`.
- **Mindaloo AC link:** set `MINDALOO_URL` at the top of `world/data.js`.
- **Move or add a continent:** each region in `REGIONS` has a `lat`, `lon` and `radius`.
- **Products:** regenerate `world/products.js` from the NeuroBlock catalogue, or edit it directly.

## Credits

Star positions, brightness and constellation lines come from [d3-celestial](https://github.com/ofrohn/d3-celestial) by Olaf Frohn (BSD-3-Clause), built on the HYG star database (CC BY-SA). three.js is MIT licensed.

`#dev` in the address exposes a few handles (`window.td1`) for testing and framing shots.

## Run locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.
