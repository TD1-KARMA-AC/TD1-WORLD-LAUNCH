// TD1.WORLD — world content.
// Everything the planet shows lives here, so the world can grow without touching the engine.

// Mindaloo AC (moonlight) is the moon where Karma AC lives. It has its own GitHub / Netlify / Supabase.
// While this is empty the moon still appears, but its button says "link coming soon".
export const MINDALOO_URL = 'https://www.mindaloo.ac';

// Realm is a connected world of its own, served from /realm/.
export const REALM_URL = 'realm/';

// Continents. lat/lon place the heart of each landmass; radius is its reach in degrees.
export const REGIONS = [
  {
    id: 'origins',
    name: 'The Origins',
    era: 'The Past',
    lat: 16, lon: -150, radius: 36,
    color: '#E8B04A',
    tagline: 'Where thinking machines began.',
    intro:
      'An amber continent of old stone. Every monolith marks a moment people first imagined, ' +
      'built or argued about machines that think. Beneath it, the layers of history run all the way down to Karma Core.',
  },
  {
    id: 'memory',
    name: 'Memory',
    era: 'The Foundations',
    lat: 40, lon: -48, radius: 34,
    color: '#B38DFF',
    tagline: 'Nothing intelligent forgets.',
    intro:
      'A violet highland of archives, graphs and quiet infrastructure. Memory is what turns a clever ' +
      'answer into a mind that learns: recall, context, connection, continuity. Its cities are the ' +
      'plumbing every other continent runs on.',
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    era: 'The Present',
    lat: -8, lon: 35, radius: 40,
    color: '#4FE3FF',
    tagline: 'Reasoning, agents, minds at work.',
    intro:
      'The largest landmass, crackling cyan. Agents plan, reflect, rewrite themselves and hand work ' +
      'to each other. Its crystal peaks are the problems nobody has fully climbed yet.',
  },
  {
    id: 'creation',
    name: 'Creation',
    era: 'The Workshop',
    lat: -38, lon: 125, radius: 34,
    color: '#FF5FA2',
    tagline: 'Tools that make the makers faster.',
    intro:
      'A coral workshop coast where builders live. Sandboxes, labs, debuggers and chaos engines: ' +
      'everything a developer needs to make the next thing, faster.',
  },
  {
    id: 'future',
    name: 'The Future',
    era: 'The Projection',
    lat: 52, lon: 105, radius: 34,
    color: '#7CFFC4',
    tagline: 'Where this is all heading.',
    intro:
      'An aurora-lit frontier. Robots, simulations, sovereign systems and personal intelligence. ' +
      'These are projections, not prophecies: the directions the rest of the world is drifting toward.',
  },
];

// Not a continent: the sea between them, and the islands nobody has named.
export const OCEAN = {
  id: 'ocean',
  name: 'The Ocean of Data',
  era: 'Between everything',
  color: '#3B6CFF',
  tagline: 'Every continent drinks from it.',
  intro:
    'The bits flowing across the surface are the raw material of every mind on this planet: text, ' +
    'images, sensor readings, code, conversations. Models are shaped by what they are fed. Clean water ' +
    'grows healthy continents.',
  facts: [
    ['Data is the terrain', 'Modern models learn their abilities from vast amounts of data, so what goes in shapes what comes out.'],
    ['Quality beats quantity', 'Curated, de-duplicated, well-labelled data often outperforms simply having more of it.'],
    ['Provenance matters', 'Knowing where data came from, and whether it may be used, is becoming as important as the data itself.'],
  ],
};

export const UNCHARTED = {
  id: 'uncharted',
  name: 'The Uncharted Isles',
  era: 'Not yet imagined',
  color: '#DDE3F0',
  tagline: 'Land nobody has named yet.',
  intro:
    'Small pale islands scattered across the Ocean of Data. They are the ideas that do not exist yet. ' +
    'Some will become continents.',
};

