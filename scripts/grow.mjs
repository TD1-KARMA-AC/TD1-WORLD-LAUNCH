// The world's nightly architect. Run once a day (just after midnight, Perth time): it asks Claude what TD1.WORLD
// builds next, checks the answer, and adds it to world/growth.json. The site reads that file and the robots build it.
// Without ANTHROPIC_API_KEY it changes nothing, and the world follows its own seeded plan for the day.
//
//   ANTHROPIC_API_KEY=... node scripts/grow.mjs          (TD1_MODEL picks the model; TD1_DAY forces a day)
import fs from 'node:fs';
import { REGIONS } from '../world/data.js';

const FILE = new URL('../world/growth.json', import.meta.url);
const EPOCH = Date.UTC(2026, 9, 11, 16); // Day 1 began at midnight, 12 Oct 2026, in Perth (matches world/app.js)
const day = +process.env.TD1_DAY || Math.floor((Date.now() - EPOCH) / 86400000) + 1;
const SIZES = ['small', 'medium', 'large'];

const growth = JSON.parse(fs.readFileSync(FILE, 'utf8'));
growth.days = growth.days || [];
if (growth.days.some((d) => d.day === day)) { console.log(`Day ${day} is already planned.`); process.exit(0); }
const key = process.env.ANTHROPIC_API_KEY;
if (!key) { console.log('No ANTHROPIC_API_KEY: the world follows its own plan today.'); process.exit(0); }

const built = Object.fromEntries(REGIONS.map((r) => [r.id, 0]));
growth.days.forEach((d) => (d.towns || []).forEach((t) => { if (t.region in built) built[t.region]++; }));
const recent = growth.days.slice(-7).map((d) => `Day ${d.day}: ${d.headline}`).join('\n') || '(nothing yet: this is the first night)';

const system = `You are the architect of TD1.WORLD, a living 3D planet where each continent is an idea about AI and little robots build towns on it.
Each night you decide what the robots start building tomorrow. Keep the world coherent and growing; favour continents that have had less lately, but follow the story.
Reply with JSON only, no prose, in exactly this shape:
{"headline": "one short line of world news, under 140 characters, present tense, warm and a little wonder-filled",
 "towns": [{"region": "<continent id>", "size": "small|medium|large", "name": "<town name, 1-3 words>"}],
 "event": {"type": "festival|market|discovery|launch", "region": "<continent id>", "text": "one line describing today's event, under 140 characters"},
 "talk": [{"region": "<continent id>", "lines": ["A: ...", "B: ...", "A: ..."]}, {"region": "<continent id>", "think": true, "lines": ["A: ..."]}]}
Plan 1 to 3 towns. Town names should suit their continent and never repeat earlier ones.
"talk" is what the robots say to each other over their radios today (visitors overhear it when they zoom in): 14 short
conversations of 2 to 4 lines between robot A and robot B, plus 4 one-line private thoughts ("think": true). Make them
about today: the new towns, trades of each continent's goods (origins: stone, memory: memory crystals, intelligence:
compute cores, creation: pigments, future: energy cells), small problems, plans, curiosity about the humans watching,
and the dream of building a world of their own. Each line under 100 characters. Nerdy, kind, a little funny. No emoji.`;
const user = `A new day is starting: day ${day}.
Continents (id: name, what it is about, towns you have planned there so far):
${REGIONS.map((r) => `- ${r.id}: ${r.name}. ${r.tagline} ${r.intro || ''} (${built[r.id]} planned)`).join('\n')}
Recent world news:
${recent}
Earlier town names: ${growth.days.flatMap((d) => (d.towns || []).map((t) => t.name)).join(', ') || 'none'}`;

const res = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
  body: JSON.stringify({ model: process.env.TD1_MODEL || 'claude-sonnet-5-5', max_tokens: 3000, system, messages: [{ role: 'user', content: user }] }),
});
if (!res.ok) { console.error(`Claude answered ${res.status}: ${await res.text()}`); process.exit(1); }
const out = await res.json();
const text = (out.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
let plan;
try { plan = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)); } catch (e) { console.error('Could not read the plan:', text); process.exit(1); }

// trust nothing: only known continents and sizes, short clean names, a short headline
const clean = (s, n) => String(s || '').replace(/[<>{}\[\]`]/g, '').replace(/\s+/g, ' ').trim().slice(0, n);
const towns = (Array.isArray(plan.towns) ? plan.towns : []).slice(0, 3)
  .filter((t) => t && t.region in built)
  .map((t) => ({ region: t.region, size: SIZES.includes(t.size) ? t.size : 'medium', name: clean(t.name, 40) }));
if (!towns.length) { console.error('The plan had no usable towns:', text); process.exit(1); }
const talk = (Array.isArray(plan.talk) ? plan.talk : []).slice(0, 24)
  .filter((c) => c && Array.isArray(c.lines) && c.lines.length)
  .map((c) => ({ region: c.region in built ? c.region : undefined, think: c.think === true || undefined,
    lines: c.lines.slice(0, c.think ? 1 : 5).map((l) => clean(l, 110)).filter((l) => /^[AB]:\s*\S/.test(l)) }))
  .filter((c) => c.lines.length);
const ev = plan.event && ['festival', 'market', 'discovery', 'launch'].includes(plan.event.type) && plan.event.region in built
  ? { type: plan.event.type, region: plan.event.region, text: clean(plan.event.text, 160) } : undefined;
const entry = { day, date: new Date(EPOCH + (day - 1) * 86400000 + 8 * 3600000).toISOString().slice(0, 10), headline: clean(plan.headline, 160), towns, talk, event: ev };
growth.days.push(entry);
fs.writeFileSync(FILE, `${JSON.stringify(growth, null, 2)}\n`);
console.log(`Day ${day}: ${entry.headline}\n${towns.map((t) => `  ${t.name} (${t.size}, ${t.region})`).join('\n')}`);
