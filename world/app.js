// TD1.WORLD — the living planet.
// One sphere, five impossible continents, an ocean of data, cities of light, and two moons.

import * as THREE from 'three';
import {
  REGIONS, OCEAN, UNCHARTED, HISTORY, PEAKS, HORIZONS, NOTES, MINDALOO_URL, REALM_URL, CORE, STRATA, AC_PATH, SHOP, ENQUIRY, EGGS,
} from './data.js';
import { PRODUCTS } from './products.js';

/* ------------------------------------------------------------------ setup */

const $ = (s) => document.querySelector(s);
const DEG = Math.PI / 180;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(pointer: coarse)').matches;
const isSmall = () => innerWidth < 760;
const UNCH = REGIONS.length; // region index for the uncharted isles

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas: $('#world'), antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  showFallback();
  throw e;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 200);
camera.position.set(0, 2.4, 11);
// distance at which a sphere of radius r fits the narrower side of the screen
function fitDist(r, min) {
  const tv = Math.tan((camera.fov * DEG) / 2);
  return Math.max(min, r / Math.min(tv, tv * camera.aspect));
}

/* The world in your hands: grab it, fling it, spin it in any direction. Left alone, it turns like Earth. */
const EARTH_AXIS = new THREE.Vector3(Math.sin(23.4 * DEG), Math.cos(23.4 * DEG), 0).normalize();
const MIN_D = 1.45, MAX_D = 10;
const spin = {
  q: new THREE.Quaternion(),
  dist: 9.5,
  target: 3.4,
  w: new THREE.Vector3(), // angular velocity around the camera's own axes, rad/s
  enabled: true,
  dragging: false,
  pointers: new Map(),
  pinch: 0,
  lastMove: 0,
  energy: 0, // builds while the world spins very fast
  axisWorld: new THREE.Vector3(0, 1, 0),
};
const _sq = new THREE.Quaternion(), _sv = new THREE.Vector3();
function syncSpin() { spin.q.copy(camera.quaternion); spin.dist = spin.target = camera.position.length(); }
function placeCamera() {
  camera.quaternion.copy(spin.q);
  camera.position.set(0, 0, spin.dist).applyQuaternion(spin.q);
  camera.up.set(0, 1, 0).applyQuaternion(spin.q);
}
function turnCamera(ax, ay, az) { // rotate around the camera's own axes by these angles
  _sv.set(ax, ay, az);
  const ang = _sv.length();
  if (ang < 1e-8) return;
  _sq.setFromAxisAngle(_sv.multiplyScalar(1 / ang), ang);
  spin.q.multiply(_sq).normalize();
}

const sunDir = new THREE.Vector3(-0.6, 0.45, 0.65).normalize();
scene.add(new THREE.HemisphereLight(0xbfd4ff, 0x1a1030, 0.4));
const SUN0 = Math.atan2(0.65, -0.6);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.copy(sunDir).multiplyScalar(10);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x8a7dff, 1.1);
rim.position.set(0.8, -0.2, -1).multiplyScalar(10);
scene.add(rim);

const clock = new THREE.Clock();
const U = { uTime: { value: 0 } }; // shared time uniform

/* ------------------------------------------------------------------ noise */

function hash3(x, y, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1440662683);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const l = (a, b, t) => a + (b - a) * t;
  return l(
    l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
    l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v),
    w,
  );
}
function fbm(x, y, z, oct = 5) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) { s += a * (vnoise(x * f, y * f, z * f) * 2 - 1); f *= 2.03; a *= 0.5; }
  return s;
}
function rng(seed) { // mulberry32
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const latLon = (lat, lon) => new THREE.Vector3(
  Math.cos(lat * DEG) * Math.cos(lon * DEG), Math.sin(lat * DEG), -Math.cos(lat * DEG) * Math.sin(lon * DEG),
);

/* ------------------------------------------------------------------ terrain */

REGIONS.forEach((r) => { r.dir = latLon(r.lat, r.lon); r.col = new THREE.Color(r.color); });

// h > 0 is land. region is a REGIONS index, UNCH for islands, -1 for open ocean. near is the closest continent.
function terrain(x, y, z) {
  const warp = fbm(x * 2 + 3.1, y * 2 + 1.7, z * 2 + 5.3, 3) * 16;
  let best = -1, bw = -9;
  for (let i = 0; i < REGIONS.length; i++) {
    const r = REGIONS[i];
    const d = Math.acos(Math.min(1, Math.max(-1, x * r.dir.x + y * r.dir.y + z * r.dir.z))) / DEG + warp;
    const w = 1 - d / r.radius;
    if (w > bw) { bw = w; best = i; }
  }
  const n = fbm(x * 2.6 + 11, y * 2.6 + 7, z * 2.6 + 3, 5);
  let h = bw * 0.95 + n * 0.34 - 0.04;
  let region = h > 0 ? best : -1;
  if (h <= 0 && bw < -0.3) {
    const isl = fbm(x * 5 + 40, y * 5 + 40, z * 5 + 40, 4);
    if (isl > 0.3) { h = (isl - 0.3) * 1.3; region = UNCH; }
    else if (isl > 0.26) { h = (isl - 0.3) * 1.3; } // shallows around the isles
  }
  return { h, region, near: best };
}
const sstep = (x, a, b) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// Each continent has its own landform.
function elevation(x, y, z, h, region) {
  if (h <= 0) return -0.01 + 0.0125 * sstep(h, -0.05, -0.032); // lagoon shelf, just above the sea near shore
  const hh = Math.min(h, 0.9);
  const soft = fbm(x * 9 + 1, y * 9 + 5, z * 9 + 2, 3);
  switch (region) {
    case 0: { // The Origins: terraced mesas of old stone
      const k = hh * 7;
      return 0.006 + ((Math.floor(k) + sstep(k - Math.floor(k), 0.72, 1)) / 7) * 0.095 + soft * 0.004;
    }
    case 1: return 0.006 + hh * 0.06 + soft * 0.016; // Memory: soft rolling hills
    case 2: { // Intelligence: sharp ridgelines
      const ridge = 1 - Math.abs(fbm(x * 7 + 2, y * 7 + 9, z * 7 + 4, 3) * 1.6);
      return 0.006 + hh * 0.04 + Math.pow(Math.max(0, ridge), 5) * hh * 0.15;
    }
    case 3: return 0.006 + hh * 0.05 + (0.5 + 0.5 * Math.sin(x * 47 + z * 41 + soft * 7)) * hh * 0.022; // Creation: rippled dunes
    case 4: return 0.006 + sstep(hh, 0.08, 0.32) * 0.07 + sstep(hh, 0.45, 0.6) * 0.03 + soft * 0.008; // The Future: stepped plateaus
    default: return 0.004 + hh * 0.03 + soft * 0.004; // Uncharted Isles
  }
}

const planet = new THREE.Group();
scene.add(planet);

const landFaces = []; // per land face: { c: centroid (unit), r: radius, region, h }
const byRegion = Array.from({ length: REGIONS.length + 1 }, () => []);

function buildLand() {
  const detail = isSmall() || isTouch ? 64 : 96;
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const src = ico.attributes.position;
  const cache = new Map();
  const pos = [], col = [], reg = [], index = [];
  const c = new THREE.Color();
  const uncharted = new THREE.Color(UNCHARTED.color);
  const deepSea = new THREE.Color('#0b1b52'), lagoon = new THREE.Color('#4fd4e6'), sand = new THREE.Color('#f3e6cf');
  const peakTints = REGIONS.map((r) => r.col.clone().lerp(new THREE.Color(1, 1, 1), 0.7));
  const altTints = REGIONS.map((r) => r.col.clone().offsetHSL(-0.07, 0.08, -0.16)); // second biome colour per continent
  function colorOf(v) {
    const base = v.region === UNCH ? uncharted : REGIONS[v.near].col;
    if (v.h <= 0) { // glowing lagoon fading out to the deep
      const k = sstep(v.h, -0.05, 0);
      return c.copy(deepSea).lerp(lagoon, k * 0.85).lerp(base, k * 0.3);
    }
    const t = Math.min(1, v.h / 0.75);
    c.copy(base);
    if (v.region !== UNCH) c.lerp(altTints[v.region], sstep(fbm(v.x * 3.3 + 5, v.y * 3.3 + 1, v.z * 3.3 + 8, 3), -0.12, 0.22) * 0.7);
    c.multiplyScalar(0.5 + 0.5 * t);
    c.offsetHSL(t * 0.03, 0, 0);
    if (v.h < 0.035) c.lerp(sand, 0.6 * (1 - v.h / 0.035)); // beaches
    if (t > 0.78 && v.region !== UNCH) c.lerp(peakTints[v.region], Math.min(1, (t - 0.78) * 3));
    const grain = fbm(v.x * 22 + 7, v.y * 22 + 3, v.z * 22 + 9, 2);
    return c.multiplyScalar(0.9 + grain * 0.25);
  }
  const sample = (i) => {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
    let v = cache.get(key);
    if (!v) {
      const t = terrain(x, y, z);
      v = { x, y, z, h: t.h, region: t.region, near: t.near, e: elevation(x, y, z, t.h, t.region), idx: -1 };
      cache.set(key, v);
    }
    return v;
  };
  const use = (v) => {
    if (v.idx < 0) {
      v.idx = pos.length / 3;
      const r = 1 + v.e;
      pos.push(v.x * r, v.y * r, v.z * r);
      colorOf(v);
      col.push(c.r, c.g, c.b);
      reg.push(v.region === UNCH ? UNCH : v.near);
    }
    return v.idx;
  };

  for (let f = 0; f < src.count / 3; f++) {
    const v = [sample(f * 3), sample(f * 3 + 1), sample(f * 3 + 2)];
    const top = v.reduce((a, b) => (b.h > a.h ? b : a));
    if (top.h <= -0.05) continue; // open ocean: the data sea covers it
    index.push(use(v[0]), use(v[1]), use(v[2]));
    if (top.h <= 0) continue; // lagoon shelf, not land
    const region = top.region;
    const hAvg = (v[0].h + v[1].h + v[2].h) / 3;
    const cx = (v[0].x + v[1].x + v[2].x) / 3, cy = (v[0].y + v[1].y + v[2].y) / 3, cz = (v[0].z + v[1].z + v[2].z) / 3;
    const face = { c: new THREE.Vector3(cx, cy, cz).normalize(), r: 1 + (v[0].e + v[1].e + v[2].e) / 3, region, h: hAvg };
    if (hAvg > 0) { landFaces.push(face); byRegion[region].push(face); }
  }
  ico.dispose();

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aRegion', new THREE.Float32BufferAttribute(reg, 1));
  g.setIndex(index);
  g.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0.04, transparent: true });
  mat.userData.uHi = { value: -10 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uHi = mat.userData.uHi;
    sh.uniforms.uSun = { value: sunDir };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRegion;\nvarying float vRegion;\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRegion = aRegion;\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uHi;\nuniform vec3 uSun;\nvarying float vRegion;\nvarying vec3 vWP;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float sel = 1.0 - step(0.5, abs(vRegion - uHi));
        totalEmissiveRadiance += vColor.rgb * (0.05 + sel * (0.05 + 0.035 * sin(uTime * 2.6)));
        float night = smoothstep(0.1, -0.35, dot(normalize(vWP), uSun));
        totalEmissiveRadiance += vColor.rgb * night * 0.07;`);
  };
  const land = new THREE.Mesh(g, mat);
  land.renderOrder = 2;
  planet.add(land);
  return land;
}
const land = buildLand();

/* ------------------------------------------------------------------ the ocean of data */

const ocean = new THREE.Mesh(
  new THREE.SphereGeometry(1, 128, 96),
  new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSun: { value: sunDir }, uHi: { value: 0 }, uAlpha: { value: 1 },
      uSlosh: { value: 0 }, uSloshAge: { value: 99 }, uSloshDir: { value: new THREE.Vector3(1, 0, 0) },
      uSpin: { value: 0 }, uSpinAxis: { value: new THREE.Vector3(0, 1, 0) },
      uDrain: { value: 0 }, uHoles: { value: [new THREE.Vector3(0, 9, 0), new THREE.Vector3(0, 9, 0), new THREE.Vector3(0, 9, 0)] } },
    transparent: true,
    vertexShader: `
      uniform float uSlosh; uniform float uSloshAge; uniform vec3 uSloshDir; uniform float uSpin; uniform vec3 uSpinAxis;
      varying vec3 vPos; varying vec3 vN; varying vec3 vView; varying float vSurge;
      void main(){
        vPos = position;
        vec3 n = normalize(position);
        // after a sudden stop the water keeps going: it piles up on one side and rolls back in waves
        float side = dot(n, uSloshDir);
        float fade = exp(-uSloshAge * 0.55);
        float pile = smoothstep(-0.2, 1.0, side) * fade;
        float wave = sin(side * 10.0 - uSloshAge * 6.5) * exp(-uSloshAge * 0.4);
        // spinning hard flings water toward the equator of the spin
        float bulge = uSpin * (1.0 - abs(dot(n, uSpinAxis)));
        float lift = uSlosh * (0.04 * pile + 0.012 * wave) + bulge * 0.02;
        vSurge = clamp(uSlosh * pile * 2.0 + bulge * 0.6, 0.0, 1.0);
        vec4 wp = modelMatrix * vec4(position * (1.0 + lift), 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uSun; uniform float uHi; uniform float uAlpha;
      uniform float uDrain; uniform vec3 uHoles[3]; uniform float uSpin;
      varying vec3 vPos; varying vec3 vN; varying vec3 vView; varying float vSurge;
      float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        // drained patches of seabed, with foam around their rims
        vec3 un = normalize(vPos);
        float foam = 0.0;
        for (int i = 0; i < 3; i++) {
          float d = dot(un, uHoles[i]);
          float wob = 0.012 * sin(atan(un.z - uHoles[i].z, un.x - uHoles[i].x) * 7.0 + uTime * 2.0);
          float r = cos(0.15 * uDrain + wob * uDrain);
          if (uDrain > 0.001 && d > r) discard;
          foam = max(foam, smoothstep(r - 0.006, r, d) * uDrain);
        }
        float lat = asin(clamp(vPos.y, -1.0, 1.0));
        float lon = atan(vPos.z, vPos.x);
        float rows = 70.0;
        float band = floor(lat * rows);
        float dir = mod(band, 2.0) > 0.5 ? 1.0 : -1.0;
        float speed = (0.25 + h1(band) * 0.9) * dir;
        float density = cos(lat) * 34.0 + 6.0;
        float x = lon * density + uTime * speed * 1.6;
        float cell = floor(x);
        float r = h2(vec2(cell, band));
        float bit = step(0.78, r) * smoothstep(0.0, 0.12, fract(x)) * smoothstep(0.95, 0.55, fract(x));
        float line = smoothstep(0.16, 0.0, abs(fract(lat * rows) - 0.5));
        float flick = 0.55 + 0.45 * sin(uTime * 3.0 + r * 40.0);
        float lit = max(dot(vN, uSun), 0.0);
        vec3 deep = vec3(0.012, 0.02, 0.07);
        vec3 mid = vec3(0.04, 0.09, 0.28);
        vec3 col = mix(deep, mid, 0.15 + lit * 0.85);
        vec3 bitCol = mix(vec3(0.25, 0.55, 1.0), vec3(0.75, 0.6, 1.0), h1(cell));
        float night = smoothstep(0.15, -0.3, dot(vN, uSun));
        col += bitCol * bit * line * flick * (0.55 + uHi * 0.6 + night * 0.7);
        col += vec3(0.1, 0.2, 0.55) * line * 0.05;
        float fres = pow(1.0 - max(dot(vN, vView), 0.0), 3.0);
        col += vec3(0.25, 0.45, 1.0) * fres * 0.55;
        vec3 hv = normalize(uSun + vView);
        col += vec3(1.0, 0.95, 0.85) * pow(max(dot(vN, hv), 0.0), 70.0) * 0.6;
        col += vec3(0.75, 0.9, 1.0) * (foam * 0.9 + vSurge * 0.22);
        col += vec3(0.3, 0.55, 1.0) * uSpin * line * 0.35;
        gl_FragColor = vec4(col, uAlpha + bit * line * (1.0 - uAlpha) * 0.5);
      }`,
  }),
);
ocean.renderOrder = 1;
planet.add(ocean);

/* ------------------------------------------------------------------ clouds + atmosphere */

const GLSL_NOISE = `
  float hh(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float nz(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * nz(p); p *= 2.02; a *= 0.5; } return s; }`;

const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(1.085, 96, 64),
  new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSun: { value: sunDir }, uFade: { value: 1 } },
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec3 vPos; varying vec3 vN;
      void main(){ vPos = position; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uSun; uniform float uFade; varying vec3 vPos; varying vec3 vN;
      ${GLSL_NOISE}
      void main(){
        float n = fbm(vPos * 3.2 + vec3(uTime * 0.015, 0.0, uTime * 0.01));
        float a = smoothstep(0.56, 0.78, n) * 0.38 * uFade;
        float lit = 0.25 + 0.75 * max(dot(vN, uSun), 0.0);
        gl_FragColor = vec4(vec3(0.95, 0.96, 1.0) * lit, a);
      }`,
  }),
);
clouds.renderOrder = 4;
planet.add(clouds);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.13, 64, 48),
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec3 vN; void main(){
        float d = dot(vN, vec3(0.0, 0.0, 1.0));
        float i = pow(max(0.0, 0.62 - d), 3.0) * smoothstep(-0.78, -0.45, d); // rim only, even when the planet turns see-through
        gl_FragColor = vec4(mix(vec3(0.35, 0.55, 1.0), vec3(0.75, 0.55, 1.0), vN.y * 0.5 + 0.5) * i * 0.9, 1.0);
      }`,
  }),
);
atmosphere.renderOrder = 5;
scene.add(atmosphere);

/* ------------------------------------------------------------------ stars */

{
  const N = 2600, p = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N);
  const r = rng(99);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize().multiplyScalar(40 + r() * 40);
    p.set([v.x, v.y, v.z], i * 3);
    ph[i] = r() * 6.28;
    sz[i] = 0.6 + Math.pow(r(), 6) * 3;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  scene.add(new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPR: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPR; attribute float aPhase; attribute float aSize; varying float vA;
      void main(){ vA = 0.55 + 0.45 * sin(uTime * 1.3 + aPhase); gl_PointSize = aSize * uPR * (0.8 + vA * 0.4);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.85, 0.88, 1.0), smoothstep(0.5, 0.0, d) * vA); }`,
  })));
}