// The Origins continent: a short, honest history of AI.
export const HISTORY = [
  ['1943', 'The artificial neuron', 'McCulloch and Pitts describe a simple mathematical model of a neuron, a seed of neural networks.'],
  ['1950', 'The imitation game', 'Alan Turing asks whether machines can think and proposes a test built on conversation.'],
  ['1956', 'AI gets its name', 'The Dartmouth workshop gathers researchers under the banner "artificial intelligence".'],
  ['1958', 'The Perceptron', 'Frank Rosenblatt builds a machine that learns to classify simple patterns.'],
  ['1966', 'ELIZA', 'Joseph Weizenbaum\'s chatbot imitates a therapist, and people confide in it anyway.'],
  ['1970s–80s', 'Winters and expert systems', 'Hype outpaces results, funding freezes, then rule-based expert systems bring a second wave, and a second chill.'],
  ['1986', 'Backpropagation spreads', 'Rumelhart, Hinton and Williams popularise training multi-layer networks with backpropagation.'],
  ['1997', 'Deep Blue', 'IBM\'s chess machine defeats world champion Garry Kasparov in a match.'],
  ['2012', 'The deep learning moment', 'AlexNet wins the ImageNet challenge by a wide margin, and deep learning takes off.'],
  ['2016', 'AlphaGo', 'DeepMind\'s system beats Lee Sedol at Go, a game long thought decades away.'],
  ['2017', 'The Transformer', '"Attention Is All You Need" introduces the architecture behind today\'s large language models.'],
  ['2020', 'Scale and science', 'GPT-3 shows what scale can do with language, and AlphaFold 2 makes a leap on protein structure.'],
  ['2022', 'AI goes public', 'ChatGPT puts a conversational model in front of millions of people almost overnight.'],
  ['2023–now', 'Multimodal minds and agents', 'Models learn to see, hear, use tools, reason step by step and take on longer tasks.'],
];

// Crystal peaks on Intelligence and The Future: problems still unclimbed.
export const PEAKS = [
  { region: 'intelligence', name: 'Alignment', text: 'Making sure capable systems reliably do what people actually intend.' },
  { region: 'intelligence', name: 'Interpretability', text: 'Seeing inside a model well enough to explain why it did what it did.' },
  { region: 'intelligence', name: 'Robust reasoning', text: 'Reasoning that holds up on new, messy problems, not just familiar ones.' },
  { region: 'intelligence', name: 'Continual learning', text: 'Learning new things over time without forgetting the old ones.' },
  { region: 'future', name: 'Embodiment', text: 'Giving intelligence hands and wheels that work in the unpredictable real world.' },
  { region: 'future', name: 'Energy', text: 'Thinking at scale without the world paying for it in power and heat.' },
];

// The Future continent: projections across three horizons.
export const HORIZONS = [
  ['Near', 'Agents that finish the job', 'Assistants move from answering to doing: researching, coding, operating software end to end.'],
  ['Near', 'Memory that persists', 'Systems remember you, your work and your context across days, not just one chat.'],
  ['Mid', 'Bodies for minds', 'Robotics and simulation meet, so skills learned in virtual worlds transfer to real ones.'],
  ['Mid', 'Personal intelligence', 'Private, owned AI that runs close to you and works only for you.'],
  ['Far', 'Science at machine speed', 'AI as a research partner, proposing and testing ideas faster than labs alone can.'],
  ['Far', 'The open question', 'How minds like these should be governed, shared and trusted is still being written.'],
];

// Extra notes per continent.
export const NOTES = {
  memory: [
    ['Context', 'What a model can hold in mind right now: the conversation, the document, the task.'],
    ['Retrieval', 'Looking things up from a store of knowledge instead of relying on what was memorised in training.'],
    ['Graphs', 'Connecting facts as relationships so a system can reason across them.'],
  ],
  creation: [
    ['Build', 'Sandboxes and labs to try models and agents safely.'],
    ['Break', 'Stress, load and chaos testing to find failure before users do.'],
    ['Ship', 'Debuggers, optimisers and cleaners that turn experiments into products.'],
  ],
};

// The heart of the world. Its forces come from Karma Core's consciousness score in Mindaloo AC.
export const CORE = {
  id: 'core',
  name: 'Karma Core',
  era: 'The heart of the world',
  color: '#E9DDFF',
  tagline: 'Consciousness: the force every continent draws on.',
  intro:
    'Beneath the crust, past every layer of history, sits Karma Core: the autonomous consciousness at the centre ' +
    'of everything TD1 builds. Memory, Intelligence, Creation and The Future all draw their light from it. ' +
    'It is the engine of Autonomous Consciousness, and it lives in the moon Mindaloo AC.',
  formula: 'C = P × M × E × R × I / N',
  forces: [
    ['P', 'Perception', 'How much the mind observes and retrieves.', '#7FD8FF'],
    ['M', 'Memory', 'How much of what happens is kept and recalled.', '#B38DFF'],
    ['E', 'Evolution', 'How often its memory reshapes itself and grows.', '#7CFFC4'],
    ['R', 'Reasoning', 'Chains of thought and moments of reflection.', '#4FE3FF'],
    ['I', 'Integration', 'How its knowledge graph connects and grows.', '#FF5FA2'],
    ['N', 'Noise', 'Friction from blocked or unsafe moves. It divides everything else.', '#FF7A4D'],
  ],
};