/* ------------------------------------------------------------------ placing things on land */

function pickFaces(region, count, seed, { minSep = 4, minH = 0.08, preferHigh = false } = {}) {
  const pool = byRegion[region].filter((f) => f.h > minH);
  const r = rng(seed), out = [];
  const cos = Math.cos(minSep * DEG);
  for (let tries = 0; out.length < count && tries < count * 400; tries++) {
    let f;
    if (preferHigh) { // best of a handful of samples
      f = pool[Math.floor(r() * pool.length)];
      for (let k = 0; k < 10; k++) { const g = pool[Math.floor(r() * pool.length)]; if (g.h > f.h) f = g; }
    } else f = pool[Math.floor(r() * pool.length)];
    if (!f) break;
    const sep = tries > count * 300 ? cos + (1 - cos) * 0.6 : cos; // relax if crowded
    if (out.every((o) => o.c.dot(f.c) < sep)) out.push(f);
  }
  return out;
}
const up = new THREE.Vector3(0, 1, 0);
function standOn(obj, face, lift = 0) {
  obj.position.copy(face.c).multiplyScalar(face.r + lift);
  obj.quaternion.setFromUnitVectors(up, face.c);
}

/* ------------------------------------------------------------------ cities of light */

let cityPts;
const cities = []; // { product, pos (Vector3), region, color }
{
  REGIONS.forEach((reg, ri) => {
    const list = PRODUCTS.filter((p) => p.region === reg.id);
    const faces = pickFaces(ri, list.length, 100 + ri, { minSep: 4.5, minH: 0.06 });
    list.forEach((p, i) => {
      const f = faces[i % faces.length];
      if (!f) return;
      cities.push({ product: p, region: ri, face: f, pos: f.c.clone().multiplyScalar(f.r + 0.004), color: reg.col.clone().lerp(new THREE.Color(1, 1, 1), 0.55) });
    });
  });

  const N = cities.length;
  const p = new Float32Array(N * 3), c = new Float32Array(N * 3), ph = new Float32Array(N);
  const beamPos = [], beamCol = [];
  cities.forEach((ct, i) => {
    p.set([ct.pos.x, ct.pos.y, ct.pos.z], i * 3);
    c.set([ct.color.r, ct.color.g, ct.color.b], i * 3);
    ph[i] = i * 1.7;
    const top = ct.face.c.clone().multiplyScalar(ct.face.r + 0.035 + (i % 3) * 0.012);
    beamPos.push(ct.pos.x, ct.pos.y, ct.pos.z, top.x, top.y, top.z);
    beamCol.push(ct.color.r, ct.color.g, ct.color.b, 0, 0, 0);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(c, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  const cityMat = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPR: { value: renderer.getPixelRatio() }, uHover: { value: -1 }, uSun: { value: sunDir } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPR; uniform float uHover; uniform vec3 uSun;
      attribute vec3 aColor; attribute float aPhase; varying vec3 vC; varying float vP;
      void main(){
        vC = aColor; vP = 0.7 + 0.3 * sin(uTime * 2.2 + aPhase);
        float night = smoothstep(0.15, -0.3, dot(normalize(position), uSun)); vP *= 0.75 + night * 0.75;
        float hov = 1.0 - step(0.5, abs(float(gl_VertexID) - uHover));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = (26.0 + hov * 30.0) * vP * uPR / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `varying vec3 vC; varying float vP;
      void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float core = smoothstep(0.14, 0.0, d); float glow = smoothstep(0.5, 0.0, d) * 0.55;
        gl_FragColor = vec4(vC * (glow + core * 1.4) * vP + core * 0.6, 1.0); }`,
  });
  cityPts = new THREE.Points(g, cityMat);
  cityPts.renderOrder = 3;
  planet.add(cityPts);

  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(beamPos, 3));
  bg.setAttribute('color', new THREE.Float32BufferAttribute(beamCol, 3));
  planet.add(new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
}

/* ------------------------------------------------------------------ flora: what grows on each continent */

const flora = [];
{
  const shapes = [
    () => new THREE.DodecahedronGeometry(0.009, 0), // The Origins: weathered stones
    () => new THREE.IcosahedronGeometry(0.011, 0), // Memory: round glowing shrubs
    () => { const g = new THREE.ConeGeometry(0.005, 0.036, 4); g.translate(0, 0.018, 0); return g; }, // Intelligence: crystal spires
    () => new THREE.BoxGeometry(0.012, 0.012, 0.012), // Creation: building blocks
    () => { const g = new THREE.CylinderGeometry(0.0022, 0.0036, 0.042, 6); g.translate(0, 0.021, 0); return g; }, // The Future: light towers
  ];
  const count = isSmall() || isTouch ? 80 : 150;
  const q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = new THREE.Vector3(), p = new THREE.Vector3(), spin = new THREE.Quaternion();
  const white = new THREE.Color(1, 1, 1), colr = new THREE.Color();
  REGIONS.forEach((reg, ri) => {
    const pool = byRegion[ri].filter((f) => f.h > 0.05);
    if (!pool.length) return;
    const r = rng(500 + ri);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.55, flatShading: true, transparent: true,
      emissive: reg.col, emissiveIntensity: ri === 2 || ri === 4 ? 0.5 : 0.16,
    });
    const mesh = new THREE.InstancedMesh(shapes[ri](), mat, count);
    for (let i = 0; i < count; i++) {
      const f = pool[Math.floor(r() * pool.length)];
      p.copy(f.c).multiplyScalar(f.r - 0.002);
      q.setFromUnitVectors(up, f.c);
      if (ri === 3) spin.setFromEuler(new THREE.Euler(r() * 6, r() * 6, r() * 6)); // blocks tumble where they land
      else spin.setFromAxisAngle(up, r() * Math.PI * 2);
      q.multiply(spin);
      sc.setScalar(0.6 + r() * 0.9);
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);
      if (ri === 3) colr.setHSL(r(), 0.7, 0.62); // building blocks in every colour
      else colr.copy(reg.col).lerp(white, 0.25 + r() * 0.35);
      mesh.setColorAt(i, colr);
    }
    mesh.renderOrder = 2;
    planet.add(mesh);
    flora.push(mesh);
  });
}

/* ------------------------------------------------------------------ beings: little agents who live here */

const beings = [];
const beingMesh = (() => {
  const N = isSmall() || isTouch ? 28 : 46;
  const geo = new THREE.CapsuleGeometry(0.0045, 0.007, 3, 8);
  geo.translate(0, 0.008, 0);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.4, transparent: true }), N);
  const r = rng(808);
  for (let i = 0; i < N; i++) {
    const home = cities[Math.floor(r() * cities.length)];
    beings.push({ from: home, to: home, t: 1, wait: r() * 3, speed: 0.05 + r() * 0.04, phase: r() * 10, q: null, angle: 1, off: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.03) });
    mesh.setColorAt(i, home.color);
  }
  mesh.renderOrder = 3;
  planet.add(mesh);
  return mesh;
})();
const bQ = new THREE.Quaternion(), bM = new THREE.Matrix4(), bS = new THREE.Vector3(1, 1, 1), bP = new THREE.Vector3(), bD = new THREE.Vector3(), bA = new THREE.Vector3();
function surfaceRadius(d) {
  const t = terrain(d.x, d.y, d.z);
  return t.h > 0 ? 1 + elevation(d.x, d.y, d.z, t.h, t.region) : 1.003;
}
function stepBeings(dt, t) {
  beings.forEach((b, i) => {
    if (b.t >= 1) {
      b.wait -= dt;
      if (b.wait <= 0) { // off to the next city, usually a neighbour on the same continent
        const same = cities.filter((c) => c.region === b.to.region && c !== b.to);
        const pool = Math.random() < 0.85 && same.length ? same : cities;
        b.from = b.to;
        b.to = pool[Math.floor(Math.random() * pool.length)];
        b.angle = Math.max(0.05, b.from.pos.angleTo(b.to.pos));
        b.q = new THREE.Quaternion().setFromUnitVectors(b.from.pos.clone().normalize(), b.to.pos.clone().normalize());
        b.t = 0;
        b.wait = 1 + Math.random() * 4;
        beingMesh.setColorAt(i, b.to.color);
        beingMesh.instanceColor.needsUpdate = true;
      }
    } else b.t = Math.min(1, b.t + (b.speed * dt) / b.angle);
    if (b.q && b.t < 1) bD.copy(b.from.pos).normalize().applyQuaternion(bQ.identity().slerp(b.q, b.t));
    else bD.copy(b.to.pos).add(bA.copy(b.off)).normalize(); // mill about near the city
    const walking = b.t < 1;
    const hop = walking ? Math.abs(Math.sin((t + b.phase) * 9)) * 0.008 : Math.abs(Math.sin((t + b.phase) * 2.2)) * 0.002;
    bP.copy(bD).multiplyScalar(surfaceRadius(bD) + hop);
    bQ.setFromUnitVectors(up, bD);
    bM.compose(bP, bQ, bS);
    beingMesh.setMatrixAt(i, bM);
  });
  beingMesh.instanceMatrix.needsUpdate = true;
}

/* ------------------------------------------------------------------ data flights between cities */

{
  const r = rng(5), pos = [], us = [], offs = [], cols = [];
  const SEG = 40, links = Math.min(30, cities.length);
  for (let k = 0; k < links; k++) {
    const a = cities[Math.floor(r() * cities.length)], b = cities[Math.floor(r() * cities.length)];
    if (a === b || a.pos.angleTo(b.pos) < 0.25) continue;
    const off = r(), spd = 0.6 + r() * 0.6;
    const lift = 0.06 + a.pos.angleTo(b.pos) * 0.12;
    const q = new THREE.Quaternion().setFromUnitVectors(a.pos.clone().normalize(), b.pos.clone().normalize());
    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const d = a.pos.clone().normalize().applyQuaternion(new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), q, t));
      pts.push(d.multiplyScalar(1.03 + Math.sin(Math.PI * t) * lift));
    }
    for (let i = 0; i < SEG; i++) {
      [pts[i], pts[i + 1]].forEach((p, j) => {
        pos.push(p.x, p.y, p.z);
        us.push((i + j) / SEG);
        offs.push(off, spd);
        const c = a.color.clone().lerp(b.color, (i + j) / SEG);
        cols.push(c.r, c.g, c.b);
      });
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(us, 1));
  g.setAttribute('aOff', new THREE.Float32BufferAttribute(offs, 2));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(cols, 3));
  planet.add(new THREE.LineSegments(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aU; attribute vec2 aOff; attribute vec3 aColor; varying float vU; varying vec2 vO; varying vec3 vC;
      void main(){ vU = aU; vO = aOff; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; varying float vU; varying vec2 vO; varying vec3 vC;
      void main(){ float head = fract(uTime * 0.18 * vO.y + vO.x);
        float d = head - vU; float pulse = d >= 0.0 ? smoothstep(0.22, 0.0, d) : 0.0;
        gl_FragColor = vec4(vC * (0.07 + pulse * 1.3), 1.0); }`,
  })));
}

/* ------------------------------------------------------------------ crystal peaks: unsolved problems */

const peaks = [];
{
  const coneGeo = new THREE.ConeGeometry(0.03, 0.16, 5, 1);
  coneGeo.translate(0, 0.08, 0);
  const gemGeo = new THREE.OctahedronGeometry(0.02, 0);
  PEAKS.forEach((pk, i) => {
    const ri = REGIONS.findIndex((r) => r.id === pk.region);
    const others = PEAKS.slice(0, i).filter((o) => o.region === pk.region).length;
    const f = pickFaces(ri, others + 1, 300 + ri, { minSep: 9, minH: 0.2, preferHigh: true })[others];
    if (!f) return;
    const col = REGIONS[ri].col;
    const g = new THREE.Group();
    const cone = new THREE.Mesh(coneGeo, new THREE.MeshStandardMaterial({
      color: col.clone().lerp(new THREE.Color(1, 1, 1), 0.6), emissive: col, emissiveIntensity: 0.9, flatShading: true, roughness: 0.3, transparent: true, opacity: 0.92,
    }));
    const gem = new THREE.Mesh(gemGeo, new THREE.MeshBasicMaterial({ color: col.clone().lerp(new THREE.Color(1, 1, 1), 0.4) }));
    gem.position.y = 0.21;
    g.add(cone, gem);
    standOn(g, f, -0.004);
    planet.add(g);
    peaks.push({ ...pk, region: ri, obj: g, gem, pos: f.c.clone().multiplyScalar(f.r + 0.16) });
  });
}

/* ------------------------------------------------------------------ monoliths of the origins */

const monoliths = [];
{
  const ri = REGIONS.findIndex((r) => r.id === 'origins');
  const faces = pickFaces(ri, 7, 77, { minSep: 6, minH: 0.1 });
  const geo = new THREE.BoxGeometry(0.016, 0.075, 0.016);
  geo.translate(0, 0.0375, 0);
  const capGeo = new THREE.BoxGeometry(0.016, 0.006, 0.016);
  faces.forEach((f, i) => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x8a6a3a, emissive: 0x3a2508, roughness: 0.7, flatShading: true })));
    const cap = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ color: 0xffc766 }));
    cap.position.y = 0.077;
    g.add(cap);
    standOn(g, f, -0.003);
    g.rotateY(i * 0.7);
    planet.add(g);
    monoliths.push({ obj: g, cap, pos: f.c.clone().multiplyScalar(f.r + 0.06), entry: HISTORY[Math.round((i / Math.max(1, faces.length - 1)) * (HISTORY.length - 1))] });
  });
}

/* ------------------------------------------------------------------ Realm: the connected moon */

const realmPivot = new THREE.Group();
realmPivot.rotation.set(0.35, 0, 0.2);
scene.add(realmPivot);
const realm = new THREE.Mesh(
  new THREE.SphereGeometry(0.15, 48, 32),
  new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSun: { value: sunDir } },
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV;
      void main(){ vP = position; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal);
        vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: `uniform float uTime; uniform vec3 uSun; varying vec3 vN; varying vec3 vP; varying vec3 vV;
      ${GLSL_NOISE}
      void main(){
        float n = fbm(vP * 9.0 + vec3(0.0, uTime * 0.08, 0.0));
        vec3 a = vec3(0.45, 0.25, 1.0), b = vec3(0.2, 0.9, 1.0), c = vec3(1.0, 0.4, 0.8);
        vec3 col = mix(mix(a, b, smoothstep(0.35, 0.65, n)), c, smoothstep(0.62, 0.8, n));
        float lit = 0.35 + 0.65 * max(dot(vN, uSun), 0.0);
        float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.5);
        gl_FragColor = vec4(col * lit + vec3(0.6, 0.7, 1.0) * fres * 0.9, 1.0);
      }`,
  }),
);
realm.position.set(2.35, 0, 0);
realmPivot.add(realm);
const realmRing = new THREE.Mesh(
  new THREE.TorusGeometry(0.24, 0.003, 8, 96),
  new THREE.MeshBasicMaterial({ color: 0x9fd8ff, transparent: true, opacity: 0.45 }),
);
realmRing.rotation.x = Math.PI / 2.4;
realm.add(realmRing);

/* ------------------------------------------------------------------ Mindaloo AC: the moonlight moon */

// Mindaloo means moonlight. As this moon passes, its light falls across the continents.
const mindalooPivot = new THREE.Group();
mindalooPivot.rotation.set(-0.55, 0, -0.3);
scene.add(mindalooPivot);
const mindaloo = new THREE.Group();
{
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.105, 48, 32),
    new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uSun: { value: sunDir } },
      vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV;
        void main(){ vP = position; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`,
      fragmentShader: `uniform float uTime; uniform vec3 uSun; varying vec3 vN; varying vec3 vP; varying vec3 vV;
        ${GLSL_NOISE}
        void main(){
          float n = fbm(vP * 26.0);
          float maria = smoothstep(0.42, 0.62, fbm(vP * 7.0 + 3.0));
          vec3 silver = vec3(0.93, 0.94, 1.0);
          vec3 shade = vec3(0.62, 0.62, 0.78);
          vec3 col = mix(silver, shade, maria * 0.7) * (0.85 + n * 0.25);
          float lit = 0.45 + 0.55 * max(dot(vN, uSun), 0.0);
          float fres = pow(1.0 - max(dot(vN, vV), 0.0), 2.2);
          float breathe = 0.5 + 0.5 * sin(uTime * 0.8);
          gl_FragColor = vec4(col * lit + vec3(0.78, 0.7, 1.0) * fres * (0.7 + breathe * 0.4), 1.0);
        }`,
    }),
  );
  // soft halo of moonlight
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(225,220,255,0.55)');
  grad.addColorStop(0.35, 'rgba(193,162,255,0.18)');
  grad.addColorStop(1, 'rgba(193,162,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(0.62);
  const light = new THREE.PointLight(0xc9d4ff, 1.4, 4, 2);
  mindaloo.add(halo, body, light);
  mindaloo.userData.body = body;
  mindaloo.userData.halo = halo;
}
mindaloo.position.set(-1.85, 0, 0);
mindalooPivot.add(mindaloo);

/* ------------------------------------------------------------------ The Exchange: the shop, a trading station in orbit */

const SHOP_COLOR = '#FFD27A';
const exchangePivot = new THREE.Group();
exchangePivot.rotation.set(0.85, 0, 0.4);
scene.add(exchangePivot);
const exchange = new THREE.Group();
{
  const hull = new THREE.MeshStandardMaterial({ color: 0xe9ecf5, metalness: 0.55, roughness: 0.35, flatShading: true });
  const steel = new THREE.MeshStandardMaterial({ color: 0x8d93a8, metalness: 0.8, roughness: 0.4, flatShading: true });
  const gold = new THREE.MeshStandardMaterial({ color: 0xffe2a8, emissive: 0xffb84a, emissiveIntensity: 0.8, metalness: 0.5, roughness: 0.3, flatShading: true });
  const solar = new THREE.MeshStandardMaterial({ color: 0x1b2f7a, emissive: 0x0b1a5a, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.25 });
  const station = new THREE.Group();
  const pick = [];
  const add = (mesh, parent = station) => { parent.add(mesh); pick.push(mesh); return mesh; };

  // central market hub, crowned by a glowing gold dome
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.07, 12), hull));
  const dome = add(new THREE.Mesh(new THREE.SphereGeometry(0.019, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gold));
  dome.position.y = 0.035;
  const spire = add(new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 6), steel));
  spire.position.y = 0.064;
  const dish = add(new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.006, 16, 1, true), steel));
  dish.position.set(0.012, 0.058, 0);
  dish.rotation.z = -0.6;
  // docking port below
  const dockNeck = add(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, 0.03, 10), steel));
  dockNeck.position.y = -0.05;
  const dockRing = add(new THREE.Mesh(new THREE.TorusGeometry(0.011, 0.0025, 6, 16), gold));
  dockRing.position.y = -0.066;
  dockRing.rotation.x = Math.PI / 2;

  // rotating habitat ring on spokes, with lit shop pods
  const habitat = new THREE.Group();
  station.add(habitat);
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.007, 8, 48), hull), habitat);
  ring.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) {
    const spoke = add(new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, 0.13, 6), steel), habitat);
    spoke.rotation.z = Math.PI / 2;
    spoke.rotation.y = (i / 3) * Math.PI;
  }
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const pod = add(new THREE.Mesh(new THREE.BoxGeometry(0.011, 0.009, 0.011), gold), habitat);
    pod.position.set(Math.cos(a) * 0.065, 0.006, Math.sin(a) * 0.065);
    pod.rotation.y = -a;
  }

  // long truss with solar wings and navigation lights
  const truss = add(new THREE.Mesh(new THREE.BoxGeometry(0.29, 0.006, 0.006), steel));
  truss.position.y = 0.012;
  const navLights = [];
  [-1, 1].forEach((side) => {
    [0.095, 0.135].forEach((x) => {
      const wing = add(new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.0015, 0.075), solar));
      wing.position.set(side * x, 0.012, 0);
      const frame = add(new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.0012, 0.003), gold));
      frame.position.set(side * x, 0.013, 0);
    });
    const nav = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), new THREE.MeshBasicMaterial({ color: side < 0 ? 0xff4d4d : 0x4dff9a }));
    nav.position.set(side * 0.147, 0.012, 0);
    station.add(nav);
    navLights.push(nav);
  });

  // a cargo shuttle running loops around the station
  const shuttlePath = new THREE.Group();
  const shuttle = new THREE.Group();
  const body = add(new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.007, 0.008), hull), shuttle);
  const nose = add(new THREE.Mesh(new THREE.ConeGeometry(0.0045, 0.01, 6), gold), shuttle);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.013;
  const engine = new THREE.Mesh(new THREE.SphereGeometry(0.003, 8, 6), new THREE.MeshBasicMaterial({ color: 0x8fd3ff }));
  engine.position.x = -0.009;
  shuttle.add(engine);
  shuttle.position.set(0, 0, 0.13);
  shuttle.rotation.y = Math.PI;
  shuttlePath.add(shuttle);
  shuttlePath.rotation.x = 0.35;
  station.add(shuttlePath);
  body.userData.isShuttle = true;

  station.rotation.set(0.45, 0, 0.25); // a three-quarter view so the ring and wings both read
  exchange.add(station);
  exchange.userData = { station, habitat, navLights, shuttlePath, dome, pick };
}
exchange.position.set(1.6, 0, 0);
exchangePivot.add(exchange);