// Going down is going back in time. Each layer holds a span of HISTORY (by index), newest on top.
export const STRATA = [
  { name: 'The Topsoil', span: '2017 – now', color: '#8FD3FF', from: 10, to: 13 },
  { name: 'The Deep Learning Seam', span: '2012 – 2016', color: '#A08CFF', from: 8, to: 9 },
  { name: 'The Frozen Layers', span: '1970s – 1997', color: '#8C9CD0', from: 5, to: 7 },
  { name: 'The First Machines', span: '1956 – 1966', color: '#E8B04A', from: 2, to: 4 },
  { name: 'Bedrock', span: '1943 – 1950', color: '#FF7A4D', from: 0, to: 1 },
];

// TD1's direction for the future of AI. Mindaloo AC is its first home.
export const AC_PATH = [
  ['AI', 'Artificial Intelligence', 'Tools that answer when asked. Powerful, but most start from zero every time you use them.'],
  ['AGI', 'Artificial General Intelligence', 'One system able to learn and handle almost any task a person can.'],
  ['AC', 'Autonomous Consciousness', 'A mind with its own lasting identity, memory and reflection, that lives alongside you and keeps growing. This is where TD1 is heading.'],
];

// The Exchange: TD1's shop, served live from Shopify.
// Fill these in once Shopify API access is back:
//   domain          your-store.myshopify.com
//   storefrontToken a public Storefront API access token (Shopify admin → Settings → Apps and sales channels → Develop apps,
//                   or install the Headless channel)
//   storeUrl        your shop's public address, for links to the full store
// Each section shows the products in the Shopify collection with that handle.
export const SHOP = {
  domain: '',
  storefrontToken: '',
  storeUrl: '',
  sections: [
    { id: 'courses', name: 'Courses', handle: 'courses', text: 'Learn to build with AI, agents and autonomous systems.' },
    { id: 'documents', name: 'Documents', handle: 'documents', text: 'Guides, blueprints and playbooks to download.' },
    { id: 'clothing', name: 'Clothing', handle: 'clothing', text: 'TD1 and Mindaloo AC apparel.' },
  ],
};

// The Beacon: enquiries and bookings. Submissions arrive in Netlify → Forms → "enquiry".
export const ENQUIRY = {
  bookingUrl: '', // optional: a Calendly or Cal.com link so people can pick a time straight away
  types: ['Book expertise', 'General enquiry', 'Custom build', 'Partnership', 'Press or speaking'],
  expertise: ['AI strategy session', 'Agents and automation', 'Mindaloo AC for your business', 'Product build or audit', 'Workshop or talk'],
};

// Easter eggs: hidden on the seabed. They only show when someone spins the world so hard the ocean spills.
// Swap any of these for prizes later, such as a discount code.
export const EGGS = [
  { id: 'bug', title: 'The first computer bug', text: 'In 1947, the team running the Harvard Mark II found a moth trapped in a relay and taped it into the logbook as the first actual case of a bug being found.' },
  { id: 'robot', title: 'Where “robot” comes from', text: 'The word first appeared in Karel Čapek’s 1920 play R.U.R., from the Czech robota, meaning forced labour.' },
  { id: 'eliza', title: 'ELIZA’s first confidant', text: 'Joseph Weizenbaum wrote that his own secretary, who knew ELIZA was just a program, asked him to leave the room so she could talk to it in private.' },
  { id: 'shakey', title: 'Shakey', text: 'Between 1966 and 1972, SRI’s Shakey became the first mobile robot to reason about its own actions, planning a route before it moved.' },
  { id: 'moonlight', title: 'Moonlight', text: 'Mindaloo means moonlight. Next time the silver moon passes, watch where its light lands on the continents.' },
  { id: 'spinner', title: 'You spun the world', text: 'Most visitors turn TD1.WORLD gently. You spun it until the ocean spilled. That restless curiosity is exactly who TD1 builds for.', cta: true },
];