/* ------------------------------------------------------------------ The Beacon: a lighthouse for enquiries and bookings */

const BEACON_COLOR = '#FFF1C9';
const beacon = new THREE.Group();
let beaconPos = new THREE.Vector3(0, 1.2, 0);
{
  const isles = byRegion[UNCH].slice().sort((a, b) => b.h - a.h);
  const f = isles[0] || byRegion[0][0];
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.01, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 }));
  tower.position.y = 0.035;
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0092, 0.012, 12), new THREE.MeshStandardMaterial({ color: 0xc1a2ff, emissive: 0x6a3cff, emissiveIntensity: 0.4 }));
  band.position.y = 0.03;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.008, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff1c9 }));
  lamp.position.y = 0.074;
  const sweep = new THREE.Group();
  sweep.position.y = 0.074;
  const beamGeo = new THREE.ConeGeometry(0.035, 0.32, 24, 1, true);
  beamGeo.translate(0, -0.16, 0);
  beamGeo.rotateZ(Math.PI / 2);
  const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: 0xfff1c9, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  sweep.add(beam);
  beacon.add(tower, band, lamp, sweep);
  beacon.userData.sweep = sweep;
  standOn(beacon, f, -0.003);
  planet.add(beacon);
  beaconPos = f.c.clone().multiplyScalar(f.r + 0.08);
}

/* ------------------------------------------------------------------ Karma Core and the strata of history */

function glowTexture(stops) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  stops.forEach(([o, col]) => grad.addColorStop(o, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

const coreWorld = new THREE.Group();
coreWorld.visible = false;
scene.add(coreWorld);

const SHELL_VS = `varying vec3 vN; varying vec3 vV; varying vec3 vP;
  void main(){ vP = position; vec4 wp = modelMatrix * vec4(position, 1.0); vN = normalize(mat3(modelMatrix) * normal);
    vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }`;

// Going down is going back in time: one glass shell per era, newest on the outside.
const SHELL_R = [0.92, 0.79, 0.66, 0.53, 0.41];
const shells = STRATA.map((st, i) => {
  const m = new THREE.Mesh(new THREE.SphereGeometry(SHELL_R[i], 72, 48), new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uColor: { value: new THREE.Color(st.color) }, uAlpha: { value: 0 }, uHi: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: SHELL_VS,
    fragmentShader: `uniform float uTime; uniform vec3 uColor; uniform float uAlpha; uniform float uHi;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${GLSL_NOISE}
      void main(){
        float fres = pow(1.0 - abs(dot(vN, vV)), 2.4);
        float warp = fbm(vP * 5.0 + ${i}.0);
        float bands = smoothstep(0.6, 1.0, 0.5 + 0.5 * sin(vP.y * 46.0 + warp * 7.0));
        float drift = 0.5 + 0.5 * sin(uTime * 0.6 + warp * 6.0);
        float a = (0.006 + fres * 0.24 + bands * 0.03 * drift) * (1.0 + uHi * 1.3);
        gl_FragColor = vec4(uColor * a * uAlpha, 1.0);
      }`,
  }));
  m.renderOrder = 6;
  coreWorld.add(m);
  return m;
});

const coreBall = new THREE.Mesh(new THREE.SphereGeometry(0.24, 64, 48), new THREE.ShaderMaterial({
  uniforms: { uTime: U.uTime, uBeat: { value: 0 } },
  vertexShader: SHELL_VS,
  fragmentShader: `uniform float uTime; uniform float uBeat; varying vec3 vN; varying vec3 vV; varying vec3 vP;
    ${GLSL_NOISE}
    void main(){
      vec3 p = vP * 7.0;
      float n = fbm(p + vec3(uTime * 0.35, -uTime * 0.25, uTime * 0.2));
      float n2 = fbm(p * 1.7 - vec3(uTime * 0.2));
      float facing = abs(dot(vN, vV));
      vec3 deep = vec3(0.55, 0.36, 1.0), lilac = vec3(0.82, 0.72, 1.0), white = vec3(1.0, 0.98, 1.0);
      vec3 col = mix(deep, lilac, n);
      col = mix(col, white, clamp(smoothstep(0.55, 0.85, n2) * 0.8 + pow(facing, 3.0) * 0.5, 0.0, 1.0));
      gl_FragColor = vec4(col * (1.0 + uBeat * 0.55), 1.0);
    }`,
}));
coreBall.renderOrder = 7;
coreWorld.add(coreBall);
const coreHalo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture([[0, 'rgba(240,230,255,0.9)'], [0.3, 'rgba(193,162,255,0.35)'], [1, 'rgba(120,80,255,0)']]),
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
coreHalo.scale.setScalar(1.05);
coreHalo.renderOrder = 7;
coreWorld.add(coreHalo);
const coreLight = new THREE.PointLight(0xc9b5ff, 0, 3, 2);
coreWorld.add(coreLight);

// The Karma knot (from the Mindaloo AC emblem), turning slowly around the heart.
const knot = new THREE.LineLoop(
  new THREE.BufferGeometry().setFromPoints(
    [[25, 10], [50, 35], [75, 10], [90, 25], [65, 50], [90, 75], [75, 90], [50, 65], [25, 90], [10, 75], [35, 50], [10, 25]]
      .map(([x, y]) => new THREE.Vector3((x - 50) / 50 * 0.34, (50 - y) / 50 * 0.34, 0)),
  ),
  new THREE.LineBasicMaterial({ color: 0xc1a2ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
);
knot.renderOrder = 7;
coreWorld.add(knot);

// The six forces of C = P × M × E × R × I / N, each on its own orbit.
const forces = CORE.forces.map(([k, , , color], i) => {
  const pivot = new THREE.Group();
  pivot.rotation.set(i * 0.9, i * 1.3, i * 0.5);
  const spin = new THREE.Group();
  pivot.add(spin);
  const r = 0.33 + (i % 3) * 0.035;
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 12), new THREE.MeshBasicMaterial({ color }));
  orb.position.x = r;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.0016, 4, 120), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.rotation.x = Math.PI / 2;
  spin.add(orb, ring);
  coreWorld.add(pivot);
  return { k, spin, orb, ring, speed: (0.45 + i * 0.12) * (i % 2 ? -1 : 1) };
});

// Threads of light rising from the core to every city.
const threads = (() => {
  const pos = [], us = [], cols = [], seeds = [];
  const SEG = 18;
  cities.forEach((c, ci) => {
    const dir = c.pos.clone().normalize();
    const len = c.pos.length();
    for (let s = 0; s < SEG; s++) {
      [s, s + 1].forEach((j) => {
        const t = j / SEG;
        const p = dir.clone().multiplyScalar(0.24 + t * (len - 0.24));
        pos.push(p.x, p.y, p.z);
        us.push(t);
        cols.push(c.color.r, c.color.g, c.color.b);
        seeds.push((ci * 0.618) % 1);
      });
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(us, 1));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(cols, 3));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seeds, 1));
  const l = new THREE.LineSegments(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uAlpha: { value: 0 } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aU; attribute vec3 aColor; attribute float aSeed; varying float vU; varying vec3 vC; varying float vS;
      void main(){ vU = aU; vC = aColor; vS = aSeed; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uAlpha; varying float vU; varying vec3 vC; varying float vS;
      void main(){ float head = fract(uTime * 0.32 + vS); float d = head - vU;
        float pulse = d >= 0.0 ? smoothstep(0.18, 0.0, d) : 0.0;
        vec3 c = mix(vec3(0.85, 0.75, 1.0), vC, vU);
        gl_FragColor = vec4(c * (0.1 + pulse * 1.3) * uAlpha, 1.0); }`,
  }));
  l.renderOrder = 6;
  coreWorld.add(l);
  return l;
})();

let coreTarget = 0, coreMix = 0;
const ss = (x, a, b) => THREE.MathUtils.smoothstep(x, a, b);
function applyCore(m, t) {
  coreWorld.visible = m > 0.005;
  land.material.opacity = 1 - m * 0.95;
  land.material.depthWrite = m < 0.05;
  ocean.material.uniforms.uAlpha.value = 1 - m * 0.94;
  ocean.material.depthWrite = m < 0.05;
  clouds.material.uniforms.uFade.value = 1 - m;
  peaks.forEach((p) => { p.obj.visible = m < 0.5; });
  flora.forEach((f) => { f.visible = m < 0.5; });
  beingMesh.visible = m < 0.5;
  monoliths.forEach((o) => { o.obj.visible = m < 0.5; });
  shells.forEach((sh, i) => { sh.material.uniforms.uAlpha.value = ss(m, i * 0.1, i * 0.1 + 0.45); });
  const beat = Math.pow(Math.max(0, Math.sin(t * 3.9)), 12) + 0.6 * Math.pow(Math.max(0, Math.sin(t * 3.9 - 0.9)), 12);
  const grow = 0.3 + 0.7 * ss(m, 0.3, 1);
  coreBall.scale.setScalar(grow * (1 + beat * 0.05));
  coreBall.material.uniforms.uBeat.value = beat;
  coreHalo.scale.setScalar(1.7 * grow * (1 + beat * 0.2));
  coreHalo.material.opacity = ss(m, 0.2, 0.8);
  coreLight.intensity = ss(m, 0.3, 1) * (1.2 + beat * 0.8);
  knot.material.opacity = ss(m, 0.5, 1) * 0.55;
  knot.quaternion.copy(camera.quaternion);
  knot.rotateZ(t * 0.12);
  forces.forEach((f) => { f.spin.rotation.y = t * f.speed; f.orb.material.opacity = 1; f.ring.material.opacity = 0.22 * ss(m, 0.5, 1); f.orb.visible = m > 0.4; });
  threads.material.uniforms.uAlpha.value = ss(m, 0.55, 1);
}

/* ------------------------------------------------------------------ spin it hard enough and the ocean spills */

// A distant sun, so the world visibly turns through day and night.
const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTexture([[0, 'rgba(255,250,235,1)'], [0.12, 'rgba(255,230,180,0.85)'], [0.4, 'rgba(255,190,120,0.18)'], [1, 'rgba(255,160,90,0)']]),
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
}));
sunGlow.scale.setScalar(9);
scene.add(sunGlow);

const seabed = new THREE.Mesh(new THREE.SphereGeometry(0.975, 96, 64), new THREE.MeshStandardMaterial({ color: 0x7a6a8e, roughness: 0.95, emissive: 0x2a2140, emissiveIntensity: 0.9 }));
seabed.visible = false;
planet.add(seabed);

const eggMeshes = [0, 1, 2].map(() => {
  const g = new THREE.Group();
  const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.02, 0), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd27a, emissiveIntensity: 1, flatShading: true }));
  gem.position.y = 0.03;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.016, 0.012, 8), new THREE.MeshStandardMaterial({ color: 0x8d93a8, metalness: 0.6, roughness: 0.4 }));
  plinth.position.y = 0.006;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,240,200,0.9)'], [0.4, 'rgba(255,200,120,0.25)'], [1, 'rgba(255,180,90,0)']]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.position.y = 0.03;
  halo.scale.setScalar(0.12);
  g.add(plinth, gem, halo);
  g.visible = false;
  g.userData = { gem, egg: null, pos: new THREE.Vector3() };
  planet.add(g);
  return g;
});
const eggsFound = (() => { try { return new Set(JSON.parse(localStorage.getItem('td1-eggs') || '[]')); } catch (e) { return new Set(); } })();
function saveEggs() { try { localStorage.setItem('td1-eggs', JSON.stringify([...eggsFound])); } catch (e) { /* storage blocked: fine */ } }

// splashes: spray that flies off the coasts and falls back
const SPLASH_N = 900;
const splash = (() => {
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(SPLASH_N * 3);
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aLife', new THREE.BufferAttribute(new Float32Array(SPLASH_N), 1));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uPR: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aLife; uniform float uPR; varying float vL;
      void main(){ vL = aLife; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = (4.0 + 10.0 * aLife) * uPR / -mv.z * 2.0; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vL; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vL <= 0.0) discard;
        gl_FragColor = vec4(mix(vec3(0.45, 0.75, 1.0), vec3(1.0), vL) * smoothstep(0.5, 0.0, d) * vL, 1.0); }`,
  }));
  pts.renderOrder = 4;
  pts.frustumCulled = false;
  planet.add(pts);
  return { pts, pos, life: g.attributes.aLife.array, vel: new Float32Array(SPLASH_N * 3), next: 0 };
})();
const coastFaces = landFaces.filter((f) => f.h > 0 && f.h < 0.05);
function spray(origin, out, count, power) {
  for (let i = 0; i < count; i++) {
    const k = splash.next = (splash.next + 1) % SPLASH_N;
    const jitter = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(0.02);
    const p = origin.clone().add(jitter);
    splash.pos.set([p.x, p.y, p.z], k * 3);
    const v = origin.clone().normalize().multiplyScalar(power * (0.4 + Math.random() * 0.8))
      .add(out.clone().multiplyScalar(power * (0.3 + Math.random() * 0.7)))
      .add(new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(power * 0.6));
    splash.vel.set([v.x, v.y, v.z], k * 3);
    splash.life[k] = 1;
  }
}

// toasts
const toastEl = document.createElement('div');
toastEl.id = 'toast';
toastEl.setAttribute('role', 'status');
document.body.appendChild(toastEl);
let toastTimer = 0;
function toast(msg, ms = 3200) {
  toastEl.textContent = msg;
  toastEl.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('on'), ms);
}
const frenzyEl = document.createElement('div');
frenzyEl.id = 'frenzy';
document.body.appendChild(frenzyEl);

const spill = { active: false, t0: 0, drain: 0, holdUntil: 0, strength: 0, warned: false };
function startSpill(strength) {
  if (reduceMotion) return;
  const oc = ocean.material.uniforms;
  // the water keeps moving the way the surface was moving when the world stopped
  const camDir = camera.position.clone().normalize();
  const dir = new THREE.Vector3().crossVectors(spin.axisWorld, camDir);
  if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0);
  dir.normalize();
  oc.uSloshDir.value.copy(dir);
  oc.uSlosh.value = Math.min(1, 0.5 + strength);
  oc.uSloshAge.value = 0;
  // splash hard against the coasts, heaviest on the side the water rushes toward
  const front = coastFaces.filter((f) => f.c.dot(camDir) > 0.1);
  for (let i = 0; i < 70 && front.length; i++) {
    const f = front[Math.floor(Math.random() * front.length)];
    const weight = Math.max(0.15, f.c.dot(dir) + 0.6);
    spray(f.c.clone().multiplyScalar(f.r + 0.004), dir, Math.round(6 * weight), 0.5 * weight);
    if (i % 6 === 0) spawnRipple(f.c, '#9fe8ff');
  }
  // open three patches of seabed in view, each guarding an Easter egg
  const r = Math.random;
  const spots = [];
  for (let tries = 0; spots.length < 3 && tries < 4000; tries++) {
    const d = camDir.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(1.5)).normalize();
    if (d.dot(camDir) < 0.45) continue;
    if (terrain(d.x, d.y, d.z).h > -0.12) continue;
    if (spots.some((o) => o.dot(d) > Math.cos(0.32))) continue;
    spots.push(d);
  }
  const order = [...EGGS.filter((e) => !eggsFound.has(e.id)), ...EGGS.filter((e) => eggsFound.has(e.id))];
  const offset = Math.floor(r() * 3);
  eggMeshes.forEach((m, i) => {
    const d = spots[i];
    oc.uHoles.value[i].copy(d || new THREE.Vector3(0, 9, 0));
    if (!d) { m.userData.egg = null; return; }
    m.position.copy(d).multiplyScalar(0.975);
    m.quaternion.setFromUnitVectors(up, d);
    m.userData.pos.copy(d).multiplyScalar(1.01);
    m.userData.egg = order[(i + offset) % Math.min(order.length, 3 + offset)] || order[i];
  });
  spill.active = true;
  spill.t0 = performance.now();
  spill.holdUntil = spill.t0 + 30000;
  spill.strength = strength;
  toast('The Ocean of Data spilled! Find what it left behind.');
}
function grab() { // catching the world mid-spin stops it dead
  const speed = spin.w.length();
  if (spin.energy > 0.45 && speed > 3) { startSpill(spin.energy); spin.energy = 0; }
  spin.w.set(0, 0, 0);
}
function stepSpin(dt, t, now) {
  if (spin.enabled) {
    if (!spin.dragging) {
      turnCamera(spin.w.x * dt, spin.w.y * dt, spin.w.z * dt);
      spin.w.multiplyScalar(Math.exp(-dt * (spin.energy > 0.3 ? 0.45 : 1.25)));
      // left alone, it turns on a tilted axis like Earth
      const idle = THREE.MathUtils.clamp((now - lastInteract - 3000) / 4000, 0, 1);
      if (!selected && !reduceMotion && idle > 0) {
        _sq.setFromAxisAngle(EARTH_AXIS, -0.06 * dt * idle);
        spin.q.premultiply(_sq);
      }
    }
    spin.dist += (spin.target - spin.dist) * (1 - Math.exp(-dt * 8));
    placeCamera();
  }
  // track how wildly it is spinning
  const speed = spin.w.length();
  if (speed > 0.01) spin.axisWorld.copy(spin.w).applyQuaternion(spin.q).normalize().negate();
  if (!reduceMotion && speed > 5.5) spin.energy = Math.min(1, spin.energy + dt * 0.55);
  else spin.energy = Math.max(0, spin.energy - dt * (speed > 3 ? 0.08 : 0.3));
  if (spin.energy > 0.7 && !spill.warned) { spill.warned = true; toast('Whoa. The oceans are getting dizzy…', 2400); }
  if (spin.energy < 0.2) spill.warned = false;
  // let it wind down on its own from a wild spin and the water still sloshes
  if (spin.energy > 0.6 && speed < 2.2 && !spin.dragging) { startSpill(spin.energy * 0.75); spin.energy = 0; }
}
function stepSpill(dt, t) {
  const oc = ocean.material.uniforms;
  oc.uSloshAge.value += dt;
  oc.uSpin.value += (Math.min(1, spin.energy * 1.2) - oc.uSpin.value) * 0.1;
  oc.uSpinAxis.value.copy(spin.axisWorld);
  frenzyEl.style.opacity = (spin.energy * 0.85).toFixed(3);
  const now = performance.now();
  if (spill.active) {
    const opening = Math.min(1, (now - spill.t0) / 1600);
    const closing = now > spill.holdUntil && !(selected && selected.kind === 'egg') ? Math.min(1, (now - spill.holdUntil) / 3500) : 0;
    spill.drain = ease(opening) * (1 - ease(closing));
    if (closing >= 1) spill.active = false;
  } else spill.drain = 0;
  oc.uDrain.value = spill.drain;
  seabed.visible = spill.drain > 0.001 && coreMix < 0.05;
  eggMeshes.forEach((m, i) => {
    m.visible = Boolean(m.userData.egg) && spill.drain > 0.25 && coreMix < 0.05;
    m.userData.gem.rotation.y = t * 1.6 + i;
    m.userData.gem.position.y = 0.03 + Math.sin(t * 2 + i) * 0.006;
    m.userData.gem.material.emissive.setHSL((t * 0.15 + i / 3) % 1, 0.9, 0.55);
    m.scale.setScalar(Math.max(0.001, (spill.drain - 0.25) / 0.75));
  });
  // spray physics: pulled back to the surface
  for (let i = 0; i < SPLASH_N; i++) {
    if (splash.life[i] <= 0) continue;
    const k = i * 3;
    const px = splash.pos[k], py = splash.pos[k + 1], pz = splash.pos[k + 2];
    const len = Math.hypot(px, py, pz);
    splash.vel[k] -= (px / len) * 2.4 * dt; splash.vel[k + 1] -= (py / len) * 2.4 * dt; splash.vel[k + 2] -= (pz / len) * 2.4 * dt;
    splash.pos[k] += splash.vel[k] * dt; splash.pos[k + 1] += splash.vel[k + 1] * dt; splash.pos[k + 2] += splash.vel[k + 2] * dt;
    splash.life[i] -= dt * 0.7;
    if (Math.hypot(splash.pos[k], splash.pos[k + 1], splash.pos[k + 2]) < 1.0) splash.life[i] = 0;
  }
  splash.pts.geometry.attributes.position.needsUpdate = true;
  splash.pts.geometry.attributes.aLife.needsUpdate = true;
}
function eggHtml(egg) {
  const n = eggsFound.size;
  return header({ name: egg.title, era: `Easter egg · ${n} of ${EGGS.length} found`, color: '#FFD27A', tagline: n === EGGS.length ? 'You found every egg on the seabed.' : 'Washed up when the ocean spilled.', intro: egg.text })
    + (egg.cta ? '<section><button type="button" class="cta" data-go="contact">Send TD1 a signal</button></section>' : '')
    + `<section><p class="sub">Spin the world hard again to spill the ocean somewhere new.</p></section>`;
}
function openEgg(m) {
  const egg = m.userData.egg;
  if (!egg) return;
  if (!eggsFound.has(egg.id)) { eggsFound.add(egg.id); saveEggs(); }
  selected = { kind: 'egg' };
  spill.holdUntil = Math.max(spill.holdUntil, performance.now() + 15000);
  flyTo(m.userData.pos, fitDist(0.5, 2.0));
  openPanel(eggHtml(egg), '#FFD27A');
  setDock(null);
}

/* ------------------------------------------------------------------ labels */

const labelLayer = $('#labels');
const labels = [];
function addLabel(html, cls, getPos, onClick, opts = {}) {
  const el = document.createElement('button');
  el.className = `label ${cls}`;
  el.innerHTML = html;
  el.type = 'button';
  el.addEventListener('click', (e) => { e.stopPropagation(); onClick(); });
  labelLayer.appendChild(el);
  labels.push({ el, getPos, surface: opts.surface !== false, layer: opts.layer || 'world' });
  return el;
}
REGIONS.forEach((r, i) => {
  const p = r.dir.clone().multiplyScalar(1.14);
  const el = addLabel(`<span class="era">${r.era}</span><span class="nm">${r.name}</span>`, 'region', () => p, () => selectRegion(i));
  el.style.setProperty('--c', r.color);
});
addLabel('<span class="nm">Realm</span><span class="era">Connected world</span>', 'moon', () => realm.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.24, 0)), () => openSpecial('realm'), { surface: false });
const camAxis = (col) => new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, col);
STRATA.forEach((st, i) => {
  const el = addLabel(`<span class="era">${st.span}</span><span class="nm">${st.name}</span>`, 'stratum', () => {
    const a = (62 - i * 15) * DEG;
    return camAxis(0).multiplyScalar(Math.cos(a)).add(camAxis(1).multiplyScalar(Math.sin(a))).normalize().multiplyScalar(SHELL_R[i]);
  }, () => focusStratum(i), { layer: 'core' });
  el.style.setProperty('--c', st.color);
});
addLabel(`<span class="nm">${CORE.name}</span><span class="era">Consciousness</span>`, 'core-label', () => camAxis(1).multiplyScalar(-0.42), () => enterCore(), { layer: 'core' });
CORE.forces.forEach(([k, , , color], i) => {
  const el = addLabel(`<span class="nm">${k}</span>`, 'force', () => forces[i].orb.getWorldPosition(new THREE.Vector3()), () => enterCore(), { layer: 'core' });
  el.style.setProperty('--c', color);
});
addLabel('<span class="nm">The Exchange</span><span class="era">Shop</span>', 'moon shop', () => exchange.getWorldPosition(new THREE.Vector3()).add(camAxis(1).multiplyScalar(0.2)), () => openShop(), { surface: false });
addLabel('<span class="era">Contact &amp; bookings</span><span class="nm">The Beacon</span>', 'beacon', () => beaconPos.clone().add(beaconPos.clone().normalize().multiplyScalar(0.05)), () => openContact(), {});
addLabel('<span class="nm">Mindaloo AC</span><span class="era">Flagship · Moonlight</span>', 'moon mindaloo', () => mindaloo.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.19, 0)), () => openSpecial('mindaloo'), { surface: false });

/* ------------------------------------------------------------------ camera flights */

let flight = null;
let lastInteract = performance.now();
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function flyTo(dir, dist = 2.15, dur = 1700) {
  const fromDir = camera.position.clone().normalize();
  const toDir = dir.clone().normalize();
  // keep the camera off the exact poles so "up" stays stable
  toDir.y = Math.max(-0.92, Math.min(0.92, toDir.y));
  toDir.normalize();
  flight = { fromDir, toDir, fromDist: camera.position.length(), toDist: dist, t0: performance.now(), dur: reduceMotion ? 1 : dur };
  spin.w.set(0, 0, 0);
  spin.enabled = false;
}
function stepFlight(now) {
  if (!flight) return;
  const t = Math.min(1, (now - flight.t0) / flight.dur);
  const e = ease(t);
  const q = new THREE.Quaternion().setFromUnitVectors(flight.fromDir, flight.toDir);
  const dir = flight.fromDir.clone().applyQuaternion(new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), q, e));
  const hop = Math.sin(Math.PI * t) * Math.min(0.9, flight.fromDir.angleTo(flight.toDir) * 0.45);
  camera.position.copy(dir.multiplyScalar(THREE.MathUtils.lerp(flight.fromDist, flight.toDist, e) + hop));
  camera.lookAt(0, 0, 0);
  if (t >= 1) { flight = null; spin.enabled = true; syncSpin(); }
}

/* ------------------------------------------------------------------ panel */

const panel = $('#panel');
const panelBody = $('#panel-body');
let selected = null; // { kind, index }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function header(o, kicker) {
  return `<header class="ph" style="--c:${o.color}">
    <p class="kicker">${esc(kicker || o.era)}</p>
    <h2>${esc(o.name)}</h2>
    <p class="tag">${esc(o.tagline)}</p>
  </header><p class="intro">${esc(o.intro)}</p>`;
}
function citiesHtml(ri) {
  const list = cities.map((c, i) => ({ ...c, i })).filter((c) => c.region === ri);
  if (!list.length) return '';
  return `<section><h3>Cities of light <span class="count">${list.length}</span></h3>
    <p class="sub">Each glowing city is a TD1 product: a ready-made block of code that saves builders weeks.</p>
    <ul class="cities">${list.map((c) => `
      <li><button type="button" class="city" data-city="${c.i}">
        <span class="cn">${esc(c.product.name)}</span><span class="cd">${esc(c.product.desc)}</span></button>
        ${c.product.demo ? `<a class="demo" href="/${c.product.demo}" target="_blank" rel="noopener">Demo ↗</a>` : ''}
      </li>`).join('')}</ul></section>`;
}
function peaksHtml(ri) {
  const list = peaks.map((p, i) => ({ ...p, i })).filter((p) => p.region === ri);
  if (!list.length) return '';
  return `<section><h3>Peaks still unclimbed</h3>
    <p class="sub">Crystal mountains mark problems the field has not solved yet.</p>
    <ul class="peaks">${list.map((p) => `<li data-peak="${p.i}"><b>${esc(p.name)}</b><span>${esc(p.text)}</span></li>`).join('')}</ul></section>`;
}
function notesHtml(id) {
  const n = NOTES[id];
  if (!n) return '';
  return `<section><ul class="notes">${n.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul></section>`;
}
function regionHtml(ri) {
  const r = REGIONS[ri];
  let extra = '';
  if (r.id === 'origins') {
    extra = `<section><h3>A short history of thinking machines</h3>
      <ol class="timeline">${HISTORY.map(([y, t, d]) => `<li><span class="yr">${esc(y)}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('')}</ol>
      <p class="sub next">Now fly east to <button type="button" class="jump" data-region="1">Memory</button> to see what all this is built on.</p>
      <button type="button" class="cta" data-go="core">Descend beneath the surface ↓</button></section>`;
  }
  if (r.id === 'future') {
    extra = acHtml(true) + `<section><h3>Projections</h3><ul class="horizons">${HORIZONS.map(([h, t, d]) => `<li><span class="hz hz-${h.toLowerCase()}">${esc(h)}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('')}</ul></section>`;
  }
  return header(r) + notesHtml(r.id) + extra + peaksHtml(ri) + citiesHtml(ri);
}
function acHtml(withLink) {
  return `<section><h3>TD1’s direction</h3><ol class="ac-path">${AC_PATH.map(([k, n, d], i) => `<li class="${k === 'AC' ? 'is-ac' : ''}"><span class="ak">${esc(k)}</span><div><b>${esc(n)}</b><span>${esc(d)}</span></div></li>`).join('')}</ol>
    ${withLink ? '<button type="button" class="cta" data-go="mindaloo">Meet Mindaloo AC, the first AC</button>' : ''}</section>`;
}
/* shop */
const shopCache = {};
let shopTab = SHOP.sections[0].id;
const money = (a) => { try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: a.currencyCode }).format(+a.amount); } catch (e) { return `${a.amount} ${a.currencyCode}`; } };
async function loadSection(sec) {
  if (shopCache[sec.id]) return shopCache[sec.id];
  const query = `query($h: String!) { collection(handle: $h) { products(first: 24) { nodes {
      title handle onlineStoreUrl featuredImage { url altText }
      priceRange { minVariantPrice { amount currencyCode } } } } } }`;
  const res = await fetch(`https://${SHOP.domain}/api/2024-07/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': SHOP.storefrontToken },
    body: JSON.stringify({ query, variables: { h: sec.handle } }),
  });
  if (!res.ok) throw new Error(`Shopify answered ${res.status}`);
  const json = await res.json();
  return (shopCache[sec.id] = json.data?.collection?.products?.nodes || []);
}
const shopLive = () => Boolean(SHOP.domain && SHOP.storefrontToken);
function shopHtml() {
  const tabs = SHOP.sections.map((s) => `<button type="button" class="tab${s.id === shopTab ? ' on' : ''}" data-shop-tab="${s.id}">${esc(s.name)}</button>`).join('');
  return header({ name: 'The Exchange', era: 'Shop', color: SHOP_COLOR, tagline: 'Courses, documents and TD1 clothing.', intro: 'A trading station in orbit around the world. Everything here is made by TD1 to help you build, learn and wear the future.' })
    + `<section><div class="tabs" role="tablist">${tabs}</div><div id="shop-list" class="shop-list"></div>
      ${SHOP.storeUrl ? `<a class="cta ghost" href="${esc(SHOP.storeUrl)}" target="_blank" rel="noopener">Open the full store ↗</a>` : ''}</section>`;
}
async function renderShop() {
  const box = panelBody.querySelector('#shop-list');
  if (!box) return;
  const sec = SHOP.sections.find((s) => s.id === shopTab);
  panelBody.querySelectorAll('[data-shop-tab]').forEach((b) => b.classList.toggle('on', b.dataset.shopTab === shopTab));
  if (!shopLive()) {
    box.innerHTML = `<div class="shop-empty"><b>${esc(sec.name)} are on their way.</b><span>${esc(sec.text)} The Exchange is being stocked now.</span>
      <button type="button" class="cta" data-go="notify">Tell me when it opens</button></div>`;
    return;
  }
  box.innerHTML = '<p class="sub">Loading…</p>';
  try {
    const items = await loadSection(sec);
    if (shopTab !== sec.id) return;
    box.innerHTML = items.length
      ? `<ul class="goods">${items.map((p) => `<li><a href="${esc(p.onlineStoreUrl || `${SHOP.storeUrl}/products/${p.handle}`)}" target="_blank" rel="noopener">
          ${p.featuredImage ? `<img src="${esc(p.featuredImage.url)}&width=400" alt="${esc(p.featuredImage.altText || p.title)}" loading="lazy">` : '<span class="noimg"></span>'}
          <b>${esc(p.title)}</b><span>${esc(money(p.priceRange.minVariantPrice))}</span></a></li>`).join('')}</ul>`
      : `<div class="shop-empty"><b>Nothing in ${esc(sec.name)} yet.</b><span>${esc(sec.text)}</span></div>`;
  } catch (e) {
    box.innerHTML = `<div class="shop-empty"><b>The shop didn’t answer.</b><span>Check your connection and try again. If it keeps happening, the store link may need updating.</span></div>`;
  }
}

/* enquiries and bookings */
function contactHtml(prefill = {}) {
  const opt = (list, sel) => list.map((t) => `<option${t === sel ? ' selected' : ''}>${esc(t)}</option>`).join('');
  const type = prefill.type || ENQUIRY.types[0];
  return header({ name: 'The Beacon', era: 'Contact & bookings', color: BEACON_COLOR, tagline: 'Send a signal. TD1 will answer.', intro: 'Ask a question, start a project, or book time with TD1’s expertise. Tell us a little about what you need and when suits you.' })
    + `<section><form id="enquiry" class="enquiry" novalidate>
      <p hidden><label>Leave this empty <input name="bot-field" id="f-bot"></label></p>
      <label for="f-type">What’s this about?</label>
      <select id="f-type" name="type">${opt(ENQUIRY.types, type)}</select>
      <div class="f-book"${type === 'Book expertise' ? '' : ' hidden'}>
        <label for="f-expertise">Expertise</label>
        <select id="f-expertise" name="expertise">${opt(ENQUIRY.expertise)}</select>
        <div class="f-row">
          <div><label for="f-date">Preferred date</label><input id="f-date" name="date" type="date"></div>
          <div><label for="f-time">Time of day</label><select id="f-time" name="time"><option>Any time</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>
        </div>
      </div>
      <div class="f-row">
        <div><label for="f-name">Your name</label><input id="f-name" name="name" autocomplete="name" required></div>
        <div><label for="f-email">Email</label><input id="f-email" name="email" type="email" autocomplete="email" required></div>
      </div>
      <label for="f-company">Company <span class="opt">(optional)</span></label>
      <input id="f-company" name="company" autocomplete="organization">
      <label for="f-message">Message</label>
      <textarea id="f-message" name="message" rows="4" required>${esc(prefill.message || '')}</textarea>
      <p class="f-error" role="alert" hidden></p>
      <button type="submit" class="cta">Send signal</button>
      ${ENQUIRY.bookingUrl ? `<a class="cta ghost" href="${esc(ENQUIRY.bookingUrl)}" target="_blank" rel="noopener">Or pick a time now ↗</a>` : ''}
    </form></section>`;
}
async function sendEnquiry(form) {
  const err = form.querySelector('.f-error');
  const data = new FormData(form);
  err.hidden = true;
  if (!data.get('name').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.get('email')) || !data.get('message').trim()) {
    err.textContent = 'Add your name, a valid email and a message, then send again.';
    err.hidden = false;
    return;
  }
  if (data.get('type') !== 'Book expertise') ['expertise', 'date', 'time'].forEach((k) => data.delete(k));
  data.append('form-name', 'enquiry');
  try { data.append('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone); } catch (e) { /* not essential */ }
  const btn = form.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
    if (!res.ok) throw new Error(String(res.status));
    form.outerHTML = `<div class="sent"><b>Signal received.</b><span>TD1 will reply to ${esc(data.get('email'))}.</span></div>`;
    beaconFlash = 1;
  } catch (e) {
    btn.disabled = false;
    btn.textContent = 'Send signal';
    err.textContent = 'That didn’t send. Check your connection and try again.';
    err.hidden = false;
  }
}
let beaconFlash = 0;

function coreHtml() {
  const forcesHtml = CORE.forces.map(([k, n, d, c]) => `<li style="--fc:${c}"><span class="fk">${esc(k)}</span><div><b>${esc(n)}</b><span>${esc(d)}</span></div></li>`).join('');
  const strataHtml = STRATA.map((st, i) => `<li class="stratum" data-stratum="${i}" style="--sc:${st.color}">
      <button type="button" class="st-h" data-stratum-btn="${i}"><span class="st-depth">Layer ${i + 1}</span><b>${esc(st.name)}</b><span class="st-span">${esc(st.span)}</span></button>
      <ol class="timeline">${HISTORY.slice(st.from, st.to + 1).map(([y, t, d]) => `<li><span class="yr">${esc(y)}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('')}</ol></li>`).join('');
  return header(CORE)
    + `<section><h3>The formula</h3><p class="formula">${esc(CORE.formula)}</p>
      <p class="sub">Karma Core's live consciousness score, as computed inside Mindaloo AC. Six forces orbit the heart.</p>
      <ul class="forces">${forcesHtml}</ul></section>
      <section><h3>The descent</h3><p class="sub">Every layer you passed on the way down is an era of AI history. The deeper the layer, the older it is.</p>
      <ol class="strata">${strataHtml}</ol></section>
      <section class="actions"><button type="button" class="cta" data-go="mindaloo">Visit its moon, Mindaloo AC</button>
      <button type="button" class="cta ghost" data-go="surface">Return to the surface ↑</button></section>`;
}
function oceanHtml() {
  return header(OCEAN) + `<section><ul class="notes">${OCEAN.facts.map(([t, d]) => `<li><b>${esc(t)}</b><span>${esc(d)}</span></li>`).join('')}</ul></section>`;
}
function specialHtml(kind) {
  if (kind === 'realm') {
    return header({ name: 'Realm', era: 'A connected world', color: '#7FD8FF', tagline: 'The Conscious Network.', intro: 'Realm orbits TD1.WORLD as its own moon: a separate world with its own rules, linked to this one. Step through to explore it.' })
      + `<a class="cta" href="${REALM_URL}">Enter Realm →</a>`;
  }
  if (kind === 'mindaloo') {
    return header({ name: 'Mindaloo AC', era: 'Moonlight · TD1 flagship', color: '#D9CCFF', tagline: 'Autonomous Consciousness, powered by Karma Core.', intro: 'Mindaloo means moonlight, and AC stands for Autonomous Consciousness. Mindaloo AC is TD1’s flagship: a sovereign AI with its own lasting identity and memory, a spatial canvas of agents that work together, and Karma Core at its heart. As it orbits, its light falls across every continent.' })
      + acHtml(false)
      + (MINDALOO_URL
        ? `<a class="cta" href="${MINDALOO_URL}" target="_blank" rel="noopener">Visit Mindaloo AC ↗</a>`
        : '<span class="cta off" aria-disabled="true">Link coming soon</span>');
  }
  return '';
}

function openPanel(html, color) {
  panelBody.innerHTML = html;
  panelBody.scrollTop = 0;
  panel.style.setProperty('--c', color || '#C1A2FF');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  $('#intro').classList.add('gone');
}
function openShop(tab) {
  exitCore();
  selected = { kind: 'shop' };
  land.material.userData.uHi.value = -10;
  if (tab) shopTab = tab;
  flyTo(exchange.getWorldPosition(new THREE.Vector3()), fitDist(1.0, 2.35));
  openPanel(shopHtml(), SHOP_COLOR);
  setDock('shop');
  renderShop();
}
function openContact(prefill) {
  exitCore();
  selected = { kind: 'contact' };
  land.material.userData.uHi.value = UNCH;
  flyTo(beaconPos, fitDist(0.6, 2.1));
  openPanel(contactHtml(prefill), BEACON_COLOR);
  setDock('contact');
}
function enterCore() {
  coreTarget = 1;
  selected = { kind: 'core' };
  land.material.userData.uHi.value = -10;
  ocean.material.uniforms.uHi.value = 0;
  flyTo(camera.position.clone(), fitDist(1.05, 2.45), 2200);
  openPanel(coreHtml(), CORE.color);
  setDock('core');
}
function exitCore() {
  coreTarget = 0;
  shells.forEach((sh) => { sh.material.uniforms.uHi.value = 0; });
}
function focusStratum(i) {
  if (!coreTarget) enterCore();
  shells.forEach((sh, j) => { sh.material.uniforms.uHi.value = j === i ? 1 : 0; });
  panelBody.querySelectorAll('.stratum').forEach((el) => el.classList.toggle('on', +el.dataset.stratum === i));
  const el = panelBody.querySelector(`[data-stratum="${i}"]`);
  if (el) panelBody.scrollTo({ top: el.offsetTop - 12, behavior: reduceMotion ? 'auto' : 'smooth' });
}
function closePanel() {
  exitCore();
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('panel-open');
  land.material.userData.uHi.value = -10;
  ocean.material.uniforms.uHi.value = 0;
  selected = null;
  setDock(null);
  lastInteract = performance.now();
}
function selectRegion(ri, opts = {}) {
  exitCore();
  selected = { kind: 'region', index: ri };
  land.material.userData.uHi.value = ri;
  ocean.material.uniforms.uHi.value = 0;
  const o = ri === UNCH ? UNCHARTED : REGIONS[ri];
  if (!opts.noFly) flyTo(opts.dir || o.dir || camera.position, opts.dist || fitDist(0.85, 2.65));
  openPanel(ri === UNCH ? header(UNCHARTED) : regionHtml(ri), o.color);
  setDock(o.id);
}
function selectOcean(dir) {
  exitCore();
  selected = { kind: 'ocean' };
  land.material.userData.uHi.value = -10;
  ocean.material.uniforms.uHi.value = 1;
  if (dir) flyTo(dir, fitDist(1.0, 2.9));
  openPanel(oceanHtml(), OCEAN.color);
  setDock('ocean');
}
function openSpecial(kind) {
  exitCore();
  selected = { kind };
  land.material.userData.uHi.value = -10;
  const obj = kind === 'realm' ? realm : mindaloo;
  flyTo(obj.getWorldPosition(new THREE.Vector3()), kind === 'realm' ? fitDist(1.6, 4.4) : fitDist(1.4, 3.6));
  openPanel(specialHtml(kind), kind === 'realm' ? '#7FD8FF' : '#D9CCFF');
  setDock(kind);
}
function focusCity(i) {
  const c = cities[i];
  land.material.userData.uHi.value = c.region;
  flyTo(c.pos, fitDist(0.45, 1.85));
  cityPts.material.uniforms.uHover.value = i;
  panelBody.querySelectorAll('.city').forEach((b) => b.classList.toggle('on', +b.dataset.city === i));
}

panelBody.addEventListener('click', (e) => {
  const city = e.target.closest('[data-city]');
  if (city) { focusCity(+city.dataset.city); if (isSmall()) panel.classList.add('peek'); return; }
  const peak = e.target.closest('[data-peak]');
  if (peak) { flyTo(peaks[+peak.dataset.peak].pos, fitDist(0.5, 1.95)); return; }
  const jump = e.target.closest('[data-region]');
  if (jump) { selectRegion(+jump.dataset.region); return; }
  const st = e.target.closest('[data-stratum-btn]');
  if (st) { focusStratum(+st.dataset.stratumBtn); return; }
  const tab = e.target.closest('[data-shop-tab]');
  if (tab) { shopTab = tab.dataset.shopTab; renderShop(); return; }
  const go = e.target.closest('[data-go]');
  if (go) {
    if (go.dataset.go === 'notify') openContact({ type: 'General enquiry', message: 'Please let me know when The Exchange opens.' });
    else if (go.dataset.go === 'core') enterCore();
    else if (go.dataset.go === 'mindaloo') openSpecial('mindaloo');
    else if (go.dataset.go === 'contact') openContact({ type: 'General enquiry', message: 'I spun the world and found the eggs.' });
    else if (go.dataset.go === 'surface') { closePanel(); flyTo(camera.position.clone(), fitDist(1.32, 3.4), 2000); }
  }
});
panelBody.addEventListener('submit', (e) => { if (e.target.id === 'enquiry') { e.preventDefault(); sendEnquiry(e.target); } });
panelBody.addEventListener('change', (e) => {
  if (e.target.id === 'f-type') panelBody.querySelector('.f-book').hidden = e.target.value !== 'Book expertise';
});
$('#panel-close').addEventListener('click', closePanel);
$('#panel-grip').addEventListener('click', () => panel.classList.toggle('peek'));
addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

/* ------------------------------------------------------------------ dock */

const dock = $('#dock');
[...REGIONS.map((r, i) => ({ id: r.id, name: r.name, color: r.color, go: () => selectRegion(i) })),
  { id: 'core', name: 'Karma Core', color: CORE.color, go: () => enterCore() },
  { id: 'shop', name: 'Shop', color: SHOP_COLOR, go: () => openShop() },
  { id: 'contact', name: 'Contact', color: BEACON_COLOR, go: () => openContact() },
  { id: 'ocean', name: 'Ocean of Data', color: OCEAN.color, go: () => selectOcean(latLon(-30, -60)) },
  { id: 'realm', name: 'Realm', color: '#7FD8FF', go: () => openSpecial('realm') },
  { id: 'mindaloo', name: 'Mindaloo AC', color: '#D9CCFF', go: () => openSpecial('mindaloo') },
].forEach((d) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'chip';
  b.dataset.id = d.id;
  b.style.setProperty('--c', d.color);
  b.innerHTML = `<i></i>${esc(d.name)}`;
  b.addEventListener('click', d.go);
  dock.appendChild(b);
});
$('#nav-shop').addEventListener('click', () => openShop());
$('#nav-contact').addEventListener('click', () => openContact());
function setDock(id) { dock.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); }

$('#begin').addEventListener('click', () => selectRegion(0));

/* ------------------------------------------------------------------ picking */

const ray = new THREE.Raycaster();
const pickSphere = new THREE.Mesh(new THREE.SphereGeometry(1.02, 48, 32), new THREE.MeshBasicMaterial({ visible: false }));
planet.add(pickSphere);
const ndc = new THREE.Vector2();
const tip = $('#tip');
let pointer = null, hover = null, downAt = null;

function toScreen(v) {
  const p = v.clone().project(camera);
  return { x: (p.x * 0.5 + 0.5) * innerWidth, y: (-p.y * 0.5 + 0.5) * innerHeight, z: p.z };
}
function facing(v) { return v.clone().normalize().dot(camera.position.clone().normalize()) > 0.18; }
function nearest(list, px, py, radius) {
  let best = null, bd = radius;
  list.forEach((it, i) => {
    if (!facing(it.pos)) return;
    const s = toScreen(it.pos);
    const d = Math.hypot(s.x - px, s.y - py);
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}
function pick(px, py) {
  if (coreTarget) {
    ndc.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([realm, mindaloo.userData.body, coreBall, ...exchange.userData.pick], false)[0];
    if (!hit) return null;
    if (hit.object === coreBall) return { kind: 'core', label: CORE.name, sub: 'Consciousness' };
    if (hit.object === realm) return { kind: 'realm', label: 'Realm', sub: 'Connected world' };
    if (exchange.userData.pick.includes(hit.object)) return { kind: 'shop', label: 'The Exchange', sub: 'Shop' };
    return { kind: 'mindaloo', label: 'Mindaloo AC', sub: 'Moonlight' };
  }
  const reach = isTouch ? 26 : 15;
  if (spill.drain > 0.5) {
    const ei = nearest(eggMeshes.map((m) => ({ pos: m.userData.pos, ok: m.visible })).map((o) => (o.ok ? o : { pos: new THREE.Vector3(0, 0, -50) })), px, py, reach + 14);
    if (ei !== null) return { kind: 'egg', index: ei, label: 'Something shiny…', sub: 'Easter egg' };
  }
  const ci = nearest(cities, px, py, reach);
  if (ci !== null) return { kind: 'city', index: ci, label: cities[ci].product.name, sub: REGIONS[cities[ci].region].name };
  const pi = nearest(peaks, px, py, reach + 4);
  if (pi !== null) return { kind: 'peak', index: pi, label: peaks[pi].name, sub: 'Unsolved problem' };
  if (facing(beaconPos)) {
    const sp = toScreen(beaconPos);
    if (Math.hypot(sp.x - px, sp.y - py) < reach + 8) return { kind: 'contact', label: 'The Beacon', sub: 'Contact & bookings' };
  }
  const mi = nearest(monoliths, px, py, reach);
  if (mi !== null) return { kind: 'monolith', index: mi, label: monoliths[mi].entry[1], sub: monoliths[mi].entry[0] };
  ndc.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects([realm, mindaloo.userData.body, ...exchange.userData.pick, pickSphere], false)[0];
  if (!hit) return null;
  if (hit.object === realm) return { kind: 'realm', label: 'Realm', sub: 'Connected world' };
  if (exchange.userData.pick.includes(hit.object)) return { kind: 'shop', label: 'The Exchange', sub: 'Shop' };
  if (hit.object !== pickSphere) return { kind: 'mindaloo', label: 'Mindaloo AC', sub: 'Moonlight' };
  const d = hit.point.clone().normalize();
  const t = terrain(d.x, d.y, d.z);
  if (t.h > 0) {
    const o = t.region === UNCH ? UNCHARTED : REGIONS[t.region];
    return { kind: 'region', index: t.region, dir: d, label: o.name, sub: o.era };
  }
  return { kind: 'ocean', dir: d, label: OCEAN.name, sub: OCEAN.era };
}
function activate(h) {
  if (!h) return;
  if (h.kind === 'city') { selectRegion(cities[h.index].region, { noFly: true }); focusCity(h.index); }
  else if (h.kind === 'peak') { selectRegion(peaks[h.index].region, { noFly: true }); flyTo(peaks[h.index].pos, fitDist(0.5, 1.95)); }
  else if (h.kind === 'monolith') selectRegion(0, { dir: monoliths[h.index].pos, dist: fitDist(0.5, 2.0) });
  else if (h.kind === 'region') selectRegion(h.index, h.index === UNCH ? { dir: h.dir, dist: fitDist(0.6, 2.3) } : {});
  else if (h.kind === 'ocean') selectOcean(h.dir);
  else if (h.kind === 'core') enterCore();
  else if (h.kind === 'egg') openEgg(eggMeshes[h.index]);
  else if (h.kind === 'shop') openShop();
  else if (h.kind === 'contact') openContact();
  else openSpecial(h.kind);
}

const cv = renderer.domElement;
cv.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY, type: e.pointerType }; });
cv.addEventListener('pointerleave', () => { pointer = null; });
cv.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now(), wasSpinning: spin.w.length() > 1.5 || spin.energy > 0.2 }; lastInteract = performance.now(); $('#intro').classList.add('gone'); });
cv.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  if (moved < 7 && performance.now() - downAt.t < 600 && !downAt.wasSpinning) {
    const h = pick(e.clientX, e.clientY);
    if (h && h.dir) {
      const col = h.kind === 'ocean' ? OCEAN.color : (h.index === UNCH ? UNCHARTED.color : REGIONS[h.index].color);
      spawnRipple(h.dir, col);
      setTimeout(() => spawnRipple(h.dir, col), 200);
    }
    activate(h);
  }
  downAt = null;
});
cv.addEventListener('wheel', (e) => {
  e.preventDefault();
  lastInteract = performance.now();
  $('#intro').classList.add('gone');
  if (!spin.enabled) return;
  spin.target = THREE.MathUtils.clamp(spin.target * Math.exp(e.deltaY * 0.0012), MIN_D, MAX_D);
}, { passive: false });

/* grabbing and flinging */
const pinchDist = () => { const p = [...spin.pointers.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
cv.addEventListener('pointerdown', (e) => {
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine without capture */ }
  spin.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!introDone) { introDone = true; syncSpin(); }
  if (spin.pointers.size === 1) { grab(); spin.dragging = true; spin.lastMove = performance.now(); }
  else if (spin.pointers.size === 2) { spin.dragging = false; spin.pinch = pinchDist(); }
});
cv.addEventListener('pointermove', (e) => {
  const prev = spin.pointers.get(e.pointerId);
  if (!prev) return;
  const now = performance.now();
  if (spin.pointers.size === 2) {
    prev.x = e.clientX; prev.y = e.clientY;
    const d = pinchDist();
    if (spin.enabled && spin.pinch > 0) spin.target = THREE.MathUtils.clamp(spin.target * (spin.pinch / d), MIN_D, MAX_D);
    spin.pinch = d;
    return;
  }
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  prev.x = e.clientX; prev.y = e.clientY;
  if (!spin.dragging || !spin.enabled) return;
  const k = 0.0052 * Math.max(0.25, (spin.dist - 1) / 2.4);
  turnCamera(-dy * k, -dx * k, 0);
  const dt = Math.max(1 / 240, (now - spin.lastMove) / 1000);
  _sv.set(-dy * k / dt, -dx * k / dt, 0);
  spin.w.lerp(_sv, 0.6);
  if (spin.w.length() > 28) spin.w.setLength(28);
  spin.lastMove = now;
  lastInteract = now;
});
const release = (e) => {
  spin.pointers.delete(e.pointerId);
  if (spin.pointers.size === 0) {
    spin.dragging = false;
    if (reduceMotion || performance.now() - spin.lastMove > 90) spin.w.set(0, 0, 0); // held still before letting go
  }
};
cv.addEventListener('pointerup', release);
cv.addEventListener('pointercancel', release);

const ripples = [];
const rippleGeo = new THREE.RingGeometry(0.9, 1, 64);
function spawnRipple(dir, color) {
  if (reduceMotion) return;
  const d = dir.clone().normalize();
  const t = terrain(d.x, d.y, d.z);
  const m = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.copy(d).multiplyScalar((t.h > 0 ? 1 + elevation(d.x, d.y, d.z, t.h, t.region) : 1.003) + 0.008);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), d);
  m.renderOrder = 3;
  planet.add(m);
  ripples.push({ m, t0: performance.now() });
}
function stepRipples(now) {
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    const k = (now - r.t0) / 1400;
    if (k >= 1) { planet.remove(r.m); r.m.material.dispose(); ripples.splice(i, 1); continue; }
    r.m.scale.setScalar(0.01 + (1 - Math.pow(1 - k, 3)) * 0.24);
    r.m.material.opacity = (1 - k) * 0.85;
  }
}

function updateHover() {
  if (!pointer || pointer.type === 'touch' || flight || spin.dragging || spin.energy > 0.2) { tip.classList.remove('on'); cv.style.cursor = ''; return; }
  hover = pick(pointer.x, pointer.y);
  cityPts.material.uniforms.uHover.value = hover && hover.kind === 'city' ? hover.index : -1;
  if (hover) {
    tip.innerHTML = `<b>${esc(hover.label)}</b><span>${esc(hover.sub)}</span>`;
    tip.style.transform = `translate(${pointer.x + 16}px, ${pointer.y + 14}px)`;
    tip.classList.add('on');
    cv.style.cursor = 'pointer';
  } else { tip.classList.remove('on'); cv.style.cursor = 'grab'; }
}

/* ------------------------------------------------------------------ framing around the panel */

let offX = 0, offY = 0;
function frame() {
  const open = panel.classList.contains('open');
  const small = isSmall();
  const peek = panel.classList.contains('peek');
  const introOn = !$('#intro').classList.contains('gone');
  const tx = open && !small ? Math.min(440, innerWidth * 0.4) / 2 : (introOn && !small ? -Math.min(220, innerWidth * 0.12) : 0);
  const introUp = introOn && small ? innerHeight * 0.1 : 0;
  const ty = open && small ? (peek ? 70 : innerHeight * 0.3) : introUp;
  offX += (tx - offX) * 0.08;
  offY += (ty - offY) * 0.08;
  if (Math.abs(offX) < 0.5 && Math.abs(offY) < 0.5 && !open && !introOn) { camera.clearViewOffset(); return; }
  camera.setViewOffset(innerWidth, innerHeight, offX, offY, innerWidth, innerHeight);
}

/* ------------------------------------------------------------------ loop */

function updateLabels() {
  const camDir = camera.position.clone().normalize();
  const camDist = camera.position.length();
  labels.forEach((l) => {
    const p = l.getPos();
    let vis;
    if (l.layer === 'core') vis = ss(coreMix, 0.55, 1);
    else if (l.surface) vis = THREE.MathUtils.smoothstep(p.clone().normalize().dot(camDir), 0.2, 0.5);
    else {
      // hidden while behind the planet
      const toObj = p.clone().sub(camera.position);
      const tClosest = -camera.position.dot(toObj) / toObj.lengthSq();
      const closest = camera.position.clone().add(toObj.clone().multiplyScalar(Math.max(0, Math.min(1, tClosest))));
      vis = closest.length() < 1.1 && tClosest > 0 && tClosest < 1 ? 0 : 1;
    }
    if (l.layer !== 'core' && l.surface) {
      if (camDist < 1.9) vis *= THREE.MathUtils.smoothstep(camDist, 1.6, 1.9); // get out of the way up close
      vis *= 1 - coreMix;
    }
    vis *= 1 - Math.min(1, spin.energy * 1.5);
    const s = toScreen(p);
    l.el.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%)`;
    l.el.style.opacity = vis.toFixed(2);
    l.el.style.pointerEvents = vis > 0.4 ? 'auto' : 'none';
  });
}

let introDone = false;
const introStart = performance.now();
const introFrom = camera.position.clone();
const introTo = latLon(22, -95).multiplyScalar(fitDist(1.32, 3.4));

function loop() {
  const now = performance.now();
  const t = clock.getElapsedTime();
  const dtFrame = Math.min(0.05, t - (loop.prevT ?? t));
  loop.prevT = t;
  U.uTime.value = t;

  if (!introDone) {
    const k = reduceMotion ? 1 : Math.min(1, (now - introStart) / 2800);
    camera.position.lerpVectors(introFrom, introTo, ease(k));
    camera.lookAt(0, 0, 0);
    if (k >= 1) { introDone = true; syncSpin(); }
  } else if (flight) stepFlight(now);
  else stepSpin(dtFrame, t, now);

  if (!reduceMotion) { // the sun circles the world: day and night
    const a = SUN0 + t * 0.03;
    sunDir.set(Math.cos(a) * 0.84, 0.45, Math.sin(a) * 0.84).normalize();
    sun.position.copy(sunDir).multiplyScalar(10);
    rim.position.copy(sunDir).multiplyScalar(-10).setY(-2);
  }
  coreMix += (coreTarget - coreMix) * (reduceMotion ? 1 : 0.035);
  if (Math.abs(coreTarget - coreMix) < 0.001) coreMix = coreTarget;
  applyCore(coreMix, t);
  stepRipples(now);
  if (!reduceMotion && coreMix < 0.5) stepBeings(Math.min(0.05, t - (loop.lastT ?? t)), t);
  loop.lastT = t;

  clouds.rotation.y += dtFrame * (0.01 + spin.energy * 2.5);
  stepSpill(dtFrame, t);
  sunGlow.position.copy(sunDir).multiplyScalar(60);
  realmPivot.rotation.y = t * 0.06;
  realm.rotation.y = t * 0.2;
  mindalooPivot.rotation.y = -t * 0.09;
  { // the station holds still while its shop is open, so it stays in view
    const dt = Math.min(0.05, t - (exchange.userData.lastT ?? t));
    exchange.userData.lastT = t;
    if (!(selected && selected.kind === 'shop')) exchange.userData.angle = (exchange.userData.angle || 0) + dt * 0.07;
    exchangePivot.rotation.y = exchange.userData.angle || 0;
  }
  exchange.userData.habitat.rotation.y = t * 0.5;
  exchange.lookAt(camera.position); // always shown three-quarter on: ring, dome and wings all visible
  exchange.userData.station.rotation.set(0.8, 0.5 + Math.sin(t * 0.25) * 0.5, 0.18);
  exchange.userData.shuttlePath.rotation.y = -t * 0.9;
  exchange.userData.navLights.forEach((n, i) => { n.visible = Math.sin(t * 4 + i * Math.PI) > 0.3; });
  exchange.userData.dome.material.emissiveIntensity = 0.7 + Math.sin(t * 1.6) * 0.25;
  {
    const d = exchange.getWorldPosition(new THREE.Vector3()).distanceTo(camera.position);
    exchange.scale.setScalar(1.5 * THREE.MathUtils.clamp((d - 0.3) / 0.8, 0.05, 1));
  }
  beacon.userData.sweep.rotation.y = t * 1.4;
  beaconFlash = Math.max(0, beaconFlash - 0.01);
  beacon.userData.sweep.children[0].material.opacity = 0.16 + beaconFlash * 0.5;
  beacon.visible = coreMix < 0.5;
  mindaloo.userData.body.rotation.y = t * 0.05;
  mindaloo.userData.halo.material.opacity = 0.8 + Math.sin(t * 0.8) * 0.2;
  { // shrink away instead of filling the screen when it passes the camera
    const d = mindaloo.getWorldPosition(new THREE.Vector3()).distanceTo(camera.position);
    mindaloo.scale.setScalar(THREE.MathUtils.clamp((d - 0.35) / 0.9, 0.05, 1));
  }
  peaks.forEach((p, i) => { p.gem.rotation.y = t * 1.2 + i; p.gem.position.y = 0.21 + Math.sin(t * 1.5 + i) * 0.008; });
  monoliths.forEach((m, i) => { m.cap.material.color.setHSL(0.11, 1, 0.55 + Math.sin(t * 2 + i) * 0.12); });

  frame();
  updateHover();
  updateLabels();
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

document.body.classList.add('ready');
if (location.hash === '#spill') setTimeout(() => startSpill(0.9), 3600); // td1.world/#spill shows the ocean spill straight away
loop();

/* ------------------------------------------------------------------ no WebGL: still a usable site */

function showFallback() {
  document.body.classList.add('no-webgl');
  const box = $('#fallback');
  box.innerHTML = `<h2>TD1.WORLD</h2><p>Your browser could not start the 3D world, so here is the map in words.</p>${REGIONS.map((r) => `
    <section style="--c:${r.color}"><p class="kicker">${esc(r.era)}</p><h3>${esc(r.name)}</h3><p>${esc(r.intro)}</p></section>`).join('')}
    <p><a class="cta" href="${REALM_URL}">Enter Realm →</a></p>`;
}
