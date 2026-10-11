// TD1.WORLD — the living planet.
// One sphere, five impossible continents, an ocean of data, cities of light, and two moons.

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import {
  REGIONS, OCEAN, UNCHARTED, HISTORY, PEAKS, HORIZONS, NOTES, MINDALOO_URL, REALM_URL, CORE, STRATA, AC_PATH, SHOP, ENQUIRY, EGGS,
} from './data.js';
import { PRODUCTS } from './products.js';
import { createScore } from './sound.js';
import { STARS, LINES } from './stars.js';
import { building, buildingMaterial, robotBody, robotWalker, robotHover, SHOULDERS, robotArm, robotTool, dataCube, drone, bird, ship, tree, satellite, modelMaterial, merge } from './models.js';

const score = createScore();

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
renderer.xr.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.05, 200);
camera.position.set(0, 2.4, 11);
const rig = new THREE.Group(); // in VR the headset moves the camera inside this rig
scene.add(rig);
rig.add(camera);
const camWorld = new THREE.Vector3(), camWorldQ = new THREE.Quaternion();

/* Film pipeline: render → bloom → lens (vignette, grain, fringing) → filmic grade. VR renders directly. */
// Multisampled (anti-aliased) render target, so edges stay crisp through the film pipeline.
// Only ask for 4x: it's what every phone and computer GPU supports (iPhones can't do 2x, and a mismatch draws black).
// Safety net: draw one white frame into a tiny anti-aliased target and read it back. If it comes back black, this device
// can't do it, so the world renders without it rather than not at all.
function msaaWorks(samples) {
  if (!renderer.capabilities.isWebGL2 || renderer.capabilities.maxSamples < samples) return false;
  try {
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples, depthBuffer: true });
    const sc = new THREE.Scene();
    sc.background = new THREE.Color(1, 1, 1);
    const prevXR = renderer.xr.enabled;
    renderer.xr.enabled = false;
    renderer.setRenderTarget(rt);
    renderer.render(sc, new THREE.OrthographicCamera());
    renderer.setRenderTarget(null);
    renderer.xr.enabled = prevXR;
    const px = new Uint16Array(4);
    renderer.readRenderTargetPixels(rt, 1, 1, 1, 1, px);
    const gl = renderer.getContext();
    const ok = gl.getError() === gl.NO_ERROR && px[0] !== 0;
    rt.dispose();
    return ok;
  } catch (e) { return false; }
}
const MSAA = !/nomsaa/.test(location.hash) && msaaWorks(4) ? 4 : 0;
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth * renderer.getPixelRatio(), innerHeight * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: MSAA }));
composer.addPass(new RenderPass(scene, camera));
// Clean-up pass: if any shader on some device produces an invalid pixel (NaN or infinity), it's zeroed here.
// Without this the glow would smear one bad pixel across the whole screen and the world would go black.
const sanitize = new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      #if __VERSION__ >= 300
        if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0);
      #else
        if (!(c.r == c.r && c.g == c.g && c.b == c.b)) c = vec4(0.0);
      #endif
      gl_FragColor = vec4(clamp(c.rgb, 0.0, 60.0), 1.0);
    }`,
});
if (!/nosan/.test(location.hash)) composer.addPass(sanitize);
const bloomScale = isSmall() || isTouch ? 0.4 : 0.75;
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth * bloomScale, innerHeight * bloomScale), 0.7, 0.55, 0.72);
composer.addPass(bloom);
const lens = new ShaderPass({
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: isTouch ? 0.006 : 0.01 }, uVignette: { value: 1 }, uCA: { value: isTouch ? 0.0008 : 0.0014 }, uDof: { value: 0 }, uAspect: { value: innerWidth / innerHeight } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; uniform float uVignette; uniform float uCA; uniform float uDof; uniform float uAspect; varying vec2 vUv;
    float rnd(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233)) + fract(uTime) * 61.0) * 43758.5453); }
    void main(){
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * uCA * r2 * 6.0;
      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
      // depth of field for close-ups: the edges of the frame fall softly out of focus
      float blur = uDof * smoothstep(0.02, 0.2, r2) * 0.007;
      if (blur > 0.0002) {
        vec3 acc = col;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.7854;
          acc += texture2D(tDiffuse, vUv + vec2(cos(a) / uAspect, sin(a)) * blur).rgb;
          acc += texture2D(tDiffuse, vUv + vec2(cos(a + 0.39) / uAspect, sin(a + 0.39)) * blur * 0.5).rgb;
        }
        col = acc / 17.0;
      }
      col *= mix(1.0, smoothstep(0.62, 0.05, r2 * 1.45), 0.55 * uVignette);
      col += (rnd(vUv * 1371.0) - 0.5) * uGrain * (0.35 + col);
      gl_FragColor = vec4(max(col, 0.0), 1.0);
    }`,
});
composer.addPass(lens);
composer.addPass(new OutputPass());
// distance at which a sphere of radius r fits the narrower side of the screen
function fitDist(r, min) {
  const tv = Math.tan((camera.fov * DEG) / 2);
  return Math.max(min, r / Math.min(tv, tv * camera.aspect));
}

/* The world in your hands: grab it, fling it, spin it in any direction. Left alone, it turns like Earth. */
const EARTH_AXIS = new THREE.Vector3(Math.sin(23.4 * DEG), Math.cos(23.4 * DEG), 0).normalize();
const MIN_D = 1.45, MAX_D = 10;
// Landing: keep zooming past orbit and the camera drops to drone height, tilting up to the horizon.
const ALT_MIN = 0.006; // the lowest you can fly, above sea level
const GROUND_CLEAR = 0.0045; // and above the land
const LAND_TILT = 1.16; // radians: how far the view tips up to the horizon at the lowest height
const landK = (dist) => THREE.MathUtils.smoothstep(0.42 - (dist - 1), 0, 0.42 - ALT_MIN * 1.3); // 0 in orbit, 1 at the ground
function zoomBy(k) { // k > 1 zooms out; works in height above the ground, so it slows as you near the surface
  const alt = Math.max(ALT_MIN, spin.target - 1);
  spin.target = 1 + THREE.MathUtils.clamp(alt * k, ALT_MIN, MAX_D - 1);
}
// Zoom toward a point on screen, the way a map does: what's under the cursor or your fingers comes to meet you.
const _zH = new THREE.Vector3(), _zC = new THREE.Vector3(), _zR = new THREE.Quaternion(), _zI = new THREE.Quaternion();
function zoomAt(k, px, py) {
  zoomBy(k);
  if (k >= 1 || !sphereHit(px, py, 1, _zH)) return;
  const L = landK(spin.dist);
  _zC.copy(camera.position).normalize();
  _zR.setFromUnitVectors(_zC, _zH.normalize());
  // rotate part of the way toward it, more the harder you zoom; barely at all once you're down low
  spin.qT.premultiply(_zI.identity().slerp(_zR, (1 - k) * 0.9 * (1 - L))).normalize();
}
const spin = {
  q: new THREE.Quaternion(), // what you see
  qT: new THREE.Quaternion(), // where your finger has put it; the view glides after it every frame
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
function syncSpin() { spin.q.copy(camera.quaternion); spin.qT.copy(spin.q); spin.dist = spin.target = camera.position.length(); }
function placeCamera() {
  camera.quaternion.copy(spin.q);
  camera.position.set(0, 0, spin.dist).applyQuaternion(spin.q);
  camera.up.set(0, 1, 0).applyQuaternion(spin.q);
  camera.rotateX(landK(spin.dist) * LAND_TILT); // near the ground, look out to the horizon
}
function turnCamera(ax, ay, az) { // rotate around the camera's own axes by these angles
  _sv.set(ax, ay, az);
  const ang = _sv.length();
  if (ang < 1e-8) return;
  _sq.setFromAxisAngle(_sv.multiplyScalar(1 / ang), ang);
  spin.qT.multiply(_sq).normalize();
}

// Real time: the side of the world you arrive on matches your own clock (night if it's night where you are),
// and the sun sits as high or low as it really does today, so the seasons are real. Then days pass in minutes.
const LOCAL = (() => {
  const d = new Date();
  const hour = d.getHours() + d.getMinutes() / 60;
  const day = (Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 864e5;
  return { hour, decl: -23.44 * DEG * Math.cos((2 * Math.PI / 365) * (day + 10)) };
})();
const ARRIVE_LON = -95; // where the opening shot sets you down
const SUN0 = -ARRIVE_LON * DEG + ((LOCAL.hour - 12) / 24) * Math.PI * 2;
const sunAt = (a, out) => out.set(Math.cos(LOCAL.decl) * Math.cos(a), Math.sin(LOCAL.decl), Math.cos(LOCAL.decl) * Math.sin(a));
const sunDir = sunAt(SUN0, new THREE.Vector3());
const hemi = new THREE.HemisphereLight(0xbfd4ff, 0x1a1030, 0.26);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff1dc, 2.2);
sun.position.copy(sunDir).multiplyScalar(10);
scene.add(sun);
const rim = new THREE.DirectionalLight(0x6f7dff, 0.22); // faint moonlight on the night side
rim.position.set(0.8, -0.2, -1).multiplyScalar(10);
scene.add(rim);

const clock = new THREE.Clock();
let sunShift = 0; // radians, for testing
const DAY_RATE = 0.03; // radians per second: a day passes in about three and a half minutes
const U = { uTime: { value: 0 }, uLin: { value: 1 } }; // shared time uniform; uLin: shaders write linear light for the film pipeline
const AIR = { value: 1 };
const SKY_FADE = { value: 1 };
const CAM_RIGHT = { value: new THREE.Vector3(1, 0, 0) }, CAM_UP = { value: new THREE.Vector3(0, 1, 0) }; // the camera's axes, for shaders that light things relative to you
let baseShadowOff = false; // set by safe mode
const _srCache = new Map(); // ground heights, see surfaceRadius() // the stars fade behind a blue daytime sky when you land on the day side

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
const GLSL_NOISE = `
  float hh(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
  float nz(vec3 x){ vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hh(i), hh(i + vec3(1,0,0)), f.x), mix(hh(i + vec3(0,1,0)), hh(i + vec3(1,1,0)), f.x), f.y),
               mix(mix(hh(i + vec3(0,0,1)), hh(i + vec3(1,0,1)), f.x), mix(hh(i + vec3(0,1,1)), hh(i + vec3(1,1,1)), f.x), f.y), f.z); }
  float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * nz(p); p *= 2.02; a *= 0.5; } return s; }`;

// Weather shared by the clouds, the land and the sea: one cloud field, so shadows fall exactly under the clouds.
const WEATHER = {
  uNight: { value: null }, // the night-lights map, painted once the towns are placed
  uSunLocal: { value: new THREE.Vector3() }, // the sun in the planet's own frame
  uCloudRot: { value: new THREE.Matrix3() }, // planet frame → cloud frame (the clouds drift round)
  uShadow: { value: 1 }, // cheap now the clouds are baked: phones get shadows too
  uCloudTex: { value: null },
};
// Town street grids, shared by the ground shader and the building layout so buildings stand in the blocks.
const TOWN_GRID = 0.0045;
// how many towns get street grids: as many as this device's shaders can hold (each is one vec4: where, and how big)
const TOWN_MAX = Math.max(32, Math.min(160, (renderer.capabilities.maxFragmentUniforms || 224) - 200));
const TOWN_U = { towns: { value: Array.from({ length: TOWN_MAX }, () => new THREE.Vector4()) }, n: { value: 0 } };
const PLACES = []; // every town on the world: { dir, region, rad, product }
const townFrame = (c) => { // the same east/north axes the shader uses
  const t1 = new THREE.Vector3().crossVectors(c, Math.abs(c.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)).normalize();
  return { t1, t2: new THREE.Vector3().crossVectors(c, t1) };
};
const WEATHER_GLSL = `
  uniform sampler2D uNight; uniform vec3 uSunLocal; uniform mat3 uCloudRot; uniform float uShadow;
  ${GLSL_NOISE}
  float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a * nz(p); p *= 2.03; a *= 0.5; } return s; }
  uniform sampler2D uCloudTex;
  float cloudCover(vec3 cp){ // cp: a point on the cloud sphere, in the clouds' frame; read from the baked cloud map
    vec3 d = normalize(cp);
    return texture2D(uCloudTex, vec2(atan(-d.z, d.x + 1e-7) / 6.2831853 + 0.5, asin(clamp(d.y, -1.0, 1.0)) / 3.1415927 + 0.5)).r;
  }
  float cloudShadow(vec3 ld){
    if (uShadow < 0.5) return 0.0;
    float day = smoothstep(-0.1, 0.2, dot(ld, uSunLocal));
    if (day <= 0.0) return 0.0;
    vec3 c = normalize(ld + uSunLocal * 0.045);
    return cloudCover(uCloudRot * c * 1.045) * 0.55 * day;
  }
  float nightLights(vec3 ld, float dist){
    vec2 uv = vec2(atan(-ld.z, ld.x + 1e-7) / 6.2831853 + 0.5, asin(clamp(ld.y, -1.0, 1.0)) / 3.1415927 + 0.5);
    float dens = texture2D(uNight, uv).r;
    vec3 q = ld * 2600.0;
    float hs = hh(floor(q));
    float far = dens * dens * (0.45 + hs * 1.1);
    // close up, the glow resolves into separate street lights and windows
    float pts = step(1.0 - dens * 0.45, hs) * smoothstep(0.26, 0.06, length(fract(q) - 0.5)) * (0.5 + hs * 0.6);
    return mix(pts, far, smoothstep(0.03, 0.22, dist));
  }`;

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
const RELIEF = 0.22; // real planets are smooth: land rises only a little, mountains read through light and shadow
function elevation(x, y, z, h, region) {
  if (h <= 0) return -0.006; // the sea floor sits under the water
  return 0.0015 + relief(x, y, z, h, region) * RELIEF;
}
function relief(x, y, z, h, region) {
  if (h <= 0) return -0.01;
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
  const detail = isSmall() || isTouch ? 88 : 136; // finer land: smoother hills up close
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const src = ico.attributes.position;
  const cache = new Map();
  const verts = [], index = [];
  const sample = (i) => {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
    let v = cache.get(key);
    if (!v) {
      const t = terrain(x, y, z);
      const bump = relief(x, y, z, t.h, t.region);
      v = { x, y, z, h: t.h, region: t.region, near: t.near, bump, e: t.h > 0 ? 0.0015 + bump * RELIEF : -0.006, idx: -1 };
      cache.set(key, v);
    }
    return v;
  };
  const use = (v) => { if (v.idx < 0) { v.idx = verts.length; verts.push(v); } return v.idx; };

  for (let f = 0; f < src.count / 3; f++) {
    const v = [sample(f * 3), sample(f * 3 + 1), sample(f * 3 + 2)];
    const top = v.reduce((a, b) => (b.h > a.h ? b : a));
    if (top.h <= 0) continue; // open water: the ocean draws it
    index.push(use(v[0]), use(v[1]), use(v[2]));
    const hAvg = (v[0].h + v[1].h + v[2].h) / 3;
    const cx = (v[0].x + v[1].x + v[2].x) / 3, cy = (v[0].y + v[1].y + v[2].y) / 3, cz = (v[0].z + v[1].z + v[2].z) / 3;
    const face = { c: new THREE.Vector3(cx, cy, cz).normalize(), r: 1 + Math.max(0, (v[0].e + v[1].e + v[2].e) / 3), region: top.region, h: hAvg };
    if (hAvg > 0) { landFaces.push(face); byRegion[top.region].push(face); }
  }
  ico.dispose();

  // Light the land as if its mountains were full height, then lay it almost flat: real relief, no cliffs.
  const g = new THREE.BufferGeometry();
  const bumpPos = new Float32Array(verts.length * 3), pos = new Float32Array(verts.length * 3);
  verts.forEach((v, i) => {
    const rb = 1 + Math.max(-0.02, v.bump) * 0.9, r = 1 + v.e;
    bumpPos.set([v.x * rb, v.y * rb, v.z * rb], i * 3);
    pos.set([v.x * r, v.y * r, v.z * r], i * 3);
  });
  g.setAttribute('position', new THREE.BufferAttribute(bumpPos, 3));
  g.setIndex(index);
  g.computeVertexNormals();
  const normals = g.attributes.normal;
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  // Natural palettes that keep each continent's identity.
  const P = (lo, mid, hi, rock, snow) => ({ lo: new THREE.Color(lo), mid: new THREE.Color(mid), hi: new THREE.Color(hi), rock: new THREE.Color(rock), snow: snow ? new THREE.Color(snow) : null });
  const PAL = [
    P('#6e4a24', '#a7773f', '#d2b07a', '#7a4a32', null), // The Origins: ochre desert, sandstone, rust
    P('#2f2a4c', '#544a82', '#9a8fc4', '#4a4458', '#eeeaf8'), // Memory: violet forest, lavender highlands
    P('#123f3a', '#1f6a5c', '#6aa596', '#3d4f4c', '#f2f7f6'), // Intelligence: deep teal forest, glacial ridges
    P('#5a1f28', '#94403f', '#d08a72', '#5e3a36', null), // Creation: rose-red mesas and dunes
    P('#163f24', '#2f7a42', '#8cc48e', '#3e4c3e', '#f4fbf4'), // The Future: emerald plains, bright plateaus
  ];
  const ICE = P('#9aa7b8', '#c8d2df', '#eef3f8', '#8a96a6', '#ffffff');
  const sand = new THREE.Color('#d9c7a0'), c = new THREE.Color(), radial = new THREE.Vector3(), nrm = new THREE.Vector3();
  const col = new Float32Array(verts.length * 3), reg = new Float32Array(verts.length);
  verts.forEach((v, i) => {
    const pal = v.region === UNCH ? ICE : PAL[v.region >= 0 ? v.region : v.near];
    const t = Math.min(1, Math.max(0, v.h) / 0.75);
    c.copy(pal.lo).lerp(pal.mid, sstep(t, 0.02, 0.4)).lerp(pal.hi, sstep(t, 0.45, 0.85));
    const patch = fbm(v.x * 3.4 + 5, v.y * 3.4 + 1, v.z * 3.4 + 8, 4);
    c.multiplyScalar(0.82 + patch * 0.5); // biome patches
    nrm.fromBufferAttribute(normals, i);
    radial.set(v.x, v.y, v.z);
    const slope = 1 - Math.max(0, nrm.dot(radial));
    c.lerp(pal.rock, Math.min(0.75, slope * 3.2)); // bare rock on steep ground
    if (v.h < 0.012) c.lerp(sand, 0.55 * (1 - Math.max(0, v.h) / 0.012)); // beaches, right at the waterline
    if (pal.snow && t > 0.72) c.lerp(pal.snow, Math.min(0.9, (t - 0.72) * 3.5 * (1 - slope)));
    const grain = fbm(v.x * 26 + 7, v.y * 26 + 3, v.z * 26 + 9, 2);
    c.multiplyScalar(0.94 + grain * 0.16);
    col.set([c.r, c.g, c.b], i * 3);
    reg[i] = v.region === UNCH ? UNCH : v.near;
  });
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aRegion', new THREE.BufferAttribute(reg, 1));

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0.0, transparent: true });
  mat.userData.uHi = { value: -10 };
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.uTime;
    sh.uniforms.uHi = mat.userData.uHi;
    sh.uniforms.uSun = { value: sunDir };
    Object.assign(sh.uniforms, WEATHER);
    sh.uniforms.uTowns = TOWN_U.towns;
    sh.uniforms.uTownN = TOWN_U.n;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aRegion;\nvarying float vRegion;\nvarying vec3 vWP;\nvarying vec3 vLP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRegion = aRegion;\nvLP = position;\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; uniform float uHi; uniform vec3 uSun;
        varying float vRegion; varying vec3 vWP; varying vec3 vLP;
        ${WEATHER_GLSL}
        uniform vec4 uTowns[${TOWN_MAX}]; uniform int uTownN;
        // Every town sits on a street grid: pale blocks, dark streets with kerbs. Buildings stand in the blocks.
        void townFloor(vec3 ld, out float pave, out float street, out float lamp){
          pave = 0.0; street = 0.0; lamp = 0.0;
          for (int i = 0; i < ${TOWN_MAX}; i++) {
            if (i >= uTownN) break;
            vec3 c = uTowns[i].xyz; float rr = uTowns[i].w;
            if (dot(ld, c) < 1.0 - rr * rr * 0.9) continue;
            vec3 t1 = normalize(cross(c, abs(c.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
            vec3 t2 = cross(c, t1);
            vec2 uv = vec2(dot(ld - c, t1), dot(ld - c, t2));
            float fade = 1.0 - smoothstep(rr * 0.85, rr * 1.12, length(uv));
            vec2 q = uv / ${TOWN_GRID.toFixed(5)};
            vec2 gd = abs(fract(q) - 0.5);           // 0.5 on a street line, 0 mid-block
            vec2 g = (0.5 - gd) * ${TOWN_GRID.toFixed(5)};  // distance from the nearest street line
            float m = min(g.x, g.y);
            float aa = fwidth(m) + 1e-6;
            float st = 1.0 - smoothstep(0.00028 - aa, 0.00028 + aa, m);
            pave = max(pave, fade);
            street = max(street, st * fade);
            // street lamps every so often along the kerb
            vec2 lq = fract(uv / 0.0009) - 0.5;
            lamp = max(lamp, st * fade * smoothstep(0.12, 0.03, length(lq)));
          }
        }`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 ld = normalize(vLP);
        float camD = distance(vWP, cameraPosition);
        float pave = 0.0, street = 0.0, lamp = 0.0;
        if (camD < 0.45) townFloor(ld, pave, street, lamp);
        if (camD < 0.3) { // up close the ground gets real texture: little rises, ruts and stones catch the light
          float kb = smoothstep(0.3, 0.04, camD) * (1.0 - pave * 0.85);
          float hgt = fbm3(ld * 1500.0) + fbm3(ld * 5600.0) * 0.4; // no detail finer than a pixel: it would shimmer as you move
          vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition);
          float hx = dFdx(hgt), hy = dFdy(hgt);
          vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx);
          float det = dot(dpx, r1);
          vec3 grad = sign(det) * (hx * r1 + hy * r2) * 0.00032 * kb;
          normal = normalize(abs(det) * normal - grad);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float sel = 1.0 - step(0.5, abs(vRegion - uHi));
        totalEmissiveRadiance += vColor.rgb * (0.015 + sel * (0.07 + 0.04 * sin(uTime * 2.6)));
        vec3 upW = normalize(vWP);
        float sunUp = dot(upW, uSun);
        float night = smoothstep(0.05, -0.25, sunUp);
        totalEmissiveRadiance += vColor.rgb * night * 0.02;
        // city lights: towns, suburbs and the roads between them glow on the night side
        float lights = nightLights(ld, camD) * smoothstep(0.004, 0.02, camD) * (1.0 - pave); // inside town the streets and windows take over
        float twinkle = 0.85 + 0.15 * sin(uTime * 3.0 + dot(ld, vec3(913.0, 517.0, 731.0)));
        totalEmissiveRadiance += vec3(1.0, 0.72, 0.42) * lights * night * twinkle * 1.6;
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.4, 0.38), smoothstep(0.05, 0.6, texture2D(uNight, vec2(atan(-ld.z, ld.x + 1e-7) / 6.2831853 + 0.5, asin(clamp(ld.y, -1.0, 1.0)) / 3.1415927 + 0.5)).r) * 0.22); // by day, towns read as grey-brown patches
        float shade = cloudShadow(ld);
        if (camD < 0.3) { // close to the ground: soil, grass and stone in fine, crisp detail
          float k = smoothstep(0.3, 0.04, camD);
          float n1 = fbm3(ld * 1100.0), n2 = fbm3(ld * 4200.0);
          diffuseColor.rgb *= mix(1.0, 0.72 + n1 * 0.42 + n2 * 0.28, k);
        }
        // the town floor: paved blocks and dark streets, with lamps at night
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.52, 0.51, 0.49), pave * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.09, 0.095, 0.105), street);
        totalEmissiveRadiance += vec3(1.0, 0.75, 0.45) * (lamp * 0.9 + street * 0.05) * night;`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        reflectedLight.directDiffuse *= 1.0 - shade;
        reflectedLight.directSpecular *= 1.0 - shade;
        // golden hour: the light warms and reddens along the line between day and night
        float dusk = smoothstep(-0.06, 0.06, sunUp) * (1.0 - smoothstep(0.06, 0.32, sunUp));
        reflectedLight.directDiffuse *= mix(vec3(1.0), vec3(1.45, 0.78, 0.48), dusk);`);
  };
  const land = new THREE.Mesh(g, mat);
  land.renderOrder = 2;
  planet.add(land);
  return land;
}
const land = buildLand();


// Clouds are worked out once into a map (and refreshed a few times a second as they drift and change shape),
// instead of for every pixel of every frame. The sky looks the same; phones breathe easier.
const cloudBake = (() => {
  const W = isSmall() || isTouch ? 512 : 1024;
  const rt = new THREE.WebGLRenderTarget(W, W / 2, { depthBuffer: false });
  rt.texture.wrapS = THREE.RepeatWrapping;
  rt.texture.minFilter = THREE.LinearFilter;
  rt.texture.generateMipmaps = false;
  WEATHER.uCloudTex.value = rt.texture;
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      ${GLSL_NOISE}
      float fbm3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++){ s += a * nz(p); p *= 2.03; a *= 0.5; } return s; }
      void main(){
        float lon = (vUv.x - 0.5) * 6.2831853, lat = (vUv.y - 0.5) * 3.1415927;
        vec3 cp = vec3(cos(lat) * cos(lon), sin(lat), -cos(lat) * sin(lon)) * 1.045; // the cloud sphere's radius
        vec3 p = cp * 2.3;
        vec3 q = vec3(fbm3(p + vec3(0.0, uTime * 0.012, 0.0)), fbm3(p + vec3(5.2, 1.3, 2.8)), fbm3(p + vec3(1.7, 9.2, 3.1)));
        float n = fbm(p * 1.5 + q * 2.0 + vec3(uTime * 0.008, 0.0, 0.0));
        float c = clamp(smoothstep(0.5, 0.7, n) * (0.7 + 0.6 * fbm3(cp * 13.0)), 0.0, 1.0);
        gl_FragColor = vec4(c, c, c, 1.0);
      }`,
  });
  const scene = new THREE.Scene();
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  let frame = 0;
  return {
    update(t, force) {
      if (!force && (frame++ % 12) !== 0) return; // a few times a second is plenty for drifting weather
      mat.uniforms.uTime.value = t;
      const xr = renderer.xr.enabled;
      renderer.xr.enabled = false;
      const prev = renderer.getRenderTarget();
      renderer.setRenderTarget(rt);
      renderer.render(scene, cam);
      renderer.setRenderTarget(prev);
      renderer.xr.enabled = xr;
    },
  };
})();
cloudBake.update(0, true);

/* ------------------------------------------------------------------ the ocean of data */

const oceanGeo = (() => {
  // each vertex knows how deep the water is there, so shallows glow turquoise and the open sea runs deep
  const g = new THREE.SphereGeometry(1, isSmall() || isTouch ? 160 : 220, isSmall() || isTouch ? 120 : 160);
  const p = g.attributes.position, depth = new Float32Array(p.count);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    depth[i] = terrain(x, y, z).h;
  }
  g.setAttribute('aDepth', new THREE.BufferAttribute(depth, 1));
  return g;
})();
const ocean = new THREE.Mesh(
  oceanGeo,
  new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSun: { value: sunDir }, uHi: { value: 0 }, uAlpha: { value: 1 },
      uSlosh: { value: 0 }, uSloshAge: { value: 99 }, uSloshDir: { value: new THREE.Vector3(1, 0, 0) },
      uSpin: { value: 0 }, uSpinAxis: { value: new THREE.Vector3(0, 1, 0) },
      uDrain: { value: 0 }, uHoles: { value: [new THREE.Vector3(0, 9, 0), new THREE.Vector3(0, 9, 0), new THREE.Vector3(0, 9, 0)] },
      uFog: { value: 0 }, uFogCol: { value: new THREE.Color() }, ...WEATHER },
    transparent: true,
    vertexShader: `
      uniform float uSlosh; uniform float uSloshAge; uniform vec3 uSloshDir; uniform float uSpin; uniform vec3 uSpinAxis;
      attribute float aDepth;
      varying vec3 vPos; varying vec3 vN; varying vec3 vView; varying float vSurge; varying float vDepth; varying float vDist;
      void main(){
        vPos = position;
        vDepth = aDepth;
        vec3 n = normalize(position);
        // after a sudden stop the water keeps going: it piles up on one side and rolls back in waves
        float side = dot(n, uSloshDir);
        float fade = exp(-uSloshAge * 0.55);
        float pile = smoothstep(-0.2, 1.0, side) * fade;
        float wave = sin(side * 10.0 - uSloshAge * 6.5) * exp(-uSloshAge * 0.4);
        // spinning hard flings water toward the equator of the spin
        float bulge = uSpin * (1.0 - abs(dot(n, uSpinAxis)));
        float lift = uSlosh * (0.03 * pile + 0.01 * wave) + bulge * 0.016;
        vSurge = clamp(uSlosh * pile * 2.0 + bulge * 0.6, 0.0, 1.0);
        vec4 wp = modelMatrix * vec4(position * (1.0 + lift), 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        vDist = distance(cameraPosition, wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uSun; uniform float uHi; uniform float uAlpha;
      uniform float uDrain; uniform vec3 uHoles[3]; uniform float uSpin; uniform float uFog; uniform vec3 uFogCol;
      varying vec3 vPos; varying vec3 vN; varying vec3 vView; varying float vSurge; varying float vDepth; varying float vDist;
      ${WEATHER_GLSL}
      float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
        // drained patches of seabed, with foam around their rims
        vec3 un = normalize(vPos);
        float holeFoam = 0.0;
        for (int i = 0; i < 3; i++) {
          float d = dot(un, uHoles[i]);
          float wob = 0.012 * sin(atan(un.z - uHoles[i].z, un.x - uHoles[i].x) * 7.0 + uTime * 2.0);
          float r = cos(0.15 * uDrain + wob * uDrain);
          if (uDrain > 0.001 && d > r) discard;
          holeFoam = max(holeFoam, smoothstep(r - 0.006, r, d) * uDrain);
        }

        // colour by depth: turquoise shallows, blue shelf, deep navy ocean
        float depth = clamp(-vDepth, 0.0, 1.0);
        vec3 deep = vec3(0.004, 0.022, 0.075);
        vec3 shelf = vec3(0.012, 0.085, 0.2);
        vec3 shallow = vec3(0.05, 0.36, 0.46);
        vec3 water = mix(shelf, deep, smoothstep(0.08, 0.45, depth));
        water = mix(water, shallow, pow(1.0 - smoothstep(0.0, 0.11, depth), 1.6));

        // small rolling waves catch the light
        vec3 n = vN;
        float t = uTime * 0.6;
        // waves run along uneven directions with a gentle warp (no grid), and each one fades before it gets smaller than a pixel
        {
          float px = length(fwidth(un)) + 1e-5;
          vec3 wp = un + 0.012 * vec3(sin(un.y * 61.0 + t * 0.3), sin(un.z * 53.0 - t * 0.25), sin(un.x * 57.0 + t * 0.2));
          const vec3 D0 = vec3(0.62, 0.48, -0.62), D1 = vec3(-0.21, 0.83, 0.52), D2 = vec3(0.77, -0.37, 0.52), D3 = vec3(-0.55, -0.6, -0.58), D4 = vec3(0.1, -0.71, 0.7);
          vec3 g = vec3(0.0);
          float f;
          f = 173.0; g += D0 * cos(dot(wp, D0) * f + t * 1.3) * (1.0 - smoothstep(0.25, 0.9, px * f));
          f = 211.0; g += D1 * cos(dot(wp, D1) * f - t * 1.1) * (1.0 - smoothstep(0.25, 0.9, px * f));
          f = 263.0; g += D2 * cos(dot(wp, D2) * f + t * 0.9) * (1.0 - smoothstep(0.25, 0.9, px * f));
          f = 317.0; g += D3 * cos(dot(wp, D3) * f - t * 1.5) * 0.8 * (1.0 - smoothstep(0.25, 0.9, px * f));
          f = 389.0; g += D4 * cos(dot(wp, D4) * f + t * 1.7) * 0.6 * (1.0 - smoothstep(0.25, 0.9, px * f));
          n += 0.03 * (g - vN * dot(g, vN));
        }
        n = normalize(n);
        float sunUp = dot(vN, uSun);
        float lit = smoothstep(-0.15, 0.35, sunUp);
        vec3 col = water * (0.12 + 0.88 * lit);
        vec3 hv = normalize(uSun + vView);
        float spec = pow(max(dot(n, hv), 0.0), 380.0) * 2.2 + pow(max(dot(vN, hv), 0.0), 40.0) * 0.18;
        col += vec3(1.0, 0.94, 0.82) * spec * lit;
        float fres = pow(1.0 - max(dot(vN, vView), 0.0), 4.0);
        col += vec3(0.32, 0.55, 0.95) * fres * 0.45 * lit;
        col *= 1.0 - cloudShadow(un) * 0.85;
        float dusk = smoothstep(-0.06, 0.06, sunUp) * (1.0 - smoothstep(0.06, 0.32, sunUp));
        col *= mix(vec3(1.0), vec3(1.35, 0.8, 0.55), dusk);

        // surf along the coasts
        float coast = smoothstep(0.035, 0.0, depth) * (0.55 + 0.45 * sin(uTime * 1.6 + un.x * 90.0 + un.z * 70.0));
        col += vec3(0.85, 0.95, 1.0) * coast * 0.35 * (0.3 + 0.7 * lit);

        // the Ocean of Data: faint streams of bits, brighter at night and when selected
        float lat = asin(clamp(vPos.y, -1.0, 1.0));
        float lon = atan(vPos.z, vPos.x);
        float rows = 70.0;
        float band = floor(lat * rows);
        float dirB = mod(band, 2.0) > 0.5 ? 1.0 : -1.0;
        float speed = (0.25 + h1(band) * 0.9) * dirB;
        float density = cos(lat) * 34.0 + 6.0;
        float x = lon * density + uTime * speed * 1.6;
        float cell = floor(x);
        float r = h2(vec2(cell, band));
        float bit = step(0.8, r) * smoothstep(0.0, 0.12, fract(x)) * smoothstep(0.95, 0.55, fract(x));
        float line = smoothstep(0.16, 0.0, abs(fract(lat * rows) - 0.5));
        float flick = 0.55 + 0.45 * sin(uTime * 3.0 + r * 40.0);
        float night = 1.0 - lit;
        vec3 bitCol = mix(vec3(0.25, 0.6, 1.0), vec3(0.75, 0.6, 1.0), h1(cell));
        col += bitCol * bit * line * flick * (0.07 + uHi * 0.6 + night * 0.35) * smoothstep(0.02, 0.15, depth);

        col += vec3(0.75, 0.9, 1.0) * (holeFoam * 0.9 + vSurge * 0.2);
        col += vec3(0.3, 0.55, 1.0) * uSpin * line * 0.3;
        col = mix(col, uFogCol, (1.0 - exp(-pow(uFog * vDist, 2.0))) * 0.92); // haze toward the horizon when you're down low
        gl_FragColor = vec4(col, uAlpha + bit * line * (1.0 - uAlpha) * 0.5);
      }`,
  }),
);
ocean.renderOrder = 1;
planet.add(ocean);

/* ------------------------------------------------------------------ clouds + atmosphere */



const CLOUD_R = 1.045; // high enough to fly beneath
const STORMS = [0, 1, 2].map(() => new THREE.Vector4(0, 1, 0, 0)); // storm cells: xyz where (cloud frame), w = lightning now
const clouds = new THREE.Mesh(
  new THREE.SphereGeometry(CLOUD_R, 128, 96),
  new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uSun: { value: sunDir }, uFade: { value: 1 }, uStorm: { value: STORMS }, ...WEATHER },
    transparent: true,
    depthWrite: false,
    vertexShader: `varying vec3 vPos; varying vec3 vN;
      void main(){ vPos = position; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform vec3 uSun; uniform float uFade; uniform vec4 uStorm[3]; varying vec3 vPos; varying vec3 vN;
      ${WEATHER_GLSL}
      void main(){
        float cover = cloudCover(vPos);
        // fine edges up close, so the baked map never looks soft
        cover = clamp(cover + (nz(vPos * 70.0) - 0.5) * 0.22 * smoothstep(0.02, 0.5, cover), 0.0, 1.0);
        vec3 un = normalize(vPos);
        float storm = 0.0, flash = 0.0;
        for (int i = 0; i < 3; i++) { // thunderheads: dense, dark-bottomed, lit from inside by lightning
          float d = dot(un, uStorm[i].xyz);
          if (d < 0.993) continue; // only work out storm detail right around a storm
          float cell = smoothstep(0.9955, 0.9995, d) * (0.75 + 0.5 * fbm3(vPos * 31.0 + uTime * 0.05));
          storm = max(storm, cell);
          flash += uStorm[i].w * smoothstep(0.993, 1.0, d) * (0.6 + 0.4 * fbm3(vPos * 60.0 + uTime));
        }
        cover = max(cover, clamp(storm, 0.0, 1.0));
        float sunUp = dot(vN, uSun);
        float lit = smoothstep(-0.22, 0.4, sunUp);
        vec3 tint = mix(vec3(1.0, 0.68, 0.48), vec3(1.0), smoothstep(-0.02, 0.3, sunUp)); // warm at dawn and dusk
        vec3 col = tint * (0.05 + 0.95 * lit) * mix(1.0, 0.62, storm);
        col += vec3(0.78, 0.85, 1.0) * flash * 2.6;
        gl_FragColor = vec4(col, clamp(cover * 0.85 + flash * 0.4, 0.0, 1.0) * uFade);
      }`,
  }),
);
clouds.renderOrder = 4;
planet.add(clouds);

// The atmosphere: a thin blue limb, orange where the sun is setting, nothing on the night side.
const ATMO_VS = `varying vec3 vN; varying vec3 vW;
  void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.06, 96, 64),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uSun: { value: sunDir } },
    vertexShader: ATMO_VS,
    fragmentShader: `uniform vec3 uSun; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float ndv = -dot(vN, V);                 // 0 at the outer edge, ~0.33 at the planet's limb
        float k = clamp(ndv / 0.33, 0.0, 1.0);
        float glow = pow(k, 2.2) * smoothstep(0.5, 0.36, ndv); // rim only, even when the planet turns see-through
        float sunUp = dot(vN, uSun);
        float day = smoothstep(-0.32, 0.2, sunUp);
        float dusk = smoothstep(-0.3, 0.02, sunUp) * (1.0 - smoothstep(0.02, 0.32, sunUp));
        vec3 col = vec3(0.3, 0.58, 1.0) * day + vec3(1.0, 0.42, 0.18) * dusk * 0.9;
        gl_FragColor = vec4(col * glow * 1.2, 1.0);
      }`,
  }),
);
atmosphere.renderOrder = 5;
scene.add(atmosphere);
const haze = new THREE.Mesh( // soft blue haze over the surface toward the edge, like looking through air
  new THREE.SphereGeometry(1.034, 96, 64),
  new THREE.ShaderMaterial({
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    uniforms: { uSun: { value: sunDir }, uFade: { value: 1 } },
    vertexShader: ATMO_VS,
    fragmentShader: `uniform vec3 uSun; uniform float uFade; varying vec3 vN; varying vec3 vW;
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float ndv = max(dot(vN, V), 0.0);
        float day = smoothstep(-0.25, 0.3, dot(vN, uSun));
        float h = pow(1.0 - ndv, 3.2) * day;
        gl_FragColor = vec4(vec3(0.35, 0.6, 1.0) * h * 0.6 * uFade, 1.0);
      }`,
  }),
);
haze.renderOrder = 5;
scene.add(haze);

/* ------------------------------------------------------------------ stars: the real night sky */

// Every star you can see with the naked eye, where it really is. The sky's north pole lines up with the world's
// spin axis, so the Southern Cross sits over the south and Polaris over the north.
const SKY_E = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, 1), EARTH_AXIS).normalize(); // right ascension 0
const SKY_F = new THREE.Vector3().crossVectors(EARTH_AXIS, SKY_E).normalize(); // right ascension 90
function skyDir(ra, dec) {
  const r = ra * DEG, d = dec * DEG;
  return SKY_E.clone().multiplyScalar(Math.cos(d) * Math.cos(r)).addScaledVector(SKY_F, Math.cos(d) * Math.sin(r)).addScaledVector(EARTH_AXIS, Math.sin(d));
}
function bvColor(bv) { // star colour from its B-V index: blue-white hot stars to orange-red cool ones
  const t = THREE.MathUtils.clamp((bv + 0.3) / 2.1, 0, 1);
  const stops = [[0, [0.62, 0.72, 1.0]], [0.18, [0.8, 0.86, 1.0]], [0.38, [1.0, 0.98, 0.95]], [0.6, [1.0, 0.86, 0.66]], [1, [1.0, 0.6, 0.38]]];
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const k = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return stops[i - 1][1].map((v, j) => v + (stops[i][1][j] - v) * k);
    }
  }
  return stops[stops.length - 1][1];
}
const SKY_R = 80;
{
  const N = STARS.length / 4, p = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const v = skyDir(STARS[i * 4], STARS[i * 4 + 1]).multiplyScalar(SKY_R);
    p.set([v.x, v.y, v.z], i * 3);
    const mag = STARS[i * 4 + 2];
    ph[i] = (i * 2.399) % 6.283;
    sz[i] = 0.7 + 4.2 * Math.pow(10, -0.4 * (mag + 1.5) * 0.42); // Sirius biggest, the faintest just a speck
    col.set(bvColor(STARS[i * 4 + 3]).map((c) => c * Math.min(1, 0.32 + Math.pow(10, -0.4 * (mag - 1.2)) * 0.68)), i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  const stars = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPR: { value: renderer.getPixelRatio() }, uSkyFade: SKY_FADE },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPR; attribute float aPhase; attribute float aSize; attribute vec3 aColor; varying float vA; varying vec3 vC;
      void main(){ vA = 0.78 + 0.22 * sin(uTime * (1.1 + fract(aPhase) * 2.0) + aPhase); vC = aColor; gl_PointSize = aSize * uPR;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uSkyFade; varying float vA; varying vec3 vC; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        float core = smoothstep(0.5, 0.0, d); core *= core;
        gl_FragColor = vec4(vC * 1.6, core * vA * uSkyFade); }`,
  }));
  stars.renderOrder = -1;
  scene.add(stars);

  // the constellation figures, drawn so faintly you only notice them when you look
  const lp = new Float32Array(LINES.length / 2 * 3);
  for (let i = 0; i < LINES.length / 2; i++) {
    const v = skyDir(LINES[i * 2], LINES[i * 2 + 1]).multiplyScalar(SKY_R + 1);
    lp.set([v.x, v.y, v.z], i * 3);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  const figures = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
    uniforms: { uSkyFade: SKY_FADE },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uSkyFade; void main(){ gl_FragColor = vec4(vec3(0.55, 0.62, 1.0) * 0.07 * uSkyFade, 1.0); }',
  }));
  figures.renderOrder = -1;
  scene.add(figures);
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

let cityPts, cityBeams;
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
        float night = smoothstep(0.15, -0.3, dot(normalize(position), uSun)); vP *= 0.7 + night * 0.2;
        float hov = 1.0 - step(0.5, abs(float(gl_VertexID) - uHover));
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vP *= smoothstep(0.18, 0.7, -mv.z); // up close the real town takes over from the glow
        gl_PointSize = min(70.0, (21.0 + hov * 30.0) * vP * uPR / -mv.z);
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
  cityBeams = new THREE.LineSegments(bg, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  planet.add(cityBeams);
}

/* ------------------------------------------------------------------ towns: real buildings, and the lights they make at night */

// Put an object flat on the ground at direction d (unit), turned by yaw.
const _gq = new THREE.Quaternion(), _gy = new THREE.Quaternion();
function groundMatrix(d, yaw, scale, lift, out) {
  const r = surfaceRadius(d) + lift;
  _gq.setFromUnitVectors(up, d).multiply(_gy.setFromAxisAngle(up, yaw));
  return out.compose(d.clone().multiplyScalar(r), _gq, scale);
}
// A random direction near d, about `ang` radians away.
function nearDir(d, ang, r) {
  const t1 = new THREE.Vector3().crossVectors(d, Math.abs(d.y) < 0.9 ? up : new THREE.Vector3(1, 0, 0)).normalize();
  const t2 = new THREE.Vector3().crossVectors(d, t1);
  const a = r() * Math.PI * 2;
  return d.clone().addScaledVector(t1, Math.cos(a) * ang).addScaledVector(t2, Math.sin(a) * ang).normalize();
}
const onLand = (d, min = 0.01) => { const t = terrain(d.x, d.y, d.z); return t.h > min && t.region !== UNCH && t.region >= 0; };
const gauss = (r) => (r() + r() + r() + r() - 2) * 0.87;

// Towns: buildings stand in the blocks of a street grid, tallest at the heart around the product's landmark tower.
// Each sits on the lowest point of its footprint, so nothing floats on a hillside.
const towns = { meshes: [], lightsDots: [], parkTrees: [] };
{
  const r = rng(4242);
  const PAINT_T = [ // per continent: wall paint, and how tall the heart of town gets
    { cols: ['#cdb08a', '#bf9a6a', '#e0cba6'], top: 0.005 }, // The Origins: sandstone
    { cols: ['#b9b3cf', '#d6d1e6', '#9d96b8'], top: 0.0075 }, // Memory: lavender stone
    { cols: ['#c8d6d4', '#e6ecec', '#9fb3b0'], top: 0.0105 }, // Intelligence: pale glass and steel
    { cols: ['#e3a090', '#efd29a', '#a9cfd6', '#c9b0e0'], top: 0.0065 }, // Creation: warm colour
    { cols: ['#f2f5f2', '#dfeee4', '#ffffff'], top: 0.012 }, // The Future: white towers
  ];
  const lists = { tower: [], setback: [], block: [], house: [], landmark: [] };
  const _q = new THREE.Quaternion(), _y = new THREE.Quaternion(), _x = new THREE.Vector3();
  // ground radius under a footprint: the lowest of its corners and centre
  const baseR = (d, t1, t2, hw, hd) => {
    let m = surfaceRadius(d);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([i, j]) => {
      m = Math.min(m, surfaceRadius(d.clone().addScaledVector(t1, i * hw).addScaledVector(t2, j * hd).normalize()));
    });
    return m;
  };
  const place = (kind, d, t1, t2, dims, col) => {
    const R = baseR(d, t1, t2, dims.x / 2, dims.z / 2) - 0.00012;
    _q.setFromUnitVectors(up, d);
    _x.set(1, 0, 0).applyQuaternion(_q);
    const yaw = Math.atan2(_x.clone().cross(t1).dot(d), _x.dot(t1)); // line the walls up with the streets
    const tryQ = (a) => _q.clone().multiply(_y.setFromAxisAngle(up, a));
    const qa = tryQ(yaw), qb = tryQ(-yaw);
    _q.copy(new THREE.Vector3(1, 0, 0).applyQuaternion(qa).dot(t1) > new THREE.Vector3(1, 0, 0).applyQuaternion(qb).dot(t1) ? qa : qb);
    lists[kind].push({ m: new THREE.Matrix4().compose(d.clone().multiplyScalar(R), _q.clone(), dims), col });
  };
  // One town: a street grid, tallest at the heart (with the product's landmark tower if it has one), houses and parks at the edge.
  const buildTown = (c, region, rad, top, landmarkColor) => {
    const P = PAINT_T[region];
    const { t1, t2 } = townFrame(c);
    const G = TOWN_GRID, inner = G - 0.00095;
    const at = (u, v) => c.clone().addScaledVector(t1, u).addScaledVector(t2, v).normalize();
    const n = Math.ceil(rad / G) + 1;
    for (let i = -n; i < n; i++) {
      for (let j = -n; j < n; j++) {
        const u = (i + 0.5) * G, v = (j + 0.5) * G, rc = Math.hypot(u, v);
        if (rc > rad) continue;
        const d = at(u, v);
        if (!onLand(d, 0.003)) continue;
        const col = () => new THREE.Color(P.cols[Math.floor(r() * P.cols.length)]);
        if (landmarkColor && i === 0 && j === 0) { // the heart of town: the product's landmark
          place('landmark', d, t1, t2, new THREE.Vector3(inner * 0.85, top * 1.35, inner * 0.85), landmarkColor);
          continue;
        }
        const k = 1 - rc / rad; // 1 at the centre, 0 at the edge
        const roll = r();
        if (k < 0.3 && roll < 0.3) { // a little park
          for (let tt = 0; tt < 3; tt++) towns.parkTrees.push(at(u + (r() - 0.5) * inner * 0.7, v + (r() - 0.5) * inner * 0.7));
          continue;
        }
        if (k < 0.35) { // houses on the edge of town: a few per block
          for (let hx = -1; hx <= 1; hx += 2) for (let hz = -1; hz <= 1; hz += 2) {
            if (r() < 0.25) continue;
            const sz = inner * 0.32;
            place('house', at(u + hx * inner * 0.24, v + hz * inner * 0.24), t1, t2, new THREE.Vector3(sz, sz * (0.75 + r() * 0.3), sz), col());
          }
          continue;
        }
        const h = top * (0.25 + k * k * 0.75) * (0.7 + r() * 0.45);
        const kind = k > 0.7 ? (roll < 0.6 ? 'tower' : 'setback') : (roll < 0.45 ? 'block' : roll < 0.75 ? 'setback' : 'tower');
        const w = inner * (0.72 + r() * 0.2), dd = inner * (0.72 + r() * 0.2);
        place(kind, d, t1, t2, new THREE.Vector3(w, Math.max(0.0018, h), dd), col());
      }
    }
  };
  // the product towns
  const PRODUCT_RAD = 0.0145;
  cities.forEach((ct) => {
    const c = ct.face.c.clone().normalize();
    ct.dir = c;
    buildTown(c, ct.region, PRODUCT_RAD, PAINT_T[ct.region].top * 1.25, ct.color.clone());
    PLACES.push({ dir: c, region: ct.region, rad: PRODUCT_RAD, product: ct });
  });
  // and the land fills up with towns of its own: every continent built over, in its own style
  {
    const want = Math.min(TOWN_MAX - PLACES.length, isSmall() || isTouch ? 60 : 120);
    for (let k = 0, made = 0; k < want * 60 && made < want; k++) {
      const f = landFaces[Math.floor(r() * landFaces.length)];
      if (f.region === UNCH || f.region < 0 || f.h < 0.03) continue;
      const c = f.c.clone().normalize();
      const rad = 0.008 + r() * 0.0045;
      if (PLACES.some((p) => p.dir.angleTo(c) < (p.rad + rad) * 1.6)) continue;
      buildTown(c, f.region, rad, PAINT_T[f.region].top * (0.45 + r() * 0.4), null);
      PLACES.push({ dir: c, region: f.region, rad });
      towns.lightsDots.push({ d: c, n: 160, spread: rad * 0.8, b: 0.7 });
      made++;
    }
  }
  PLACES.slice(0, TOWN_MAX).forEach((p, i) => TOWN_U.towns.value[i].set(p.dir.x, p.dir.y, p.dir.z, p.rad));
  TOWN_U.n.value = Math.min(TOWN_MAX, PLACES.length);
  // villages scattered across the land, between the towns
  for (let k = 0, made = 0; k < 3000 && made < (isSmall() || isTouch ? 120 : 300); k++) {
    const f = landFaces[Math.floor(r() * landFaces.length)];
    if (f.region === UNCH || f.h < 0.03) continue;
    const c = f.c.clone().normalize();
    if (PLACES.some((p) => p.dir.angleTo(c) < p.rad * 1.3)) continue; // not on top of a town
    made++;
    towns.lightsDots.push({ d: c, n: 18, spread: 0.004, b: 0.5 });
    const { t1, t2 } = townFrame(c);
    for (let j = 0; j < 6; j++) {
      const d = c.clone().addScaledVector(t1, (r() - 0.5) * 0.007).addScaledVector(t2, (r() - 0.5) * 0.007).normalize();
      if (!onLand(d, 0.004)) continue;
      const s = 0.0009 + r() * 0.0003;
      place('house', d, t1, t2, new THREE.Vector3(s, s * 0.9, s * 1.2), new THREE.Color(PAINT_T[f.region].cols[Math.floor(r() * 3)]));
    }
  }
  const mat = buildingMaterial({ sunDir, timeUniform: U.uTime });
  Object.keys(lists).forEach((kind) => {
    const list = lists[kind];
    if (!list.length) return;
    const mesh = new THREE.InstancedMesh(building(kind), mat, list.length);
    list.forEach((b, i) => { mesh.setMatrixAt(i, b.m); mesh.setColorAt(i, b.col); });
    mesh.renderOrder = 2;
    mesh.computeBoundingSphere();
    planet.add(mesh);
    towns.meshes.push(mesh);
  });
}

// The night-lights map: dense lit cores, suburbs, roads between neighbouring towns, scattered villages.
{
  const W = isSmall() || isTouch ? 2048 : 4096, H = W / 2;
  const cvs = document.createElement('canvas');
  cvs.width = W; cvs.height = H;
  const g = cvs.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  const r = rng(77777);
  const plot = (d, a) => {
    const lat = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)), lon = Math.atan2(-d.z, d.x);
    const x = (lon / (Math.PI * 2) + 0.5) * W, y = (0.5 - lat / Math.PI) * H;
    const wpx = Math.max(1, Math.round(1 / Math.max(0.2, Math.cos(lat))));
    g.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`;
    g.fillRect(Math.floor(x), Math.floor(y), wpx, 1);
  };
  const cluster = (c, n, spread, b) => {
    for (let k = 0; k < n; k++) {
      const d = nearDir(c, Math.abs(gauss(r)) * spread, r);
      if (onLand(d, 0.004)) plot(d, b * (0.4 + r() * 0.6));
    }
  };
  cities.forEach((ct) => {
    const c = ct.dir;
    cluster(c, 260, 0.007, 0.95); // the lit core
    cluster(c, 420, 0.022, 0.55); // suburbs
    // roads to the two nearest towns on the same continent
    cities.filter((o) => o !== ct && o.region === ct.region)
      .sort((a, b) => a.dir.angleTo(c) - b.dir.angleTo(c)).slice(0, 2)
      .forEach((o) => {
        const ang = c.angleTo(o.dir), q = new THREE.Quaternion().setFromUnitVectors(c, o.dir);
        const steps = Math.ceil(ang / 0.0009);
        const side = new THREE.Vector3().crossVectors(c, o.dir).normalize();
        const seed = r() * 100;
        for (let i = 0; i <= steps; i++) {
          const k = i / steps;
          const d = c.clone().applyQuaternion(new THREE.Quaternion().slerp(q, k));
          // roads wander with the land instead of running dead straight
          const wander = (fbm(d.x * 30 + seed, d.y * 30, d.z * 30, 3) * 0.05 + Math.sin(k * Math.PI * 3 + seed) * 0.012) * Math.sin(Math.PI * k) * Math.min(1, ang * 8);
          d.addScaledVector(side, wander).normalize();
          const j = nearDir(d, Math.abs(gauss(r)) * 0.001, r);
          if (onLand(j, 0.003) && r() < 0.5) plot(j, 0.16 + r() * 0.2);
        }
      });
  });
  towns.lightsDots.forEach((v) => cluster(v.d, v.n, v.spread, v.b));
  g.globalCompositeOperation = 'source-over';
  try { // a soft glow around everything
    g.globalCompositeOperation = 'lighter';
    g.globalAlpha = 0.45;
    g.filter = `blur(${W / 1400}px)`;
    g.drawImage(cvs, 0, 0);
    g.filter = 'none';
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  } catch (e) { /* no canvas filters: sharp lights are fine */ }
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.NoColorSpace;
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.wrapS = THREE.RepeatWrapping;
  WEATHER.uNight.value = tex;
}

/* ------------------------------------------------------------------ forests and plants: what grows on each continent */

const forestMeshes = []; // trimmed on slower devices
const flora = []; // everything that stands on the surface (hidden while you're down in Karma Core)
flora.push(...towns.meshes);
const MODEL_MAT = modelMaterial();
// Face the direction T (a tangent at d): returns the yaw for groundMatrix.
const _fx = new THREE.Vector3(), _fz = new THREE.Vector3();
function faceYaw(d, T) {
  _gq.setFromUnitVectors(up, d);
  _fx.set(1, 0, 0).applyQuaternion(_gq);
  _fz.set(0, 0, 1).applyQuaternion(_gq);
  return Math.atan2(T.dot(_fx), T.dot(_fz));
}
function scatterMesh(geo, list, mat = MODEL_MAT) {
  if (!list.length) return null;
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m4 = new THREE.Matrix4(), sc = new THREE.Vector3();
  list.forEach((it, i) => {
    sc.setScalar(it.s);
    mesh.setMatrixAt(i, groundMatrix(it.d, it.yaw, sc, it.lift ?? -0.0003, m4));
    mesh.setColorAt(i, it.c);
  });
  mesh.renderOrder = 2;
  mesh.computeBoundingSphere();
  planet.add(mesh);
  flora.push(mesh);
  return mesh;
}
{
  const FOREST = [ // per continent: what grows, its colours, how tall, how much
    { kinds: ['cactus', 'rock', 'rock'], cols: ['#6f8f4a', '#a07a50', '#8a6844'], h: [0.0012, 0.0022], n: 500 }, // The Origins: desert
    { kinds: ['round', 'round', 'tall'], cols: ['#7d6bc0', '#9a86d6', '#5f5199'], h: [0.0017, 0.003], n: 1800 }, // Memory: violet forest
    { kinds: ['pine', 'pine', 'pine'], cols: ['#2f7a68', '#3f9480', '#24604f'], h: [0.0019, 0.0033], n: 2000 }, // Intelligence: teal conifers
    { kinds: ['shrub', 'shrub', 'rock'], cols: ['#b0505e', '#c9705e', '#8e4a4a'], h: [0.001, 0.0018], n: 800 }, // Creation: rose scrub
    { kinds: ['tall', 'round', 'tall'], cols: ['#3e9a58', '#5cbf6e', '#2f7f46'], h: [0.002, 0.0035], n: 1800 }, // The Future: emerald groves
  ];
  const lists = {};
  const geos = {};
  const r = rng(9090);
  const scale = isSmall() || isTouch ? 0.45 : 1;
  FOREST.forEach((F, ri) => {
    const pool = byRegion[ri].filter((f) => f.h > 0.04);
    if (!pool.length) return;
    for (let i = 0, made = 0; i < F.n * 6 && made < F.n * scale; i++) {
      const f = pool[Math.floor(r() * pool.length)];
      const d = nearDir(f.c, r() * 0.006, r);
      // forests grow in patches, and keep clear of the towns
      if (fbm(d.x * 7 + ri, d.y * 7, d.z * 7) < -0.02) continue;
      if (PLACES.some((p) => p.dir.angleTo(d) < p.rad * 1.15)) continue;
      const kind = F.kinds[Math.floor(r() * F.kinds.length)];
      (lists[kind] = lists[kind] || []).push({ d, yaw: r() * 6.28, s: THREE.MathUtils.lerp(F.h[0], F.h[1], r()), c: new THREE.Color(F.cols[Math.floor(r() * F.cols.length)]).multiplyScalar(0.85 + r() * 0.3) });
      made++;
    }
  });
  // the little parks inside the towns
  towns.parkTrees.forEach((d) => {
    const t = terrain(d.x, d.y, d.z);
    if (t.h <= 0.003 || t.region < 0 || t.region === UNCH) return;
    const F = FOREST[t.region];
    (lists.round = lists.round || []).push({ d, yaw: r() * 6.28, s: 0.0016 + r() * 0.0008, c: new THREE.Color(F.cols[Math.floor(r() * F.cols.length)]).lerp(new THREE.Color('#4f8a4a'), 0.5) });
  });
  Object.keys(lists).forEach((k) => { geos[k] = tree(k); const m = scatterMesh(geos[k], lists[k]); if (m) forestMeshes.push({ m, full: m.count }); });
}

/* ------------------------------------------------------------------ robots: TD1's workers */

// Every continent has its trade: miners in The Origins, gardeners in Memory, surveyors in Intelligence,
// builders in Creation, welders in The Future. Couriers carry glowing blocks of data between towns.
const ROBOT_H = 0.0019;
const JOBS = ['pick', 'can', 'scanner', 'hammer', 'torch'];
const ROLE = { pick: 'Miner', can: 'Gardener', scanner: 'Surveyor', hammer: 'Builder', torch: 'Welder', walk: 'Courier' };
const CALL = { pick: 'DIG', can: 'BLOOM', scanner: 'SCAN', hammer: 'BLOK', torch: 'ARC', walk: 'POST' };
// What they say when you tap them.
const SAYS = {
  pick: ['Digging up the history of AI. Every layer down is an older idea.', 'Found a bit of 1956 down here. Dartmouth, I think.', 'Careful, this rock is older than the perceptron.'],
  can: ['Watering the memory gardens. What gets remembered, grows.', 'Every idea needs a little looking after.', 'These ones bloom when somebody recalls them.'],
  scanner: ['Scanning for unsolved problems. Found three before lunch.', 'Reasoning signal is strong today.', 'If it is hard, it is probably on one of those crystal peaks.'],
  hammer: ['Building tools for builders. Mind the blocks!', 'Measure twice, compile once.', 'Every block here is somebody’s next product.'],
  torch: ['Welding the next horizon together. Nearly there.', 'AI, then AGI, then AC. I am on the AC part.', 'Safety visor down. The future is bright.'],
  walk: ['Delivering a block of data. Do not drop it, do not drop it…', 'Express delivery between towns. No stopping. Well, for you.', 'This block is fresh. Just came out of Memory.'],
};
const PAINT = ['#f2f4f8', '#f2f4f8', '#ffb347', '#9fd3ff', '#c9b6ff', '#8ef0b8', '#ff9a8a', '#6a7080'];
const TYPES = ['tracked', 'walker', 'hover'];
const robots = [];
const robotParts = (() => {
  const nWork = isSmall() || isTouch ? 9 : 20, nWalk = isSmall() || isTouch ? 26 : 54;
  const r = rng(808);
  const props = { rock: [], round: [], blocks: [], pylon: [] };
  const named = (job) => `${CALL[job]}-${String(10 + Math.floor(r() * 89))}`;
  REGIONS.forEach((reg, ri) => {
    // towns to work near; The Origins has none, so its miners work the open desert
    const towns = PLACES.filter((p) => p.region === ri);
    const sites = towns.length ? towns : pickFaces(ri, nWork, 31, { minSep: 3, minH: 0.1 }).map((f) => ({ dir: f.c.clone().normalize(), rad: 0.004 }));
    for (let i = 0; i < nWork && sites.length; i++) {
      const home = sites[i % sites.length];
      let d = null;
      for (let k = 0; k < 20 && !d; k++) { const c = nearDir(home.dir, home.rad * 1.12 + r() * 0.004, r); if (onLand(c, 0.01)) d = c; } // just outside town
      if (!d) continue;
      // something to work on, just in front
      const at = nearDir(d, 0.0013, r);
      const T = at.clone().sub(d).normalize();
      const type = TYPES[Math.floor(r() * (JOBS[ri] === 'scanner' ? 3 : 2))]; // surveyors may hover
      const col = r() < 0.5 ? reg.col.clone().lerp(new THREE.Color('#ffffff'), 0.65) : new THREE.Color(PAINT[Math.floor(r() * PAINT.length)]);
      robots.push({ kind: 'work', job: JOBS[ri], type, d, yaw: faceYaw(d, T), baseYaw: faceYaw(d, T), phase: r() * 10, col, name: named(JOBS[ri]), react: -99 });
      const prop = { d: at, yaw: r() * 6.28, s: 0.0018, c: new THREE.Color('#ffffff') };
      if (ri === 0) props.rock.push({ ...prop, c: new THREE.Color('#9a7550') });
      else if (ri === 1) props.round.push({ ...prop, s: 0.0034, c: new THREE.Color('#9a86d6') });
      else if (ri === 3) props.blocks.push(prop);
      else if (ri === 4) props.pylon.push({ ...prop, s: 0.0038 });
    }
  });
  for (let i = 0; i < nWalk; i++) {
    const home = PLACES[Math.floor(r() * PLACES.length)];
    const type = r() < 0.4 ? 'hover' : (r() < 0.5 ? 'walker' : 'tracked');
    robots.push({ kind: 'walk', job: 'walk', type, from: home, to: home, t: 1, wait: r() * 3, speed: (type === 'hover' ? 0.018 : 0.012) + r() * 0.008, phase: r() * 10, q: null, angle: 1,
      carry: r() < 0.65, d: nearDir(home.dir, home.rad * 1.08, r), yaw: r() * 6, col: new THREE.Color(PAINT[Math.floor(r() * PAINT.length)]), name: named('walk'), react: -99 });
  }
  if (props.rock.length) scatterMesh(tree('rock'), props.rock);
  if (props.round.length) scatterMesh(tree('round'), props.round);
  { // builders' stacks of coloured blocks
    const g = merge([0, 1, 2, 3, 4, 5].map((k) => { const b = new THREE.BoxGeometry(0.3, 0.3, 0.3).toNonIndexed(); b.translate((k % 3) * 0.32 - 0.32, Math.floor(k / 3) * 0.31 + 0.15, k > 2 ? 0.05 : 0); const c = new THREE.Color().setHSL(k / 6, 0.7, 0.6); b.setAttribute('color', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count * 3).map((_, j) => [c.r, c.g, c.b][j % 3]), 3)); b.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count), 1)); return b; }));
    scatterMesh(g, props.blocks);
  }
  { // The Future's light pylons, being welded
    const g = merge([(() => { const b = new THREE.CylinderGeometry(0.06, 0.1, 1, 6).toNonIndexed(); b.translate(0, 0.5, 0); b.setAttribute('color', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count * 3).fill(0.95), 3)); b.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count), 1)); return b; })(),
      (() => { const b = new THREE.SphereGeometry(0.1, 10, 8).toNonIndexed(); b.translate(0, 1.05, 0); b.setAttribute('color', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count * 3).map((_, j) => [0.5, 1, 0.7][j % 3]), 3)); b.setAttribute('aGlow', new THREE.BufferAttribute(new Float32Array(b.attributes.position.count).fill(1), 1)); return b; })()]);
    scatterMesh(g, props.pylon);
  }

  const N = robots.length;
  const mk = (geo, n) => { const m = new THREE.InstancedMesh(geo, MODEL_MAT, Math.max(1, n)); m.renderOrder = 3; m.frustumCulled = false; planet.add(m); flora.push(m); return m; };
  const bodies = {};
  const builders = { tracked: robotBody, walker: robotWalker, hover: robotHover };
  TYPES.forEach((ty) => {
    const mine = robots.filter((rb) => rb.type === ty);
    bodies[ty] = mk(builders[ty](), mine.length);
    bodies[ty].count = mine.length;
    mine.forEach((rb, k) => { rb.slot = k; bodies[ty].setColorAt(k, rb.col); });
  });
  const arms = mk(robotArm(), N * 2), cube = mk(dataCube(), N);
  robots.forEach((rb, i) => { arms.setColorAt(i * 2, rb.col); arms.setColorAt(i * 2 + 1, rb.col); rb.pos = new THREE.Vector3(); });
  const tools = {};
  JOBS.forEach((j) => { tools[j] = mk(robotTool(j), N); tools[j].count = 0; });
  // sparks from the hammers and torches
  const sp = new Float32Array(N * 3), ss = new Float32Array(N);
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  sg.setAttribute('aSize', new THREE.BufferAttribute(ss, 1));
  const sparks = new THREE.Points(sg, new THREE.ShaderMaterial({
    uniforms: { uPR: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'uniform float uPR; attribute float aSize; varying float vS; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vS = aSize; gl_PointSize = min(40.0, aSize * 0.012 * uPR / -mv.z * 100.0); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying float vS; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5 || vS < 0.01) discard; gl_FragColor = vec4(vec3(1.0, 0.8, 0.45) * smoothstep(0.5, 0.0, d) * 2.0, 1.0); }',
  }));
  sparks.frustumCulled = false;
  sparks.renderOrder = 4;
  planet.add(sparks);
  flora.push(sparks);
  return { bodies, arms, cube, tools, sparks };
})();

const _rB = new THREE.Matrix4(), _rL = new THREE.Matrix4(), _rM = new THREE.Matrix4(), _rS = new THREE.Vector3(), _rV = new THREE.Vector3(), _rT = new THREE.Vector3();
const _rQ = new THREE.Quaternion();
function armMatrix(base, side, angle, out, type = 'tracked') { // angle swings the arm forward and up from the shoulder
  const [sx, sy] = SHOULDERS[type];
  _rL.makeRotationX(-angle).setPosition(side * sx, sy, 0);
  return out.multiplyMatrices(base, _rL);
}
const REACT_S = 4.8; // how long a tapped robot stops to say hello
function stepRobots(dt, t) {
  const { bodies, arms, cube, tools, sparks } = robotParts;
  JOBS.forEach((j) => { tools[j].count = 0; });
  let nCube = 0;
  const sp = sparks.geometry.attributes.position, ss = sparks.geometry.attributes.aSize;
  _rS.setScalar(ROBOT_H);
  robots.forEach((rb, i) => {
    let swingR = 0, swingL = 0, bob = 0, yawWobble = 0, spark = 0;
    const greeting = t - rb.react < REACT_S;
    if (rb.kind === 'walk') {
      if (greeting) { /* stand still and say hello */ } else if (rb.t >= 1) {
        rb.wait -= dt;
        if (rb.wait <= 0) { // off to the next town, usually a neighbour on the same continent
          // off to a nearby town on the same continent
          const same = PLACES.filter((c) => c.region === rb.to.region && c !== rb.to && c.dir.angleTo(rb.to.dir) < 0.35);
          const pool = same.length ? same : PLACES.filter((c) => c !== rb.to && c.dir.angleTo(rb.to.dir) < 0.6);
          rb.from = rb.to;
          rb.to = pool[Math.floor(Math.random() * pool.length)];
          rb.start = rb.d.clone();
          rb.goal = nearDir(rb.to.dir, rb.to.rad * 1.08, Math.random); // the edge of the next town
          rb.angle = Math.max(0.002, rb.start.angleTo(rb.goal));
          rb.q = new THREE.Quaternion().setFromUnitVectors(rb.start, rb.goal);
          rb.t = 0;
          rb.wait = 2 + Math.random() * 5;
        }
      } else {
        rb.t = Math.min(1, rb.t + (rb.speed * dt) / rb.angle);
        _rV.copy(rb.d);
        rb.d.copy(rb.start).applyQuaternion(_rQ.identity().slerp(rb.q, rb.t)).normalize();
        _rT.copy(rb.d).sub(_rV);
        if (_rT.lengthSq() > 1e-14) rb.yaw = faceYaw(rb.d, _rT.normalize());
      }
      const walking = rb.t < 1 && !greeting;
      swingR = walking ? Math.sin((t + rb.phase) * 9) * 0.5 : Math.sin((t + rb.phase) * 1.3) * 0.08;
      swingL = -swingR;
      bob = walking && rb.type !== 'hover' ? Math.abs(Math.sin((t + rb.phase) * 9)) * 0.05 : 0;
      if (rb.carry) { swingR = swingL = 2.85; } // holding a data block overhead
    } else {
      const w = t + rb.phase;
      rb.yaw = rb.baseYaw;
      switch (rb.job) {
        case 'pick': { const k = Math.pow(Math.max(0, Math.sin(w * 3.2)), 0.6); swingR = 2.4 - k * 2.2; swingL = swingR * 0.6; bob = (1 - k) * 0.02; break; }
        case 'hammer': { const k = Math.max(0, Math.sin(w * 5.5)); swingR = 1.7 - k * 1.3; swingL = 0.4; spark = k > 0.97 ? 1 : 0; break; }
        case 'scanner': swingR = 1.35; swingL = 0.15; yawWobble = Math.sin(w * 0.8) * 0.7; break;
        case 'can': swingR = 1.0 + Math.sin(w * 1.4) * 0.25; swingL = 0.1; yawWobble = Math.sin(w * 0.3) * 0.3; break;
        case 'torch': swingR = 1.45 + Math.sin(w * 13) * 0.05; swingL = 0.5; spark = Math.random() < 0.6 ? 0.6 + Math.random() * 0.6 : 0; break;
        default: break;
      }
    }
    if (greeting) { // turn to face you, hop, and wave
      const k = t - rb.react;
      _rT.copy(planetLocalCam).sub(rb.d);
      _rT.addScaledVector(rb.d, -_rT.dot(rb.d));
      if (_rT.lengthSq() > 1e-12) {
        const want = faceYaw(rb.d, _rT.normalize());
        let dy = want - rb.yaw;
        dy = Math.atan2(Math.sin(dy), Math.cos(dy));
        rb.yaw += dy * Math.min(1, k * 3); // swings round to look at you
      }
      yawWobble = 0;
      spark = 0;
      swingR = 2.75 + Math.sin(k * 14) * 0.38;
      swingL = rb.carry && rb.kind === 'walk' ? 2.85 : 0.25;
      if (rb.carry && rb.kind === 'walk') swingR = 2.85; // hands full: a happy bounce instead
      bob = k < 1.2 ? Math.abs(Math.sin(k * Math.PI * 2.5)) * 0.3 * (1.2 - k) : 0;
    }
    if (rb.type === 'hover') bob += 0.28 + Math.sin(t * 2.2 + rb.phase) * 0.04; // floats on its thruster ring
    groundMatrix(rb.d, rb.yaw + yawWobble, _rS, bob * ROBOT_H - 0.0002, _rB);
    rb.pos.setFromMatrixPosition(_rB).addScaledVector(rb.d, ROBOT_H * 0.6);
    bodies[rb.type].setMatrixAt(rb.slot, _rB);
    arms.setMatrixAt(i * 2, armMatrix(_rB, 1, swingR, _rM, rb.type));
    const tool = rb.kind === 'work' ? tools[rb.job] : null;
    if (tool) { tool.setMatrixAt(tool.count++, _rM); }
    arms.setMatrixAt(i * 2 + 1, armMatrix(_rB, -1, swingL, _rM, rb.type));
    if (rb.kind === 'walk' && rb.carry) {
      _rL.makeRotationY(t * 0.8 + rb.phase).setPosition(0, (rb.type === 'walker' ? 1.62 : 1.48) + Math.sin(t * 2 + rb.phase) * 0.02, 0);
      cube.setMatrixAt(nCube++, _rM.multiplyMatrices(_rB, _rL));
    }
    // sparks at the tool's tip
    if (spark > 0 && tool) {
      _rV.set(0, -0.36, rb.job === 'hammer' ? 0.36 : 0.3).applyMatrix4(armMatrix(_rB, 1, swingR, _rM, rb.type));
      sp.setXYZ(i, _rV.x, _rV.y, _rV.z);
      ss.setX(i, spark);
    } else ss.setX(i, Math.max(0, ss.getX(i) - dt * 8));
  });
  cube.count = nCube;
  [...Object.values(bodies), arms, cube, ...Object.values(tools)].forEach((m) => { m.instanceMatrix.needsUpdate = true; });
  sp.needsUpdate = true;
  ss.needsUpdate = true;
}

// Tap a robot: it stops, turns to you, waves, beeps, and tells you what it's up to.
const sayEl = document.createElement('div');
sayEl.id = 'bot-say';
sayEl.setAttribute('role', 'status');
document.body.appendChild(sayEl);
let sayBot = null;
function greetRobot(i) {
  const rb = robots[i];
  rb.react = clock.getElapsedTime();
  sayBot = rb;
  const lines = SAYS[rb.job];
  sayEl.innerHTML = `<b>${rb.name}</b><span>${ROLE[rb.job]}</span><p>${lines[Math.floor(Math.random() * lines.length)]}</p>`;
  sayEl.classList.add('on');
  score.beep();
}
function stepSay(t) {
  if (!sayBot) return;
  if (t - sayBot.react > REACT_S || coreMix > 0.1) { sayEl.classList.remove('on'); sayBot = null; return; }
  const s = toScreen(sayBot.pos.clone().addScaledVector(sayBot.d, ROBOT_H * 0.8));
  sayEl.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -100%)`;
  sayEl.style.visibility = s.z < 1 ? 'visible' : 'hidden';
}
// Ground height in a direction. Looked up a lot (everything that walks, flies or sails), so remembered on a fine grid.
function surfaceRadius(d) {
  const ix = Math.round(d.x * 6000), iy = Math.round(d.y * 6000), iz = Math.round(d.z * 6000);
  const key = ((ix + 7000) * 14001 + (iy + 7000)) * 14001 + (iz + 7000);
  let r = _srCache.get(key);
  if (r === undefined) {
    const t = terrain(d.x, d.y, d.z);
    r = t.h > 0 ? 1 + elevation(d.x, d.y, d.z, t.h, t.region) : 1.003;
    if (_srCache.size > 60000) _srCache.clear();
    _srCache.set(key, r);
  }
  return r;
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
    uniforms: { uTime: U.uTime, uAir: AIR },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute float aU; attribute vec2 aOff; attribute vec3 aColor; varying float vU; varying vec2 vO; varying vec3 vC;
      void main(){ vU = aU; vO = aOff; vC = aColor; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform float uTime; uniform float uAir; varying float vU; varying vec2 vO; varying vec3 vC;
      void main(){ float head = fract(uTime * 0.18 * vO.y + vO.x);
        float d = head - vU; float pulse = d >= 0.0 ? smoothstep(0.22, 0.0, d) : 0.0;
        gl_FragColor = vec4(vC * (0.07 + pulse * 1.3) * uAir, 1.0); }`,
  })));
}

/* ------------------------------------------------------------------ life in the air, on the sea and in orbit */

// Cargo drones: quadcopters carrying data blocks between towns, low over the land.
const drones = (() => {
  const N = isSmall() || isTouch ? 8 : 16, r = rng(3131), list = [];
  const mesh = new THREE.InstancedMesh(drone(), MODEL_MAT, N);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  planet.add(mesh);
  flora.push(mesh);
  for (let i = 0; i < N; i++) {
    const a = cities[Math.floor(r() * cities.length)];
    list.push({ a, b: a, t: 1, wait: r() * 4, speed: 0.03 + r() * 0.02, d: a.dir.clone(), phase: r() * 10, yaw: 0 });
  }
  return { mesh, list };
})();
const _dS = new THREE.Vector3(), _dM = new THREE.Matrix4(), _dT = new THREE.Vector3(), _dQ = new THREE.Quaternion(), _dTilt = new THREE.Matrix4();
function stepDrones(dt, t) {
  _dS.setScalar(0.0013);
  drones.list.forEach((dr, i) => {
    let lift = 0.0025;
    if (dr.t >= 1) {
      dr.wait -= dt;
      if (dr.wait <= 0) {
        dr.a = dr.b;
        const near = cities.filter((c) => c !== dr.a && c.dir.angleTo(dr.a.dir) < 0.6);
        dr.b = (near.length ? near : cities)[Math.floor(Math.random() * (near.length || cities.length))];
        dr.ang = Math.max(0.01, dr.a.dir.angleTo(dr.b.dir));
        dr.q = new THREE.Quaternion().setFromUnitVectors(dr.a.dir, dr.b.dir);
        dr.t = 0;
        dr.wait = 1.5 + Math.random() * 4;
      }
    } else {
      dr.t = Math.min(1, dr.t + (dr.speed * dt) / dr.ang);
      _dT.copy(dr.d);
      dr.d.copy(dr.a.dir).applyQuaternion(_dQ.identity().slerp(dr.q, dr.t)).normalize();
      _dT.subVectors(dr.d, _dT);
      if (_dT.lengthSq() > 1e-14) dr.yaw = faceYaw(dr.d, _dT.normalize());
      lift += Math.sin(Math.PI * dr.t) * Math.min(0.012, dr.ang * 0.05); // climb, cruise, descend
    }
    lift += Math.sin(t * 2.3 + dr.phase) * 0.0003; // hover wobble
    groundMatrix(dr.d, dr.yaw, _dS, Math.max(lift, 0.002), _dM);
    if (dr.t < 1) _dM.multiply(_dTilt.makeRotationX(0.18)); // lean into the flight
    drones.mesh.setMatrixAt(i, _dM);
  });
  drones.mesh.instanceMatrix.needsUpdate = true;
}

// Birds: flocks wheeling over the continents, wings flapping.
const flocks = (() => {
  const nF = isSmall() || isTouch ? 4 : 8, per = isSmall() || isTouch ? 9 : 14, r = rng(2727);
  const mat = modelMaterial({ flap: true, timeUniform: U.uTime });
  mat.side = THREE.DoubleSide;
  const mesh = new THREE.InstancedMesh(bird(), mat, nF * per);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  planet.add(mesh);
  flora.push(mesh);
  const list = [];
  for (let f = 0; f < nF; f++) {
    const home = landFaces[Math.floor(r() * landFaces.length)].c.clone().normalize();
    const birds = [];
    for (let k = 0; k < per; k++) birds.push({ off: new THREE.Vector3((r() - 0.5) * 2, (r() - 0.5) * 0.6, (r() - 0.5) * 2), ph: r() * 10 });
    list.push({ home, rad: 0.012 + r() * 0.02, w: (0.06 + r() * 0.05) * (r() < 0.5 ? 1 : -1), a: r() * 6.28, alt: 0.006 + r() * 0.006, birds, drift: new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize() });
  }
  return { mesh, list };
})();
const _bBank = new THREE.Quaternion(), _bN = new THREE.Vector3();
const _bC = new THREE.Vector3(), _bT1 = new THREE.Vector3(), _bT2 = new THREE.Vector3(), _bV = new THREE.Vector3(), _bP = new THREE.Vector3(), _bM = new THREE.Matrix4(), _bQ = new THREE.Quaternion(), _bS = new THREE.Vector3(), _bF = new THREE.Vector3(), _bU = new THREE.Vector3(), _bR = new THREE.Vector3(), _bBasis = new THREE.Matrix4();
function stepBirds(dt, t) {
  let n = 0;
  let nearest = 9;
  flocks.list.forEach((fl) => {
    fl.a += fl.w * dt * 6;
    fl.home.addScaledVector(fl.drift, dt * 0.0008).normalize(); // the flock wanders
    if (!onLand(fl.home, -0.2)) fl.drift.negate();
    _bT1.crossVectors(fl.home, Math.abs(fl.home.y) < 0.9 ? up : _bR.set(1, 0, 0)).normalize();
    _bT2.crossVectors(fl.home, _bT1);
    _bC.copy(fl.home).addScaledVector(_bT1, Math.cos(fl.a) * fl.rad).addScaledVector(_bT2, Math.sin(fl.a) * fl.rad).normalize();
    _bV.copy(_bT1).multiplyScalar(-Math.sin(fl.a)).addScaledVector(_bT2, Math.cos(fl.a)).multiplyScalar(Math.sign(fl.w)).normalize(); // heading
    const base = Math.max(surfaceRadius(_bC), 1.001) + fl.alt;
    fl.birds.forEach((b) => {
      const sway = Math.sin(t * 0.9 + b.ph);
      _bP.copy(_bC).multiplyScalar(base)
        .addScaledVector(_bT1, (b.off.x + sway * 0.3) * 0.0028)
        .addScaledVector(_bT2, (b.off.z + Math.cos(t * 0.7 + b.ph) * 0.3) * 0.0028)
        .addScaledVector(_bC, b.off.y * 0.0014);
      _bU.copy(_bP).normalize();
      _bF.copy(_bV).addScaledVector(_bU, -_bV.dot(_bU)).normalize();
      _bR.crossVectors(_bU, _bF).normalize();
      _bBasis.makeBasis(_bR, _bU, _bF);
      _bQ.setFromRotationMatrix(_bBasis);
      _bQ.multiply(_bBank.setFromAxisAngle(_bS.set(0, 0, 1), -Math.sign(fl.w) * 0.35)); // bank into the turn
      _bS.setScalar(0.0011);
      _bM.compose(_bP, _bQ, _bS);
      flocks.mesh.setMatrixAt(n++, _bM);
    });
    nearest = Math.min(nearest, _bN.copy(_bC).multiplyScalar(base).distanceTo(planetLocalCam));
  });
  flocks.mesh.instanceMatrix.needsUpdate = true;
  if (nearest < 0.05 && Math.random() < dt * 0.5) score.birds(1 - nearest / 0.05);
}

// Ships: container ships crossing the Ocean of Data, with wakes and navigation lights.
const ships = (() => {
  const N = isSmall() || isTouch ? 6 : 12, r = rng(6161);
  const mesh = new THREE.InstancedMesh(ship(7), MODEL_MAT, N);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  planet.add(mesh);
  flora.push(mesh);
  const wakeGeo = new THREE.PlaneGeometry(1, 1, 1, 1);
  wakeGeo.rotateX(-Math.PI / 2);
  wakeGeo.translate(0, 0, -0.5); // trails behind
  const wake = new THREE.InstancedMesh(wakeGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: U.uTime },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main(){
        float y = 1.0 - vUv.y; // 0 at the stern, 1 far behind
        float x = abs(vUv.x - 0.5) * 2.0;
        float edge = 0.12 + y * 0.85;
        float arms = exp(-pow((x - edge) / (0.05 + y * 0.1), 2.0)) * (1.0 - y);
        float churn = exp(-pow(x / (0.12 + y * 0.2), 2.0)) * pow(1.0 - y, 2.0) * (0.7 + 0.3 * sin(y * 60.0 - uTime * 8.0));
        gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * (arms * 0.5 + churn * 0.7), 1.0);
      }`,
  }), N);
  wake.frustumCulled = false;
  wake.renderOrder = 2;
  planet.add(wake);
  flora.push(wake);
  const sea = (d) => terrain(d.x, d.y, d.z).h < -0.04;
  const list = [];
  for (let i = 0, k = 0; i < N && k < 4000; k++) {
    const d = new THREE.Vector3(r() * 2 - 1, (r() * 2 - 1) * 0.8, r() * 2 - 1).normalize();
    if (!sea(d)) continue;
    list.push({ d, heading: null, left: 0, speed: 0.004 + r() * 0.003 });
    i++;
  }
  return { mesh, wake, list, sea };
})();
const _sM = new THREE.Matrix4(), _sS = new THREE.Vector3(), _sAx = new THREE.Vector3(), _sQ = new THREE.Quaternion();
function newCourse(sh) { // the longest clear run of sea from here, in one of a dozen directions
  const t1 = new THREE.Vector3().crossVectors(sh.d, Math.abs(sh.d.y) < 0.9 ? up : new THREE.Vector3(1, 0, 0)).normalize();
  const t2 = new THREE.Vector3().crossVectors(sh.d, t1);
  let best = null, bestLen = 0;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + Math.random() * 0.3;
    const T = t1.clone().multiplyScalar(Math.cos(a)).addScaledVector(t2, Math.sin(a));
    const axis = new THREE.Vector3().crossVectors(sh.d, T).normalize();
    let len = 0;
    for (; len < 1.2; len += 0.02) {
      const p = sh.d.clone().applyAxisAngle(axis, len + 0.02);
      if (!ships.sea(p)) break;
    }
    if (len > bestLen) { bestLen = len; best = axis; }
  }
  sh.axis = best || t1;
  sh.left = Math.max(0.05, bestLen - 0.02);
}
function stepShips(dt) {
  ships.list.forEach((sh, i) => {
    if (sh.left <= 0 || !sh.axis) newCourse(sh);
    const step = sh.speed * dt;
    sh.d.applyAxisAngle(sh.axis, step).normalize();
    sh.left -= step;
    const T = _sAx.crossVectors(sh.axis, sh.d).normalize(); // direction of travel
    const yaw = faceYaw(sh.d, T);
    _sS.setScalar(0.009);
    groundMatrix(sh.d, yaw, _sS, 0, _sM);
    _sM.setPosition(sh.d.x * 1.0004, sh.d.y * 1.0004, sh.d.z * 1.0004); // ride on the water, not the seabed
    ships.mesh.setMatrixAt(i, _sM);
    _sS.set(0.016, 1, 0.05);
    groundMatrix(sh.d, yaw, _sS, 0, _sM);
    _sM.setPosition(sh.d.x * 1.0007, sh.d.y * 1.0007, sh.d.z * 1.0007);
    _sM.multiply(_dTilt.makeTranslation(0, 0, -0.1));
    ships.wake.setMatrixAt(i, _sM);
  });
  ships.mesh.instanceMatrix.needsUpdate = true;
  ships.wake.instanceMatrix.needsUpdate = true;
  void _sQ;
}

// Satellites in low orbit, on tilted paths, with blinking lights.
const sats = (() => {
  const r = rng(5151), list = [];
  for (let i = 0; i < (isSmall() || isTouch ? 4 : 7); i++) {
    const g = satellite();
    const radius = 1.16 + r() * 0.42;
    const axis = new THREE.Vector3(r() - 0.5, 1.5, r() - 0.5).normalize().applyAxisAngle(new THREE.Vector3(1, 0, 0), (r() - 0.5) * 2.2).normalize();
    const start = new THREE.Vector3().crossVectors(axis, new THREE.Vector3(r(), r(), r())).normalize();
    planet.add(g);
    list.push({ g, radius, axis, start, w: 0.32 / Math.pow(radius, 1.5) * (r() < 0.2 ? -1 : 1), a: r() * 6.28, size: 0.016 + r() * 0.006 });
  }
  return list;
})();
const _sat = new THREE.Vector3();
function stepSats(dt, t) {
  sats.forEach((s, i) => {
    s.a += s.w * dt;
    _sat.copy(s.start).applyAxisAngle(s.axis, s.a).multiplyScalar(s.radius);
    s.g.position.copy(_sat);
    // panels face the sun; the dish points down at the world
    s.g.up.copy(s.axis);
    s.g.lookAt(planet.position);
    const d = s.g.getWorldPosition(_sat).distanceTo(camWorld);
    s.g.scale.setScalar(s.size * THREE.MathUtils.clamp((d - 0.04) / 0.25, 0.08, 1));
    s.g.userData.blink.visible = Math.sin(t * 3 + i * 2) > 0.92;
    s.g.visible = coreMix < 0.5;
  });
}

// A comet, far out, its tails always streaming away from the sun.
const comet = (() => {
  const g = new THREE.Group();
  const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35, 2), new THREE.MeshStandardMaterial({ color: '#8d8a85', roughness: 1 }));
  { // lumpy, like a real nucleus
    const p = nucleus.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      v.multiplyScalar(1 + fbm(v.x * 3, v.y * 3, v.z * 3, 3) * 0.5).multiply(new THREE.Vector3(1.3, 0.9, 1));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    nucleus.geometry.computeVertexNormals();
  }
  g.add(nucleus);
  const coma = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture([[0, 'rgba(235,250,255,0.95)'], [0.12, 'rgba(170,230,255,0.55)'], [0.4, 'rgba(110,190,255,0.14)'], [1, 'rgba(80,140,255,0)']]),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  coma.scale.setScalar(5);
  g.add(coma);
  const tail = (len, rad, col, bend) => {
    const geo = new THREE.ConeGeometry(rad, len, 32, 24, true);
    geo.rotateX(-Math.PI / 2);
    geo.translate(0, 0, len / 2);
    const p = geo.attributes.position; // curve the dust tail a little
    for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setX(i, p.getX(i) + bend * (z / len) * (z / len) * len); }
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color(col) }, uLen: { value: len } },
      vertexShader: 'uniform float uLen; varying float vZ; varying vec3 vN; varying vec3 vV; void main(){ vZ = position.z / uLen; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uTime; uniform vec3 uCol; varying float vZ; varying vec3 vN; varying vec3 vV;
        void main(){
          float edge = pow(abs(dot(vN, vV)), 1.4);
          float a = pow(1.0 - vZ, 1.8) * smoothstep(0.0, 0.05, vZ) * edge;
          a *= 0.8 + 0.2 * sin(vZ * 40.0 - uTime * 2.0);
          gl_FragColor = vec4(uCol * a * 0.55, 1.0);
        }`,
    }));
    g.add(m);
    return m;
  };
  tail(24, 0.7, '#7fc4ff', 0); // ion tail: straight, blue
  tail(16, 1.7, '#ffe3b0', 0.35); // dust tail: wider, curved, golden
  scene.add(g);
  return { g, A: new THREE.Vector3(0.2, 0.55, -0.8).normalize(), B: new THREE.Vector3(-0.9, 0.1, -0.2).normalize() };
})();
function stepComet(t) {
  const a = 0.6 + t * 0.0025;
  comet.g.position.copy(comet.A).multiplyScalar(Math.cos(a)).addScaledVector(comet.B, Math.sin(a)).normalize().multiplyScalar(48);
  comet.g.lookAt(comet.g.position.clone().sub(sunDir)); // +z (the tails) points away from the sun
  comet.g.visible = SKY_FADE.value > 0.05;
}

const planetLocalCam = new THREE.Vector3();
const lifeClock = { frame: 0, acc: 0 };
function stepLife(dt, t) {
  planetLocalCam.copy(camWorld);
  planet.worldToLocal(planetLocalCam);
  stepSats(dt, t);
  // from orbit the little things are a pixel or two: update them a quarter as often and save the phone the work
  lifeClock.acc += dt;
  const close = camWorld.length() < 1.7;
  if (!close && (lifeClock.frame++ % 4) !== 0) return;
  const step = lifeClock.acc;
  lifeClock.acc = 0;
  stepRobots(step, t);
  stepDrones(step, t);
  stepBirds(step, t);
  stepShips(step);
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
    g.scale.setScalar(0.7);
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
  // A real moon surface: maria, highlands, bowl craters with raised rims, and bright rays from young impacts.
  const MOON_R = 0.2;
  const body = (() => {
    const ico = new THREE.IcosahedronGeometry(1, isSmall() || isTouch ? 40 : 56);
    const src = ico.attributes.position;
    const r = rng(4242);
    const craters = [];
    for (let i = 0; i < 230; i++) {
      const c = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize();
      const size = 0.025 + Math.pow(r(), 3.2) * 0.32; // many small, a few big
      craters.push({ c, size, depth: size * (0.35 + r() * 0.25), young: size > 0.12 && r() < 0.35, seed: r() * 100 });
    }
    const map = new Map(), pos = [], col = [], index = [];
    const tmp = new THREE.Vector3(), cc = new THREE.Color();
    const vert = (i) => {
      const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
      const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
      let idx = map.get(key);
      if (idx !== undefined) return idx;
      tmp.set(x, y, z);
      const mare = sstep(fbm(x * 1.6 + 9, y * 1.6 + 2, z * 1.6 + 5, 4), 0.02, 0.16); // dark basalt plains
      let h = fbm(x * 9, y * 9, z * 9, 4) * 0.007 * (1 - mare * 0.7);
      let bright = 0, floor = 0;
      for (const k of craters) {
        const d = Math.acos(Math.min(1, Math.max(-1, tmp.dot(k.c))));
        if (d > k.size * 3.2) continue;
        const t = d / k.size;
        if (t < 1) { h += k.depth * (t * t - 1) * (1 - mare * 0.4); floor = Math.max(floor, 1 - t); }
        h += k.depth * 0.45 * Math.exp(-Math.pow((t - 1) / 0.22, 2)); // raised rim
        if (t > 0.9 && t < 1.15) bright = Math.max(bright, 0.35);
        if (k.young && t < 3.2) { // ejecta rays
          const tangent = new THREE.Vector3().crossVectors(k.c, tmp);
          const ang = Math.atan2(tangent.dot(new THREE.Vector3(0, 1, 0)), tangent.dot(new THREE.Vector3(1, 0, 0)));
          const ray = Math.pow(Math.max(0, Math.sin(ang * 9 + k.seed) * Math.sin(ang * 5.3 + k.seed * 2)), 3);
          bright = Math.max(bright, ray * (1 - t / 3.2) * 0.8 + (t < 1.6 ? 0.25 : 0));
        }
      }
      const rad = 1 + h * 0.08; // a clean round moon, like the emblem's
      pos.push(x * rad, y * rad, z * rad);
      const g = 0.72 - mare * 0.36 - floor * 0.06 + bright * 0.22 + fbm(x * 20, y * 20, z * 20, 2) * 0.06;
      cc.setRGB(g, g * 0.98, g * 1.04); // the faintest cool tint
      col.push(cc.r, cc.g, cc.b);
      idx = pos.length / 3 - 1;
      map.set(key, idx);
      return idx;
    };
    for (let i = 0; i < src.count; i += 3) index.push(vert(i), vert(i + 1), vert(i + 2));
    ico.dispose();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(index);
    g.computeVertexNormals();
    g.scale(MOON_R, MOON_R, MOON_R);
    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xb9bbc3, roughness: 1, metalness: 0, emissive: 0xa4a9bb, emissiveIntensity: 0.3 }); // moonlight silver, never navy
    // The Mindaloo rune is printed on the moon itself: projected onto its face from wherever you look, so it curves
    // with the surface, takes the light, and sits dead centre. Etched dark into the stone, with a soft silver inlay.
    const runeTex = new THREE.TextureLoader().load('world/assets/mindaloo-rune.png');
    mat.userData.rune = { tex: { value: runeTex }, c: { value: new THREE.Vector3() }, r: { value: 0.16 } };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uRune = mat.userData.rune.tex;
      sh.uniforms.uRuneC = mat.userData.rune.c;
      sh.uniforms.uRuneR = mat.userData.rune.r;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D uRune; uniform vec3 uRuneC; uniform float uRuneR;')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          vec2 ruv = (-vViewPosition.xy - uRuneC.xy) / (2.0 * uRuneR) + 0.5;
          float rune = 0.0;
          if (ruv.x > 0.0 && ruv.x < 1.0 && ruv.y > 0.0 && ruv.y < 1.0) rune = texture2D(uRune, ruv).r;
          diffuseColor.rgb *= 1.0 - rune * 0.55;
          totalEmissiveRadiance += vec3(0.86, 0.88, 1.0) * rune * 0.55;`);
    };
    const m = new THREE.Mesh(g, mat);
    return m;
  })();
  // soft halo of moonlight
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(225,220,255,0.32)');
  grad.addColorStop(0.35, 'rgba(193,162,255,0.18)');
  grad.addColorStop(1, 'rgba(193,162,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const haloTex = new THREE.CanvasTexture(c);
  haloTex.colorSpace = THREE.SRGBColorSpace;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(1.15);
  halo.visible = false; // the emblem's crown is the glow now
  const light = new THREE.PointLight(0xc9d4ff, 1.4, 4, 2);
  mindaloo.add(halo, body, light);
  mindaloo.userData.body = body;
  mindaloo.userData.halo = halo;

  // The Mindaloo emblem, in the sky: the two crescents and the crown of silver thorns ring the real moon,
  // and the Mindaloo rune glows on its face. Black in the artwork adds nothing, so only the silver shows.
  // Measured from the artwork: its moon is 178 px across the radius, centred at (733, 463) of 1448 × 1086.
  const px = MOON_R / 178;
  const loader = new THREE.TextureLoader();
  const sprite = (file, w, h, cx, cy, opacity) => {
    const tex = loader.load(file);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xe4e8ff, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.set(w * px, h * px, 1);
    sp.center.set(cx, cy);
    sp.renderOrder = 6; // after the planet's surface and air, so they don't paint over it
    mindaloo.add(sp);
    return sp;
  };
  mindaloo.userData.crown = sprite('world/assets/mindaloo-halo.png', 1448, 1086, 733 / 1448, 1 - 463 / 1086, 0.75);
  // The two crescents are real moons: same cratered surface, lit from behind and to the outside so they read as
  // a waxing and a waning crescent from any angle, exactly where they sit in the emblem.
  const crescentMat = (side) => new THREE.ShaderMaterial({
    uniforms: { uSide: { value: side }, uRight: CAM_RIGHT, uUp: CAM_UP },
    transparent: true, depthWrite: false, // the unlit side is see-through, as in the emblem: only the crescent shows
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vW;
      void main(){ vN = normalize(mat3(modelMatrix) * normal); vP = position; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uSide; uniform vec3 uRight; uniform vec3 uUp; varying vec3 vN; varying vec3 vP; varying vec3 vW;
      ${GLSL_NOISE}
      void main(){
        // lit from behind and to the outside, measured against your own line of sight: the same thin crescent from anywhere
        vec3 V = normalize(cameraPosition - vW);
        vec3 L = normalize(uSide * uRight * 0.72 + uUp * 0.08 - V * 0.69);
        float lit = smoothstep(0.0, 0.28, dot(normalize(vN), L));
        vec3 p = normalize(vP);
        float mare = smoothstep(0.5, 0.62, fbm(p * 2.4 + 7.0)); // dark seas
        float g = 0.82 - mare * 0.26 + (fbm(p * 11.0) - 0.5) * 0.18; // and cratered highlands
        gl_FragColor = vec4(vec3(g) * vec3(0.95, 0.96, 1.0) * 1.05, lit);
      }`,
  });
  const crescentGeo = new THREE.SphereGeometry(MOON_R * 168 / 178, 48, 32);
  const cres = (side) => {
    const c = new THREE.Mesh(crescentGeo, crescentMat(side));
    c.renderOrder = 6;
    mindaloo.add(c);
    return c;
  };
  mindaloo.userData.crescents = [cres(-1), cres(1)];
  mindaloo.userData.MOON_R = MOON_R;
  mindaloo.userData.px = px;
}
mindaloo.position.set(-3.1, 0, 0); // the flagship keeps a wide, stately orbit, clear of the world
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
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
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

// The TD1 logo, drawn in light around the heart: three triangles.
const LOGO_TRIS = [[[40, 269], [218, 153], [218, 386]], [[242, 8], [438, 135], [242, 262]], [[242, 277], [438, 404], [242, 531]]];
const knot = new THREE.LineSegments(
  new THREE.BufferGeometry().setFromPoints(
    LOGO_TRIS.flatMap((tri) => tri.flatMap((p, i) => [p, tri[(i + 1) % 3]]))
      .map(([x, y]) => new THREE.Vector3((x - 239) * (0.68 / 523), (270 - y) * (0.68 / 523), 0)),
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
  haze.material.uniforms.uFade.value = 1 - m;
  peaks.forEach((p) => { p.obj.visible = m < 0.5; });
  flora.forEach((f) => { f.visible = m < 0.5; });
  monoliths.forEach((o) => { o.obj.visible = m < 0.5; });
  shells.forEach((sh, i) => { sh.material.uniforms.uAlpha.value = ss(m, i * 0.1, i * 0.1 + 0.45); });
  const beat = Math.pow(Math.max(0, Math.sin(t * 3.9)), 12) + 0.6 * Math.pow(Math.max(0, Math.sin(t * 3.9 - 0.9)), 12);
  const grow = 0.3 + 0.7 * ss(m, 0.3, 1);
  coreBall.scale.setScalar(grow * (1 + beat * 0.05));
  coreBall.material.uniforms.uBeat.value = beat;
  if (m > 0.5 && beat > 0.8 && !(applyCore.lastBeat > 0.8)) score.thump();
  applyCore.lastBeat = beat;
  coreHalo.scale.setScalar(1.7 * grow * (1 + beat * 0.2));
  coreHalo.material.opacity = ss(m, 0.2, 0.8);
  coreLight.intensity = ss(m, 0.3, 1) * (1.2 + beat * 0.8);
  knot.material.opacity = ss(m, 0.5, 1) * 0.55;
  knot.quaternion.copy(camWorldQ);
  knot.rotateZ(Math.sin(t * 0.3) * 0.06); // upright, swaying gently
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
  score.splash();
  const oc = ocean.material.uniforms;
  // the water keeps moving the way the surface was moving when the world stopped
  const toLocal = planet.quaternion.clone().invert();
  const camDir = camWorld.clone().normalize().applyQuaternion(toLocal);
  const dir = new THREE.Vector3().crossVectors(spin.axisWorld.clone().applyQuaternion(toLocal), camDir);
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
      spin.w.multiplyScalar(Math.exp(-dt * (spin.energy > 0.3 ? 0.45 : spin.dist < 1.2 ? 3.2 : 1.7))); // a long, easy glide
      // left alone, it turns on a tilted axis like Earth
      const idle = THREE.MathUtils.clamp((now - lastInteract - 3000) / 4000, 0, 1);
      if (!selected && !reduceMotion && idle > 0) {
        _sq.setFromAxisAngle(EARTH_AXIS, -0.06 * dt * idle * Math.min(1, (spin.dist - 1) / 0.6));
        spin.qT.premultiply(_sq);
      }
    }
    // the view glides after the target: smooth however unevenly touch events arrive
    spin.q.slerp(spin.qT, 1 - Math.exp(-dt * (spin.dragging ? 26 : 16))).normalize();
    spin.dist += (spin.target - spin.dist) * (1 - Math.exp(-dt * 7));
    if (spin.dist < 1.1) { // stay above the ground
      _sv.set(0, 0, 1).applyQuaternion(spin.qT);
      const floor = surfaceRadius(_sv) + GROUND_CLEAR;
      if (spin.dist < floor) spin.dist = floor;
      if (spin.target < floor) spin.target = floor;
    }
    placeCamera();
  }
  // track how wildly it is spinning
  const speed = spin.w.length();
  if (speed > 0.01) spin.axisWorld.copy(spin.w).applyQuaternion(spin.q).normalize().negate();
  if (!reduceMotion && speed > 7 && spin.dist > 1.4) spin.energy = Math.min(1, spin.energy + dt * 0.55);
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


/* storms: thunderheads that flicker with lightning, loudest on the night side */
const _pq = new THREE.Quaternion(), _cm = new THREE.Matrix4();
const storms = STORMS.map((v, i) => ({ v, next: 2 + i * 3, burst: 0, moveAt: 0, gap: 0 }));
function stepStorms(t, dt) {
  storms.forEach((st, i) => {
    if (t > st.moveAt) { // drift to a new spot now and then, over the warm seas between latitudes 45 S and 45 N
      st.moveAt = t + 45 + Math.random() * 40;
      const lat = (Math.random() * 2 - 1) * 45, lon = Math.random() * 360;
      st.v.set(...latLon(lat, lon).toArray(), 0);
    }
    if (reduceMotion) { st.v.w = 0; return; }
    if (t > st.next) { st.burst = 2 + Math.floor(Math.random() * 3); st.next = t + 3 + Math.random() * 7; st.gap = 0; }
    st.gap -= dt;
    if (st.burst > 0 && st.gap <= 0) {
      st.burst--;
      st.v.w = 0.7 + Math.random() * 0.5;
      st.gap = 0.07 + Math.random() * 0.18;
      if (st.burst === 0) { // thunder for the storm you can see, softer the further it is
        const w = new THREE.Vector3(st.v.x, st.v.y, st.v.z).applyMatrix4(_cm.makeRotationY(clouds.rotation.y)).applyQuaternion(planet.quaternion).multiplyScalar(CLOUD_R);
        const facing = w.clone().normalize().dot(camWorld.clone().normalize());
        if (facing > 0.3) score.thunder(Math.min(1, 0.4 / Math.max(0.1, w.distanceTo(camWorld) - 0.2)));
      }
    }
    st.v.w *= Math.exp(-dt * 16);
  });
}


/* aurora: curtains of light that ripple over both poles on the night side */
{
  const SEG = 360;
  [1, -1].forEach((pole) => {
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG, lon = u * 360;
      const lat = pole * (67 + Math.sin(u * Math.PI * 2 * 3 + pole) * 3.5 + Math.sin(u * Math.PI * 2 * 7) * 1.2);
      const d = latLon(lat, lon);
      const b = d.clone().multiplyScalar(1.014), t = d.clone().multiplyScalar(1.075);
      pos.push(b.x, b.y, b.z, t.x, t.y, t.z);
      uv.push(u, 0, u, 1);
      if (i < SEG) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { uTime: U.uTime, uSun: { value: sunDir } },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.0); }`,
      fragmentShader: `uniform float uTime; uniform vec3 uSun; varying vec2 vUv; varying vec3 vW;
        ${GLSL_NOISE}
        void main(){
          float x = vUv.x * 260.0;
          float rays = fbm(vec3(x * 0.18, uTime * 0.25, 0.0)) * 0.7 + fbm(vec3(x * 0.9, uTime * 0.6, 3.0)) * 0.5;
          float folds = fbm(vec3(vUv.x * 18.0 + uTime * 0.05, uTime * 0.08, 7.0));
          float v = vUv.y;
          float shape = smoothstep(0.0, 0.08, v) * pow(1.0 - v, 1.6);
          vec3 col = mix(vec3(0.15, 1.0, 0.5), vec3(0.75, 0.25, 0.95), smoothstep(0.35, 0.95, v));
          float night = smoothstep(0.1, -0.25, dot(normalize(vW), uSun));
          float a = shape * smoothstep(0.35, 0.8, rays) * smoothstep(0.3, 0.6, folds) * night;
          gl_FragColor = vec4(col * a * 2.0, 1.0);
        }`,
    }));
    m.renderOrder = 5;
    planet.add(m);
    flora.push(m);
  });
}

/* ------------------------------------------------------------------ labels */

const labelLayer = $('#labels');
const labels = [];
function addLabel(html, cls, getPos, onClick, opts = {}) {
  const el = document.createElement('button');
  el.className = `label ${cls}`;
  el.innerHTML = html;
  el.type = 'button';
  el.addEventListener('click', (e) => { e.stopPropagation(); if (e.detail === 0) onClick(); }); // keyboard
  el.addEventListener('pointerdown', (e) => { e.preventDefault(); pointerDown(e, onClick); }); // drags pass through to the world
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
const _mW = new THREE.Vector3(), _mW2 = new THREE.Vector3(), _mW3 = new THREE.Vector3();
const _mInv = new THREE.Matrix4(), _mDir = new THREE.Vector3(), _mUp = new THREE.Vector3(), _mRight = new THREE.Vector3(), _mQ = new THREE.Quaternion();
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
addLabel('<span class="nm">Mindaloo AC</span><span class="era">Flagship · Moonlight</span>', 'moon mindaloo', () => mindaloo.getWorldPosition(new THREE.Vector3()).add(camAxis(1).multiplyScalar(0.32)), () => openSpecial('mindaloo'), { surface: false });

/* ------------------------------------------------------------------ deep space: a sky with real depth */

// Far: a nebula dome with a Milky Way band and dust lanes.
const BAND_N = skyDir(192.86, 27.13); // the real galactic pole: the Milky Way runs where it does in our sky
const nebula = new THREE.Mesh(new THREE.SphereGeometry(95, 160, 120), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false,
  uniforms: { uTime: U.uTime, uBand: { value: BAND_N }, uSkyFade: SKY_FADE },
  fragmentShader: `uniform float uSkyFade; varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol * uSkyFade, 1.0); }`,
  vertexShader: `uniform float uTime; uniform vec3 uBand; varying vec3 vCol;
    ${GLSL_NOISE}
    void main(){
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vec3 d = normalize(position);
      float b = dot(d, uBand);
      float band = exp(-b * b * 26.0);
      float n = fbm(d * 2.6 + vec3(0.0, uTime * 0.004, 0.0));
      float n2 = fbm(d * 7.0 + 11.0);
      float n3 = fbm(d * 3.8 + 31.0);
      vec3 col = vec3(0.32, 0.2, 0.62) * smoothstep(0.48, 0.86, n) * 0.32;
      col += vec3(0.08, 0.42, 0.52) * smoothstep(0.55, 0.9, n3) * 0.22;
      col += vec3(0.72, 0.66, 0.95) * band * (0.2 + n2 * 0.55) * 0.3;
      col *= 1.0 - band * smoothstep(0.52, 0.7, n2) * 0.65; // dark dust lanes
      vCol = max(col, 0.0);
    }`,
}));
nebula.renderOrder = -2;
scene.add(nebula);

// Middle: a dense river of stars along the band.
{
  const N = 3200, p = new Float32Array(N * 3), ph = new Float32Array(N), sz = new Float32Array(N);
  const r = rng(1234);
  const a = new THREE.Vector3(1, 0, 0).cross(BAND_N).normalize(), bvec = new THREE.Vector3().crossVectors(BAND_N, a);
  for (let i = 0; i < N; i++) {
    const ang = r() * Math.PI * 2;
    const g = (r() + r() + r() - 1.5) * 0.22; // gaussian-ish spread off the band
    const v = a.clone().multiplyScalar(Math.cos(ang)).add(bvec.clone().multiplyScalar(Math.sin(ang))).add(BAND_N.clone().multiplyScalar(g)).normalize().multiplyScalar(70 + r() * 15);
    p.set([v.x, v.y, v.z], i * 3);
    ph[i] = r() * 6.28;
    sz[i] = 0.4 + Math.pow(r(), 8) * 2.2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
  const band = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPR: { value: renderer.getPixelRatio() }, uSkyFade: SKY_FADE },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPR; uniform float uSkyFade; attribute float aPhase; attribute float aSize; varying float vA;
      void main(){ vA = (0.45 + 0.35 * sin(uTime * 0.9 + aPhase)) * uSkyFade; gl_PointSize = aSize * uPR;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.9, 0.88, 1.0), smoothstep(0.5, 0.0, d) * vA); }`,
  }));
  band.renderOrder = -1;
  scene.add(band);
}

// Far off: a ringed gas giant and a distant galaxy.
const giant = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.SphereGeometry(3.2, 48, 32), new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir }, uTime: U.uTime },
    vertexShader: `varying vec3 vP; varying vec3 vN; void main(){ vP = position; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `uniform vec3 uSun; uniform float uTime; varying vec3 vP; varying vec3 vN;
      ${GLSL_NOISE}
      void main(){
        float y = vP.y / 3.2;
        float bands = sin(y * 22.0 + fbm(vP * 0.9 + vec3(uTime * 0.01, 0.0, 0.0)) * 4.0);
        vec3 col = mix(vec3(0.85, 0.62, 0.55), vec3(0.55, 0.45, 0.85), 0.5 + 0.5 * bands);
        float lit = 0.08 + 0.92 * max(dot(vN, uSun), 0.0);
        gl_FragColor = vec4(col * lit * 0.75, 1.0);
      }`,
  }));
  const ringGeo = new THREE.RingGeometry(4.3, 7.2, 96, 1);
  const ring = new THREE.Mesh(ringGeo, new THREE.ShaderMaterial({
    side: THREE.DoubleSide, transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vU; void main(){ vU = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `varying vec2 vU; void main(){ float r = length(vU); float t = (r - 4.3) / 2.9;
        float bands = 0.55 + 0.45 * sin(r * 9.0) * sin(r * 3.1);
        float a = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.85, t) * bands * 0.5;
        gl_FragColor = vec4(vec3(0.9, 0.82, 0.78) * 0.7, a); }`,
  }));
  ring.rotation.x = Math.PI / 2.4;
  giant.add(body, ring);
  giant.position.set(-0.62, 0.22, -0.75).normalize().multiplyScalar(72);
  giant.rotation.z = 0.35;
  scene.add(giant);

  const galaxy = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture([[0, 'rgba(255,245,235,0.95)'], [0.08, 'rgba(230,200,255,0.6)'], [0.35, 'rgba(150,120,255,0.18)'], [1, 'rgba(90,60,200,0)']]),
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, rotation: 0.6,
  }));
  galaxy.scale.set(16, 6, 1);
  galaxy.position.set(0.7, -0.35, 0.62).normalize().multiplyScalar(85);
  scene.add(galaxy);
}

// Near: fine space dust drifting close to the planet. It slides past the far sky as the view moves.
const dust = (() => {
  const N = isSmall() || isTouch ? 500 : 900, p = new Float32Array(N * 3), ph = new Float32Array(N);
  const r = rng(77);
  for (let i = 0; i < N; i++) {
    const v = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize().multiplyScalar(1.5 + Math.pow(r(), 0.6) * 5.5);
    p.set([v.x, v.y, v.z], i * 3);
    ph[i] = r() * 6.28;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1));
  const pts = new THREE.Points(g, new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uPR: { value: renderer.getPixelRatio() } },
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `uniform float uTime; uniform float uPR; attribute float aPhase; varying float vA;
      void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vA = (0.35 + 0.3 * sin(uTime * 0.7 + aPhase)) * smoothstep(0.3, 1.2, -mv.z);
        gl_PointSize = 9.0 * uPR / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.75, 0.8, 1.0) * smoothstep(0.5, 0.0, d) * vA, 1.0); }`,
  }));
  scene.add(pts);
  return pts;
})();

// Shooting stars now and then.
const meteor = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1, 0, 0, 0]), 3));
  const l = new THREE.Line(g, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  l.frustumCulled = false;
  scene.add(l);
  return { l, t0: -99, from: new THREE.Vector3(), dir: new THREE.Vector3() };
})();
function stepMeteor(t) {
  if (t - meteor.t0 > 7 + Math.random() * 40 && Math.random() < 0.02 && !reduceMotion) {
    meteor.t0 = t;
    const camDir = camWorld.clone().normalize().negate(); // somewhere in front, far away
    meteor.from.copy(camDir).add(new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.5, Math.random() - 0.5)).normalize().multiplyScalar(60);
    meteor.dir.set(Math.random() - 0.5, -Math.random() * 0.6, Math.random() - 0.5).normalize();
  }
  const k = (t - meteor.t0) / 0.9;
  const pos = meteor.l.geometry.attributes.position;
  if (k > 1) { meteor.l.visible = false; return; }
  meteor.l.visible = true;
  const head = meteor.from.clone().addScaledVector(meteor.dir, k * 30);
  const tail = head.clone().addScaledVector(meteor.dir, -6 * Math.sin(Math.PI * k));
  pos.setXYZ(0, head.x, head.y, head.z);
  pos.setXYZ(1, tail.x, tail.y, tail.z);
  pos.needsUpdate = true;
  meteor.l.material.opacity = Math.sin(Math.PI * k);
}


// The sky from the ground: blue by day, gold and rose at sunset, deep blue-black at night with the stars showing.
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(1.07, 64, 48), new THREE.ShaderMaterial({
  side: THREE.BackSide, transparent: true, depthWrite: false,
  uniforms: { uSun: { value: sunDir }, uUp: { value: new THREE.Vector3(0, 1, 0) }, uFade: { value: 0 } },
  vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
  fragmentShader: `uniform vec3 uSun; uniform vec3 uUp; uniform float uFade; varying vec3 vW;
    void main(){
      vec3 V = normalize(vW - cameraPosition);
      float h = dot(V, uUp);
      float sunUp = dot(uUp, uSun);
      float day = smoothstep(-0.12, 0.18, sunUp);
      float dusk = smoothstep(-0.28, 0.0, sunUp) * (1.0 - smoothstep(0.0, 0.32, sunUp));
      float toSun = max(dot(V, uSun), 0.0);
      float hp = clamp(h, 0.0, 1.0);
      vec3 col = mix(vec3(0.42, 0.6, 0.86), vec3(0.06, 0.2, 0.58), pow(hp, 0.5)) * day;
      col += vec3(1.0, 0.45, 0.2) * dusk * (pow(toSun, 2.5) * 0.9 + 0.12) * (1.0 - pow(hp, 0.6));
      col += vec3(0.55, 0.3, 0.6) * dusk * 0.25 * pow(hp, 0.5);
      col += vec3(1.0, 0.95, 0.85) * (pow(toSun, 1200.0) * 6.0 + pow(toSun, 40.0) * 0.25) * smoothstep(-0.05, 0.05, sunUp);
      col += vec3(0.006, 0.01, 0.03);
      float a = uFade * mix(0.35, 0.97, max(day, dusk * 0.8)) * smoothstep(-0.2, 0.02, h);
      gl_FragColor = vec4(col, a);
    }`,
}));
skyDome.renderOrder = 0.5;
skyDome.visible = false;
scene.add(skyDome);
scene.fog = new THREE.FogExp2(0x9fc3f5, 0);
const _fogDay = new THREE.Color(0x7f9fcc), _fogDusk = new THREE.Color(0xd9906a), _fogNight = new THREE.Color(0x070b18);
let landedHint = 0;
function stepGround(inVR) {
  const alt = camWorld.length() - 1;
  const L = inVR ? 0 : THREE.MathUtils.smoothstep(0.07 - alt, 0, 0.05); // inside the air
  AIR.value = 1 - L; // the data arcs and beams fade when you're down among them
  cityBeams.material.opacity = AIR.value;
  skyDome.visible = L > 0.001;
  const upv = skyDome.material.uniforms.uUp.value.copy(camWorld).normalize();
  skyDome.material.uniforms.uFade.value = L;
  const sunUp = upv.dot(sunDir);
  const day = THREE.MathUtils.smoothstep(sunUp, -0.12, 0.18);
  const dusk = THREE.MathUtils.smoothstep(sunUp, -0.28, 0) * (1 - THREE.MathUtils.smoothstep(sunUp, 0, 0.32));
  SKY_FADE.value = 1 - L * Math.max(day * 0.97, dusk * 0.6);
  scene.fog.color.copy(_fogNight).lerp(_fogDusk, dusk * 0.8).lerp(_fogDay, day);
  const fogD = L * (4.5 - day * 3.0);
  scene.fog.density = fogD;
  ocean.material.uniforms.uFog.value = fogD;
  ocean.material.uniforms.uFogCol.value.copy(scene.fog.color).convertLinearToSRGB();
  giant.visible = SKY_FADE.value > 0.3;
  clouds.material.side = alt < 0.045 ? THREE.DoubleSide : THREE.FrontSide;
  // the near plane follows the height, so things right in front of you aren't clipped
  const near = THREE.MathUtils.clamp(alt * 0.22, 0.0012, 0.05);
  if (Math.abs(near - camera.near) / camera.near > 0.08) { camera.near = near; camera.updateProjectionMatrix(); }
  // a word of help the first times you get close
  if (!inVR && introDone && !flight && performance.now() - lastInteract < 1500) {
    if (landedHint === 0 && alt < 0.6 && alt > 0.2) { landedHint = 1; toast(isTouch ? 'Keep pinching to fly down to the surface' : 'Keep zooming in to fly down to the surface', 3000); }
    if (landedHint === 1 && alt < 0.03) { landedHint = 2; toast(isTouch ? 'Drag to move · Twist two fingers to turn · Pinch to climb' : 'Drag to move · Right-drag to turn · Scroll to climb', 4200); }
  }
  return L;
}

/* ------------------------------------------------------------------ spatial movement: phone tilt, mouse, and breathing */

const parallax = { amp: 1, x: 0, y: 0, tx: 0, ty: 0, mx: 0, my: 0, base: null, shakeAt: 0, motionOn: false };
function onOrient(e) {
  if (e.beta == null || e.gamma == null) return;
  const portrait = !screen.orientation || Math.abs(screen.orientation.angle || 0) !== 90;
  const gx = portrait ? e.gamma : e.beta, gy = portrait ? e.beta : -e.gamma;
  if (!parallax.base) parallax.base = { x: gx, y: gy };
  parallax.base.x += (gx - parallax.base.x) * 0.004; // slowly re-centre so any holding angle works
  parallax.base.y += (gy - parallax.base.y) * 0.004;
  parallax.tx = THREE.MathUtils.clamp((gx - parallax.base.x) / 18, -1, 1);
  parallax.ty = THREE.MathUtils.clamp((gy - parallax.base.y) / 18, -1, 1);
}
function onMotion(e) {
  const a = e.acceleration;
  if (!a || a.x == null) return;
  const m = Math.hypot(a.x, a.y, a.z || 0);
  const now = performance.now();
  if (m > 24 && now - parallax.shakeAt > 15000 && !spill.active) { // a hard shake spills the ocean
    parallax.shakeAt = now;
    spin.axisWorld.copy(camAxis(1));
    startSpill(0.85);
  } else if (m > 2.2) { // small movements send ripples through the ocean
    const oc = ocean.material.uniforms;
    if (oc.uSloshAge.value > 1.2) {
      oc.uSloshDir.value.copy(camAxis(0).multiplyScalar(a.x).add(camAxis(1).multiplyScalar(a.y))).normalize();
      oc.uSlosh.value = Math.min(0.35, m * 0.025);
      oc.uSloshAge.value = 0;
    }
  }
}
function enableMotion() {
  if (parallax.motionOn || reduceMotion) return;
  parallax.motionOn = true;
  const add = () => { addEventListener('deviceorientation', onOrient); addEventListener('devicemotion', onMotion); };
  try {
    const DO = window.DeviceOrientationEvent, DM = window.DeviceMotionEvent;
    if (DO && typeof DO.requestPermission === 'function') { // iPhone asks once, on a tap
      DO.requestPermission().then((s) => { if (s === 'granted') add(); }).catch(() => {});
      if (DM && typeof DM.requestPermission === 'function') DM.requestPermission().catch(() => {});
    } else add();
  } catch (e) { /* motion not available */ }
}
if (!(window.DeviceOrientationEvent && typeof window.DeviceOrientationEvent.requestPermission === 'function')) enableMotion();
addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  parallax.mx = (e.clientX / innerWidth) * 2 - 1;
  parallax.my = (e.clientY / innerHeight) * 2 - 1;
});
function applyParallax(t) {
  if (reduceMotion || !introDone) return; // the opening shot frames itself
  // while you're touching (and a moment after), nothing else moves the view
  const hands = spin.dragging || spin.pointers.size > 0 || flight || performance.now() - lastInteract < 1800;
  parallax.amp += ((hands ? 0 : 1) - parallax.amp) * (hands ? 0.2 : 0.015);
  const breathX = Math.sin(t * 0.23) * 0.18, breathY = Math.sin(t * 0.17 + 1) * 0.14;
  const tx = (parallax.tx * 0.5 + parallax.mx * 0.35 + breathX) * parallax.amp, ty = (parallax.ty * 0.5 + parallax.my * 0.25 + breathY) * parallax.amp;
  parallax.x += (tx - parallax.x) * 0.07;
  parallax.y += (ty - parallax.y) * 0.07;
  camera.updateMatrixWorld();
  const dist = camera.position.length();
  const L = landK(dist);
  if (L > 0) camera.rotateX(-L * LAND_TILT); // work in the orbit frame, then tip back up
  camera.updateMatrixWorld();
  const k = 0.16 * Math.max(0.004, dist - 1) / 2.4;
  camera.position.addScaledVector(camAxis(0), parallax.x * k).addScaledVector(camAxis(1), -parallax.y * k);
  camera.lookAt(0, 0, 0);
  if (L > 0) camera.rotateX(L * LAND_TILT);
  camera.updateMatrixWorld();
}

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
  const turn = fromDir.angleTo(toDir);
  const axis = new THREE.Vector3().crossVectors(fromDir, toDir);
  const bankSign = Math.sign(axis.dot(camera.up)) || 1;
  flight = { fromDir, toDir, fromDist: camera.position.length(), toDist: dist, t0: performance.now(), dur: reduceMotion ? 1 : dur * (0.85 + Math.min(0.6, turn * 0.35)), bank: bankSign * Math.min(0.22, turn * 0.14), up: camera.up.clone() };
  spin.w.set(0, 0, 0);
  spin.enabled = false;
}
const _fQ = new THREE.Quaternion(), _fS = new THREE.Quaternion(), _fD = new THREE.Vector3(), _fCam = new THREE.PerspectiveCamera();
// Touch the world mid-flight and you take over right there: no waiting for the flight to land.
function cancelFlight() {
  if (!flight) return;
  _fCam.position.copy(camera.position);
  _fCam.up.copy(flight.up);
  _fCam.lookAt(0, 0, 0);
  flight = null;
  spin.enabled = true;
  spin.q.copy(_fCam.quaternion);
  spin.qT.copy(_fCam.quaternion);
  spin.dist = spin.target = camera.position.length();
  spin.w.set(0, 0, 0);
}
function stepFlight(now) {
  if (!flight) return;
  const t = Math.min(1, (now - flight.t0) / flight.dur);
  const e = ease(t);
  const q = _fQ.setFromUnitVectors(flight.fromDir, flight.toDir);
  const dir = _fD.copy(flight.fromDir).applyQuaternion(_fS.identity().slerp(q, e));
  const hop = Math.sin(Math.PI * t) * Math.min(0.9, flight.fromDir.angleTo(flight.toDir) * 0.45);
  camera.position.copy(dir.multiplyScalar(THREE.MathUtils.lerp(flight.fromDist, flight.toDist, e) + hop));
  camera.up.copy(flight.up);
  camera.lookAt(0, 0, 0);
  camera.rotateZ(flight.bank * Math.sin(Math.PI * t) * (1 - 0.35 * t)); // bank into the turn like a drone
  camera.rotateX(landK(camera.position.length()) * LAND_TILT);
  if (t >= 1) {
    flight = null;
    spin.enabled = true;
    const L = landK(camera.position.length());
    if (L > 0) camera.rotateX(-L * LAND_TILT); // the spin frame is the untilted one
    syncSpin();
    placeCamera();
  }
}

/* ------------------------------------------------------------------ panel */

const panel = $('#panel');
const panelBody = $('#panel-body');
let selected = null; // { kind, index }
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const fmtLat = (v) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? 'N' : 'S'}`;
const fmtLon = (v) => `${Math.abs(v).toFixed(1)}°${v >= 0 ? 'E' : 'W'}`;
function header(o, kicker) {
  return `<header class="ph" style="--c:${o.color}">
    <p class="kicker">${esc(kicker || o.era)}</p>
    ${o.lat != null ? `<p class="coords">${fmtLat(o.lat)} · ${fmtLon(o.lon)} · R ${o.radius}°</p>` : ''}
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
        ${c.product.demo ? `<a class="demo" href="${c.product.demo}" target="_blank" rel="noopener">Demo ↗</a>` : ''}
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
  const down = `<section><button type="button" class="cta ghost" data-go="land" data-region="${ri}">Fly down and look around ↓</button></section>`;
  const work = `<section class="work"><h3>Work with TD1</h3><p class="sub">Want this thinking in your business? Book time with TD1 or ask about any product here.</p>
    <button type="button" class="cta" data-go="book">Book expertise</button></section>`;
  return header(r) + down + notesHtml(r.id) + extra + peaksHtml(ri) + citiesHtml(ri) + work;
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
  const headers = { 'Content-Type': 'application/json' };
  if (SHOP.storefrontToken) headers['X-Shopify-Storefront-Access-Token'] = SHOP.storefrontToken;
  const res = await fetch(`https://${SHOP.domain}/api/2025-01/graphql.json`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables: { h: sec.handle } }),
  });
  if (!res.ok) throw new Error(`Shopify answered ${res.status}`);
  const json = await res.json();
  return (shopCache[sec.id] = json.data?.collection?.products?.nodes || []);
}
const shopLive = () => Boolean(SHOP.domain);
function shopHtml() {
  const tabs = SHOP.sections.map((s) => `<button type="button" class="tab${s.id === shopTab ? ' on' : ''}" data-shop-tab="${s.id}">${esc(s.name)}</button>`).join('');
  return header({ name: 'The Exchange', era: 'Shop', color: SHOP_COLOR, tagline: 'Training gear now. Courses and documents next.', intro: 'A trading station in orbit around the world. Everything here is made by TD1WORLD to help you train, build, learn and wear the future.' })
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
      : `<div class="shop-empty"><b>${esc(sec.name)} are on their way.</b><span>${esc(sec.text)}</span>
        <button type="button" class="cta" data-go="notify">Tell me when they land</button></div>`;
  } catch (e) { // can't reach the store from here: send them straight to it instead
    box.innerHTML = `<div class="shop-empty"><b>Browse ${esc(sec.name)} in the TD1WORLD store.</b><span>${esc(sec.text)}</span>
      ${SHOP.storeUrl ? `<a class="cta" href="${esc(SHOP.storeUrl)}/collections/${esc(sec.handle)}" target="_blank" rel="noopener">Open ${esc(sec.name)} ↗</a>` : ''}</div>`;
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
    err.hidden = false;
    if (ENQUIRY.email) { // no form service here (or it failed): hand it to their email app, already written
      const body = ['type', 'expertise', 'date', 'time', 'name', 'email', 'company', 'timezone', 'message']
        .filter((k) => data.get(k)).map((k) => `${k[0].toUpperCase()}${k.slice(1)}: ${data.get(k)}`).join('\n');
      const href = `mailto:${ENQUIRY.email}?subject=${encodeURIComponent(`TD1.WORLD: ${data.get('type') || 'Enquiry'}`)}&body=${encodeURIComponent(body)}`;
      err.innerHTML = `That didn’t send from here. <a href="${href}">Send it by email instead</a>, it’s all filled in.`;
    } else err.textContent = 'That didn’t send. Check your connection and try again.';
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
    return '<img class="emblem" src="world/assets/mindaloo-emblem.jpg" alt="The Mindaloo emblem: a full moon between two crescents, crowned in silver thorns, with the Mindaloo rune at its heart." width="960" height="720">'
      + header({ name: 'Mindaloo AC', era: 'Moonlight · TD1 flagship', color: '#D9CCFF', tagline: 'Autonomous Consciousness, powered by Karma Core.', intro: 'Mindaloo means moonlight, and AC stands for Autonomous Consciousness. Mindaloo AC is TD1’s flagship: a sovereign AI with its own lasting identity and memory, a spatial canvas of agents that work together, and Karma Core at its heart. As it orbits, its light falls across every continent.' })
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
  score.place('shop');
  score.chime(79);
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
  score.place('contact');
  score.chime(77);
  selected = { kind: 'contact' };
  land.material.userData.uHi.value = UNCH;
  flyTo(beaconPos, fitDist(0.6, 2.1));
  openPanel(contactHtml(prefill), BEACON_COLOR);
  setDock('contact');
}
function enterCore() {
  score.place('core');
  score.chime(69);
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
  if (introDone) score.place('space');
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
  score.place(ri === UNCH ? 'space' : REGIONS[ri].id);
  score.chime(ri === UNCH ? 83 : [76, 79, 81, 84, 78][ri]);
  selected = { kind: 'region', index: ri };
  land.material.userData.uHi.value = ri;
  ocean.material.uniforms.uHi.value = 0;
  const o = ri === UNCH ? UNCHARTED : REGIONS[ri];
  if (!opts.noFly) flyTo(opts.dir || o.dir || camera.position, opts.dist || fitDist(0.85, 2.65));
  openPanel(ri === UNCH ? header(UNCHARTED) : regionHtml(ri), o.color);
  setDock(o.id);
}

// Fly down to the ground at a continent: you arrive just outside its biggest town, looking at it.
function landAt(ri) {
  const town = cities.filter((c) => c.region === ri)[0];
  if (!town) return;
  closePanel();
  $('#intro').classList.add('gone');
  const camUp = camera.up.clone();
  const tangent = camUp.addScaledVector(town.dir, -camUp.dot(town.dir)).normalize();
  // stand back far enough to see the whole town (further on a narrow phone screen)
  const back = isSmall() ? 0.038 : 0.03, up = isSmall() ? 0.0125 : 0.0095;
  let spot = town.dir.clone().addScaledVector(tangent, -back).normalize();
  for (let k = 0; k < 8 && !onLand(spot, 0); k++) spot = town.dir.clone().addScaledVector(tangent, -back + k * 0.003).normalize();
  flyTo(spot, surfaceRadius(spot) + up, 3400);
  landedHint = Math.max(landedHint, 1);
}
function selectOcean(dir) {
  exitCore();
  score.place('ocean');
  score.chime(72);
  selected = { kind: 'ocean' };
  land.material.userData.uHi.value = -10;
  ocean.material.uniforms.uHi.value = 1;
  if (dir) flyTo(dir, fitDist(1.0, 2.9));
  openPanel(oceanHtml(), OCEAN.color);
  setDock('ocean');
}
function openSpecial(kind) {
  exitCore();
  score.place('moon');
  score.chime(80);
  selected = { kind };
  land.material.userData.uHi.value = -10;
  const obj = kind === 'realm' ? realm : mindaloo;
  flyTo(obj.getWorldPosition(new THREE.Vector3()), kind === 'realm' ? fitDist(1.6, 4.4) : fitDist(1.5, 3.9));
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
    if (go.dataset.go === 'notify') openContact({ type: 'General enquiry', message: 'Please let me know when new courses and documents arrive at The Exchange.' });
    else if (go.dataset.go === 'core') enterCore();
    else if (go.dataset.go === 'land') landAt(+go.dataset.region);
    else if (go.dataset.go === 'book') openContact({ type: 'Book expertise' });
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

/* The Explore menu: one glowing orb opens a clean, ordered menu. Talk first, then products, then the world. */
const dock = $('#dock');
const menuBtn = $('#menu-btn');
const MENU = [
  { title: 'Talk to TD1', items: [
    { id: 'contact', name: 'Get in touch', sub: 'Questions, projects, partnerships', color: BEACON_COLOR, go: () => openContact() },
    { id: 'book', name: 'Book expertise', sub: 'Strategy sessions, builds, workshops', color: BEACON_COLOR, go: () => openContact({ type: 'Book expertise' }) },
  ] },
  { title: 'Products', items: [
    { id: 'shop', name: 'Shop', sub: 'Courses, documents, clothing', color: SHOP_COLOR, go: () => openShop() },
    { id: 'market', name: 'Marketplace', sub: 'NeuroBlocks: ready-made AI building blocks', color: '#B38DFF', href: 'Neuroblock/' },
    { id: 'mindaloo', name: 'Mindaloo AC', sub: 'Our flagship Autonomous Consciousness', color: '#D9CCFF', go: () => openSpecial('mindaloo') },
  ] },
  { title: 'Explore the world', items: [
    ...REGIONS.map((r, i) => ({ id: r.id, name: r.name, sub: r.era, color: r.color, go: () => selectRegion(i) })),
    { id: 'core', name: 'Karma Core', sub: 'The heart of the world', color: CORE.color, go: () => enterCore() },
    { id: 'ocean', name: 'Ocean of Data', sub: 'Between everything', color: OCEAN.color, go: () => selectOcean(latLon(-30, -60)) },
    { id: 'realm', name: 'Realm', sub: 'A connected world', color: '#7FD8FF', go: () => openSpecial('realm') },
  ] },
];
MENU.forEach((group, gi) => {
  const sec = document.createElement('section');
  sec.innerHTML = `<h4><span>0${gi + 1}</span>${esc(group.title)}</h4>`;
  const list = document.createElement('div');
  list.className = `mgroup${gi === 2 ? ' grid' : ''}`;
  group.items.forEach((d) => {
    const b = document.createElement(d.href ? 'a' : 'button');
    if (d.href) b.href = d.href; else b.type = 'button';
    b.className = 'chip';
    b.dataset.id = d.id;
    b.style.setProperty('--c', d.color);
    b.innerHTML = `<i></i><span><b>${esc(d.name)}</b><small>${esc(d.sub)}</small></span>`;
    if (d.go) b.addEventListener('click', () => { closeMenu(); d.go(); });
    list.appendChild(b);
  });
  sec.appendChild(list);
  dock.appendChild(sec);
});
function openMenu() {
  closePanel();
  dock.hidden = false;
  requestAnimationFrame(() => document.body.classList.add('menu-open'));
  menuBtn.setAttribute('aria-expanded', 'true');
  $('#intro').classList.add('gone');
}
function closeMenu() {
  document.body.classList.remove('menu-open');
  menuBtn.setAttribute('aria-expanded', 'false');
  setTimeout(() => { if (!document.body.classList.contains('menu-open')) dock.hidden = true; }, 350);
}
menuBtn.addEventListener('click', () => (document.body.classList.contains('menu-open') ? closeMenu() : openMenu()));
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
renderer.domElement.addEventListener('pointerdown', () => { if (document.body.classList.contains('menu-open')) closeMenu(); });
$('#nav-contact').addEventListener('click', () => { closeMenu(); openContact(); });
function setDock(id) { dock.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); }

$('#begin').addEventListener('click', () => selectRegion(0));
$('#see-products').addEventListener('click', () => { $('#intro').classList.add('gone'); openMenu(); });

/* ------------------------------------------------------------------ picking */

const ray = new THREE.Raycaster();
const pickSphere = new THREE.Mesh(new THREE.SphereGeometry(1.02, 48, 32), new THREE.MeshBasicMaterial({ visible: false }));
planet.add(pickSphere);
const ndc = new THREE.Vector2();
const tip = $('#tip');
let pointer = null, hover = null, downAt = null;

const _tsV = new THREE.Vector3();
function toScreen(v) {
  const p = _tsV.copy(v).project(camera);
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
  if (camera.position.length() < 1.15) { // down low, the robots can be tapped
    const bi = nearest(robots, px, py, reach + 12);
    if (bi !== null) return { kind: 'robot', index: bi, label: robots[bi].name, sub: ROLE[robots[bi].job] };
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
  if ((h.kind === 'region' || h.kind === 'ocean') && camera.position.length() < 1.06) return; // on the ground, tapping the land just ripples
  if (h.kind === 'city') { selectRegion(cities[h.index].region, { noFly: true }); focusCity(h.index); }
  else if (h.kind === 'peak') { selectRegion(peaks[h.index].region, { noFly: true }); flyTo(peaks[h.index].pos, fitDist(0.5, 1.95)); }
  else if (h.kind === 'monolith') selectRegion(0, { dir: monoliths[h.index].pos, dist: fitDist(0.5, 2.0) });
  else if (h.kind === 'region') selectRegion(h.index, h.index === UNCH ? { dir: h.dir, dist: fitDist(0.6, 2.3) } : {});
  else if (h.kind === 'ocean') selectOcean(h.dir);
  else if (h.kind === 'core') enterCore();
  else if (h.kind === 'egg') openEgg(eggMeshes[h.index]);
  else if (h.kind === 'robot') greetRobot(h.index);
  else if (h.kind === 'shop') openShop();
  else if (h.kind === 'contact') openContact();
  else openSpecial(h.kind);
}

const cv = renderer.domElement;
cv.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY, type: e.pointerType }; });
cv.addEventListener('pointerleave', () => { pointer = null; });
cv.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  if (moved < 9 && performance.now() - downAt.t < 600 && !downAt.wasSpinning) {
    if (downAt.label) { downAt.label(); downAt = null; return; } // a tap on a label
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
  zoomAt(Math.exp(e.deltaY * 0.0016), e.clientX, e.clientY);
}, { passive: false });

/* grabbing and flinging: like Google Earth, the spot you grab stays under your finger */
const pinchDist = () => { const p = [...spin.pointers.values()]; return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); };
const pinchAngle = () => { const p = [...spin.pointers.values()]; return Math.atan2(p[1].y - p[0].y, p[1].x - p[0].x); };
const pinchMid = () => { const p = [...spin.pointers.values()]; return { x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 }; };
const _gr = new THREE.Raycaster(), _gn = new THREE.Vector2(), _gR = new THREE.Quaternion(), _gA = new THREE.Vector3(), _gW = new THREE.Vector3(), _gQi = new THREE.Quaternion();
// A stand-in camera at the target pose: hits are measured against where the view is going, not where it is mid-glide.
const ghost = new THREE.PerspectiveCamera();
function syncGhost() {
  ghost.quaternion.copy(spin.qT);
  ghost.position.set(0, 0, spin.dist).applyQuaternion(spin.qT);
  ghost.rotateX(landK(spin.dist) * LAND_TILT);
  ghost.updateMatrixWorld();
  ghost.projectionMatrix.copy(camera.projectionMatrix);
  ghost.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
}
// Where the ray under screen point (px, py) meets a sphere of radius r around the world's centre.
function sphereHit(px, py, r, out, cam = camera) {
  cam.updateMatrixWorld();
  _gn.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1);
  _gr.setFromCamera(_gn, cam);
  const o = _gr.ray.origin, d = _gr.ray.direction;
  const b = o.dot(d), c = o.lengthSq() - r * r, disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  if (t < 0) return null;
  return out.copy(o).addScaledVector(d, t);
}
const grabState = { anchor: null, r: 1, twist: 0, right: false, samples: [] };
function grabAt(px, py) {
  syncGhost();
  let r = 1;
  if (spin.dist < 1.2 && sphereHit(px, py, 1.01, _gA, ghost)) r = surfaceRadius(_gA.clone().normalize());
  grabState.r = r;
  grabState.anchor = sphereHit(px, py, r, _gA, ghost) ? _gA.clone().normalize() : null;
}
function noteMotion(now) { // remember the last tenth of a second of movement, for an honest fling
  grabState.samples.push({ t: now, q: spin.qT.clone() });
  while (grabState.samples.length > 2 && now - grabState.samples[0].t > 110) grabState.samples.shift();
}
function flingVelocity(now) { // the world's spin rate from recent movement, in the camera's own axes
  const s0 = grabState.samples[0];
  if (!s0 || now - s0.t < 8) return _gW.set(0, 0, 0);
  _gR.copy(spin.qT).multiply(_gQi.copy(s0.q).invert()); // rotation from then to now
  const ang = 2 * Math.acos(Math.min(1, Math.abs(_gR.w)));
  if (ang < 1e-6) return _gW.set(0, 0, 0);
  _gW.set(_gR.x, _gR.y, _gR.z).normalize().multiplyScalar(((_gR.w < 0 ? -ang : ang) * 1000) / (now - s0.t));
  _gW.applyQuaternion(_gQi.copy(spin.qT).invert());
  if (_gW.length() > 24) _gW.setLength(24);
  return _gW;
}
function turnWorld(R) { spin.qT.premultiply(R).normalize(); }
function twistBy(angle) { // turn around the line from you to the centre: your heading, on the ground
  _gR.setFromAxisAngle(_gA.set(0, 0, 1).applyQuaternion(spin.qT), angle);
  turnWorld(_gR);
}
// Down low: drag slides you across the land at a pace set by your height, steady and predictable.
function groundPan(dx, dy) {
  const s = (Math.max(0.004, spin.dist - 1) * 2.4) / Math.min(innerWidth, innerHeight);
  const right = _gA.set(1, 0, 0).applyQuaternion(spin.qT);
  _gR.setFromAxisAngle(right, -dy * s);
  turnWorld(_gR);
  const upT = _gA.set(0, 1, 0).applyQuaternion(spin.qT);
  _gR.setFromAxisAngle(upT, -dx * s);
  turnWorld(_gR);
}
function pointerDown(e, label) {
  try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine without capture */ }
  const now = performance.now();
  downAt = { x: e.clientX, y: e.clientY, t: now, label, wasSpinning: spin.w.length() > 1.5 || spin.energy > 0.2 };
  lastInteract = now;
  $('#intro').classList.add('gone');
  spin.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!introDone) cine.skip = true;
  enableMotion();
  if (introDone) cancelFlight();
  grab(); // catching the world stops it
  spin.qT.copy(spin.q); // and it stays exactly where you caught it
  grabState.samples.length = 0;
  if (spin.pointers.size === 1) {
    spin.dragging = true;
    spin.lastMove = now;
    grabState.right = e.button === 2 || e.shiftKey; // right-drag or shift-drag turns you around
    if (!grabState.right) grabAt(e.clientX, e.clientY);
  } else if (spin.pointers.size === 2) {
    spin.dragging = true;
    spin.pinch = pinchDist();
    grabState.twist = pinchAngle();
    downAt = null; // two fingers is never a tap
  }
}
cv.addEventListener('contextmenu', (e) => e.preventDefault());
cv.addEventListener('pointerdown', (e) => pointerDown(e, null));
cv.addEventListener('pointermove', (e) => {
  const prev = spin.pointers.get(e.pointerId);
  if (!prev) return;
  const now = performance.now();
  if (spin.pointers.size === 2) { // pinch to zoom toward your fingers, twist to turn
    prev.x = e.clientX; prev.y = e.clientY;
    const d = pinchDist(), a = pinchAngle(), m = pinchMid();
    if (spin.enabled && spin.pinch > 0) zoomAt(spin.pinch / d, m.x, m.y);
    let da = a - grabState.twist;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    if (spin.enabled && Math.abs(da) < 0.5) twistBy(-da);
    spin.pinch = d;
    grabState.twist = a;
    noteMotion(now);
    spin.lastMove = lastInteract = now;
    return;
  }
  const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
  prev.x = e.clientX; prev.y = e.clientY;
  if (!spin.dragging || !spin.enabled || (dx === 0 && dy === 0)) return;
  if (grabState.right) twistBy(dx * 0.005);
  else if (landK(spin.dist) > 0.35) groundPan(dx, dy);
  else {
    syncGhost();
    if (grabState.anchor && sphereHit(e.clientX, e.clientY, grabState.r, _gA, ghost)) {
      _gR.setFromUnitVectors(_gA.normalize(), grabState.anchor);
      turnWorld(_gR);
    } else { // off the edge of the world: turn it by the drag
      const k = 0.0052 * Math.max(0.0035, (spin.dist - 1) / 2.4);
      turnCamera(-dy * k, -dx * k, 0);
    }
  }
  noteMotion(now);
  spin.w.copy(flingVelocity(now)); // live spin rate (the ocean feels a wild spin)
  spin.lastMove = lastInteract = now;
});
const release = (e) => {
  if (!spin.pointers.has(e.pointerId)) return;
  spin.pointers.delete(e.pointerId);
  const now = performance.now();
  if (spin.pointers.size === 1) { // lifted one finger of two: carry on with the other
    const p = [...spin.pointers.values()][0];
    grabState.right = false;
    grabState.samples.length = 0;
    grabAt(p.x, p.y);
    return;
  }
  if (spin.pointers.size === 0) {
    spin.dragging = false;
    // let go while moving and it glides on; stop first and it stays put
    if (reduceMotion || now - spin.lastMove > 70) spin.w.set(0, 0, 0);
    else spin.w.copy(flingVelocity(now)).multiplyScalar(0.9);
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
  if ((updateHover.n = (updateHover.n || 0) + 1) % 3 !== 0) return;
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

/* ------------------------------------------------------------------ VR: stand in space beside the world (WebXR, Meta Quest) */

const vr = {
  supported: false, active: false,
  rigDist: 2.6, rigTarget: 2.6,
  w: new THREE.Vector3(), // planet angular velocity, world axis × rad/s
  grab: null, // { ctrl, prev: Vector3, t0, moved }
  turn: null, // { from, to, t0 } auto-turn to show a selected place
  card: null, cardFor: '',
  btnPrev: [{}, {}],
  labels: [],
};
const vrCtrls = [];
const vrRay = new THREE.Raycaster();
const _m4 = new THREE.Matrix4(), _vq = new THREE.Quaternion(), _va = new THREE.Vector3(), _vb = new THREE.Vector3();

function vrCanvasCard(o) {
  const W = 1024, H = 600, c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const cut = 36;
  g.beginPath(); g.moveTo(cut, 0); g.lineTo(W, 0); g.lineTo(W, H - cut); g.lineTo(W - cut, H); g.lineTo(0, H); g.lineTo(0, cut); g.closePath();
  g.fillStyle = 'rgba(5,7,16,0.92)'; g.fill();
  g.strokeStyle = 'rgba(150,180,255,0.35)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = o.color || '#C1A2FF'; g.fillRect(cut, 0, W - cut, 6);
  g.fillStyle = o.color || '#C1A2FF';
  g.font = '500 30px "IBM Plex Mono", monospace';
  g.fillText(`// ${String(o.era || '').toUpperCase()}`, 56, 82);
  g.fillStyle = '#ffffff';
  g.font = '700 74px "Chakra Petch", sans-serif';
  g.fillText(o.name, 52, 168);
  g.fillStyle = '#e8ecf6';
  g.font = '500 36px "IBM Plex Sans", sans-serif';
  g.fillText(o.tagline || '', 56, 224);
  g.fillStyle = '#9aa3bd';
  g.font = '400 32px "IBM Plex Sans", sans-serif';
  const words = String(o.intro || '').split(' ');
  let line = '', y = 290;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > W - 112) { g.fillText(line, 56, y); line = w; y += 44; if (y > H - 70) { line += '…'; break; } }
    else line = test;
  }
  if (line && y <= H - 30) g.fillText(line, 56, y);
  g.fillStyle = '#5f6884';
  g.font = '500 24px "IBM Plex Mono", monospace';
  g.fillText(o.foot || 'TRIGGER: SELECT  ·  GRIP OR PINCH: SPIN  ·  B/Y: KARMA CORE  ·  A/X: CLOSE', 56, H - 34);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
function vrShowCard(o, key) {
  if (vr.cardFor === key && vr.card) return;
  vrHideCard();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.586), new THREE.MeshBasicMaterial({ map: vrCanvasCard(o), transparent: true, depthWrite: false }));
  m.renderOrder = 20;
  scene.add(m);
  vr.card = m;
  vr.cardFor = key;
}
function vrHideCard() {
  if (!vr.card) return;
  scene.remove(vr.card);
  vr.card.material.map.dispose();
  vr.card.material.dispose();
  vr.card.geometry.dispose();
  vr.card = null;
  vr.cardFor = '';
}
function vrTextSprite(text, sub, color) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const g = c.getContext('2d');
  g.textAlign = 'center';
  g.fillStyle = color;
  g.font = '500 26px "IBM Plex Mono", monospace';
  g.fillText(sub.toUpperCase(), 256, 44);
  g.fillStyle = '#ffffff';
  g.font = '700 48px "Chakra Petch", sans-serif';
  g.fillText(text.toUpperCase(), 256, 98);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sp.scale.set(0.36, 0.09, 1);
  sp.renderOrder = 15;
  sp.visible = false;
  return sp;
}
function vrBuildLabels() {
  if (vr.labels.length) return;
  REGIONS.forEach((r) => {
    const sp = vrTextSprite(r.name, r.era, r.color);
    sp.position.copy(r.dir).multiplyScalar(1.2);
    planet.add(sp);
    vr.labels.push(sp);
  });
}

// pointing: what is this controller aiming at?
function vrAim(ctrl) {
  _m4.identity().extractRotation(ctrl.matrixWorld);
  vrRay.ray.origin.setFromMatrixPosition(ctrl.matrixWorld);
  vrRay.ray.direction.set(0, 0, -1).applyMatrix4(_m4);
  const eggs = eggMeshes.filter((m) => m.visible).map((m) => m.userData.gem);
  const hits = vrRay.intersectObjects([...eggs, coreBall, realm, mindaloo.userData.body, ...exchange.userData.pick, pickSphere], false);
  return hits[0] || null;
}
function vrTurnTo(dirLocal) { // rotate the world so a place faces you
  const world = dirLocal.clone().applyQuaternion(planet.quaternion);
  const toViewer = camWorld.clone().normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(world, toViewer);
  vr.turn = { from: planet.quaternion.clone(), to: q.multiply(planet.quaternion.clone()), t0: performance.now() };
  vr.w.set(0, 0, 0);
}
function vrSelect(hit) {
  if (!hit) { vrHideCard(); return; }
  const o = hit.object;
  const egg = eggMeshes.find((m) => m.userData.gem === o);
  if (egg) {
    const e = egg.userData.egg;
    if (!eggsFound.has(e.id)) { eggsFound.add(e.id); saveEggs(); }
    spill.holdUntil = Math.max(spill.holdUntil, performance.now() + 15000);
    vrShowCard({ name: e.title, era: `Easter egg · ${eggsFound.size} of ${EGGS.length} found`, color: '#FFD27A', tagline: 'Washed up when the ocean spilled.', intro: e.text }, `egg-${e.id}`);
    return;
  }
  if (o === coreBall) { coreTarget = 1; vrShowCard({ ...CORE, intro: `${CORE.formula}. ${CORE.intro}` }, 'core'); return; }
  if (o === realm) { vrShowCard({ name: 'Realm', era: 'A connected world', color: '#7FD8FF', tagline: 'The Conscious Network.', intro: 'Realm orbits TD1.WORLD as its own moon: a separate world with its own rules, linked to this one.' }, 'realm'); return; }
  if (o === mindaloo.userData.body) { vrShowCard({ name: 'Mindaloo AC', era: 'Moonlight · TD1 flagship', color: '#D9CCFF', tagline: 'Autonomous Consciousness, powered by Karma Core.', intro: 'Mindaloo means moonlight, and AC stands for Autonomous Consciousness. A sovereign AI with its own lasting identity and memory. Visit www.mindaloo.ac.' }, 'mindaloo'); return; }
  if (exchange.userData.pick.includes(o)) { vrShowCard({ name: 'The Exchange', era: 'Shop', color: SHOP_COLOR, tagline: 'Courses, documents and TD1 clothing.', intro: 'A trading station in orbit around the world. Open td1.world on your phone or computer to browse and buy.' }, 'shop'); return; }
  // the planet itself
  const local = planet.worldToLocal(hit.point.clone()).normalize();
  const tr = terrain(local.x, local.y, local.z);
  coreTarget = 0;
  if (tr.h > 0 && tr.region !== UNCH) {
    const r = REGIONS[tr.region];
    land.material.userData.uHi.value = tr.region;
    vrTurnTo(r.dir);
    vrShowCard(r, `region-${r.id}`);
  } else if (tr.h > 0) {
    vrTurnTo(local);
    vrShowCard(UNCHARTED, 'uncharted');
  } else {
    land.material.userData.uHi.value = -10;
    vrShowCard(OCEAN, 'ocean');
  }
}

function vrSetup() {
  for (let i = 0; i < 2; i++) {
    const ctrl = renderer.xr.getController(i);
    const ray = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)]),
      new THREE.LineBasicMaterial({ color: 0x7fd8ff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending }),
    );
    ray.scale.z = 4;
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    dot.visible = false;
    scene.add(dot);
    ctrl.add(ray);
    ctrl.userData = { ray, dot, gamepad: null };
    ctrl.addEventListener('connected', (e) => { ctrl.userData.gamepad = e.data.gamepad || null; ray.visible = e.data.targetRayMode !== 'gaze'; });
    ctrl.addEventListener('disconnected', () => { ctrl.userData.gamepad = null; });
    const start = () => {
      const speed = vr.w.length();
      if (spin.energy > 0.45 && speed > 3) { startSpill(spin.energy); spin.energy = 0; } // catching it mid-spin stops it dead
      vr.w.set(0, 0, 0);
      vr.turn = null;
      _va.setFromMatrixPosition(ctrl.matrixWorld);
      vr.grab = { ctrl, prev: _va.clone(), t0: performance.now(), moved: 0, hit: vrAim(ctrl) };
    };
    const end = (isSelect) => {
      if (!vr.grab || vr.grab.ctrl !== ctrl) return;
      const g = vr.grab;
      vr.grab = null;
      if (isSelect && g.moved < 0.06 && performance.now() - g.t0 < 450) { vr.w.set(0, 0, 0); vrSelect(g.hit); }
    };
    ctrl.addEventListener('selectstart', start);
    ctrl.addEventListener('selectend', () => end(true));
    ctrl.addEventListener('squeezestart', start);
    ctrl.addEventListener('squeezeend', () => end(false));
    rig.add(ctrl);
    vrCtrls.push(ctrl);
  }
}

function vrRotatePlanet(q) {
  planet.quaternion.premultiply(q);
  coreWorld.quaternion.copy(planet.quaternion);
}
function stepVR(dt, t) {
  // stand back from the world; thumbsticks move you closer or further
  vrCtrls.forEach((ctrl, i) => {
    const gp = ctrl.userData.gamepad;
    if (!gp) return;
    const ay = gp.axes[3] || 0;
    if (Math.abs(ay) > 0.2) vr.rigTarget = THREE.MathUtils.clamp(vr.rigTarget + ay * dt * 1.4, 1.35, 7);
    const pressed = (n) => Boolean(gp.buttons[n] && gp.buttons[n].pressed);
    const prev = vr.btnPrev[i];
    if (pressed(5) && !prev.b) { // B / Y: Karma Core
      coreTarget = coreTarget ? 0 : 1;
      if (coreTarget) vrShowCard({ ...CORE, intro: `${CORE.formula}. ${CORE.intro}` }, 'core'); else vrHideCard();
    }
    if (pressed(4) && !prev.a) { vrHideCard(); coreTarget = 0; land.material.userData.uHi.value = -10; } // A / X: close
    prev.a = pressed(4); prev.b = pressed(5);
  });
  vr.rigDist += (vr.rigTarget - vr.rigDist) * (1 - Math.exp(-dt * 5));
  rig.position.set(0, -1.6, vr.rigDist);

  // grabbing turns the world under your hand
  if (vr.grab) {
    _va.setFromMatrixPosition(vr.grab.ctrl.matrixWorld);
    const a = vr.grab.prev.clone().normalize(), b = _va.clone().normalize();
    const ang = a.angleTo(b);
    vr.grab.moved += _va.distanceTo(vr.grab.prev);
    if (ang > 1e-5) {
      const axis = _vb.crossVectors(a, b).normalize();
      const gain = 2.6;
      vrRotatePlanet(_vq.setFromAxisAngle(axis, ang * gain));
      vr.w.lerp(axis.clone().multiplyScalar((ang * gain) / Math.max(dt, 1 / 120)), 0.5);
    }
    vr.grab.prev.copy(_va);
  } else if (vr.turn) {
    const k = Math.min(1, (performance.now() - vr.turn.t0) / 1300);
    planet.quaternion.slerpQuaternions(vr.turn.from, vr.turn.to, ease(k));
    coreWorld.quaternion.copy(planet.quaternion);
    if (k >= 1) vr.turn = null;
  } else {
    const sp = vr.w.length();
    if (sp > 1e-4) {
      vrRotatePlanet(_vq.setFromAxisAngle(_va.copy(vr.w).normalize(), sp * dt));
      vr.w.multiplyScalar(Math.exp(-dt * (spin.energy > 0.3 ? 0.45 : 1.1)));
    } else if (!vr.card) vrRotatePlanet(_vq.setFromAxisAngle(EARTH_AXIS, 0.05 * dt)); // turning like Earth
  }

  // spin-out works in VR too
  const speed = vr.w.length();
  if (speed > 0.01) spin.axisWorld.copy(vr.w).normalize();
  if (speed > 5.5) spin.energy = Math.min(1, spin.energy + dt * 0.55);
  else spin.energy = Math.max(0, spin.energy - dt * (speed > 3 ? 0.08 : 0.3));
  if (spin.energy > 0.6 && speed < 2.2 && !vr.grab) { startSpill(spin.energy * 0.75); spin.energy = 0; }

  // lasers, aim dots, labels and the floating card
  vrCtrls.forEach((ctrl) => {
    const hit = ctrl.userData.ray.visible ? vrAim(ctrl) : null;
    ctrl.userData.ray.scale.z = hit ? hit.distance : 4;
    ctrl.userData.dot.visible = Boolean(hit);
    if (hit) ctrl.userData.dot.position.copy(hit.point);
  });
  vr.labels.forEach((sp) => {
    const w = sp.getWorldPosition(_va);
    sp.visible = coreMix < 0.5 && w.clone().normalize().dot(camWorld.clone().normalize()) > 0.25;
  });
  if (vr.card) {
    const toViewer = camWorld.clone().normalize();
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), toViewer).normalize();
    vr.card.position.copy(toViewer.multiplyScalar(1.45)).addScaledVector(right, -1.25).add(new THREE.Vector3(0, 0.12, 0));
    vr.card.lookAt(camWorld);
  }
}

async function enterVR() {
  if (!navigator.xr) return;
  try {
    const session = await navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor', 'bounded-floor', 'hand-tracking'] });
    renderer.xr.setReferenceSpaceType('local-floor');
    await renderer.xr.setSession(session);
  } catch (e) {
    toast('VR couldn’t start. Check the headset allows this site to use VR.', 4200);
  }
}
renderer.xr.addEventListener('sessionstart', () => {
  vr.active = true;
  if (!vrCtrls.length) vrSetup();
  vrBuildLabels();
  closePanel();
  flight = null;
  camera.clearViewOffset();
  camera.position.set(0, 1.6, 0);
  camera.quaternion.identity();
  vr.rigDist = vr.rigTarget = 2.6;
  document.body.classList.add('in-vr');
  try { renderer.xr.setFoveation(1); } catch (e) { /* older runtimes */ }
});
renderer.xr.addEventListener('sessionend', () => {
  vr.active = false;
  vrHideCard();
  vr.grab = null;
  rig.position.set(0, 0, 0);
  planet.quaternion.identity();
  coreWorld.quaternion.identity();
  vr.labels.forEach((sp) => { sp.visible = false; });
  vrCtrls.forEach((c) => { c.userData.dot.visible = false; });
  coreTarget = 0;
  document.body.classList.remove('in-vr');
  camera.position.set(0, 0, 3.4);
  camera.up.set(0, 1, 0);
  camera.lookAt(0, 0, 0);
  syncSpin();
});
if (navigator.xr && navigator.xr.isSessionSupported) {
  navigator.xr.isSessionSupported('immersive-vr').then((ok) => {
    vr.supported = ok;
    const btn = $('#nav-vr');
    if (ok && btn) { btn.hidden = false; btn.addEventListener('click', enterVR); }
  }).catch(() => {});
}

/* ------------------------------------------------------------------ framing around the panel */

let offX = 0, offY = 0;
function frame() {
  const open = panel.classList.contains('open');
  const small = isSmall();
  const peek = panel.classList.contains('peek');
  const introOn = !$('#intro').classList.contains('gone') && !document.body.classList.contains('cine');
  const tx = open && !small ? Math.min(440, innerWidth * 0.4) / 2 : (introOn && !small ? -Math.min(220, innerWidth * 0.12) : 0);
  const introUp = introOn && small ? innerHeight * 0.1 : 0;
  const ty = open && small ? (peek ? 70 : innerHeight * 0.3) : introUp;
  offX += (tx - offX) * 0.08;
  offY += (ty - offY) * 0.08;
  if (Math.abs(offX) < 0.5 && Math.abs(offY) < 0.5 && !open && !introOn) { camera.clearViewOffset(); return; }
  camera.setViewOffset(innerWidth, innerHeight, offX, offY, innerWidth, innerHeight);
}


/* ------------------------------------------------------------------ quality: always smooth, whatever the device */

// Watches how long frames take and steps the detail down (or once back up) so the world never stutters.
// Level 2: everything. Level 1: lighter pixels, no cloud shadows, fewer trees. Level 0: no bloom or focus blur, sparse forests.
const QUALITY_FORCED = /q=([012])/.exec(location.hash);
const quality = { level: -1, max: isSmall() || isTouch ? 1 : 2, frames: [], lastChange: 0, ups: 0, startAt: 0, lastNow: 0 };
const baseShadow = WEATHER.uShadow.value;
function setQuality(level) {
  level = THREE.MathUtils.clamp(level, 0, 2);
  if (level === quality.level) return;
  quality.level = level;
  const dpr = Math.min(devicePixelRatio, [1.5, 1.75, 2][level]); // sharpness is the last thing to give
  renderer.setPixelRatio(dpr);
  renderer.setSize(innerWidth, innerHeight);
  composer.setPixelRatio(dpr);
  composer.setSize(innerWidth, innerHeight);
  bloom.enabled = level > 0;
  WEATHER.uShadow.value = level >= 1 && !baseShadowOff ? baseShadow : 0;
  const keep = [0.4, 0.7, 1][level];
  forestMeshes.forEach(({ m, full }) => { m.count = Math.floor(full * keep); });
  document.body.dataset.quality = String(level);
}
setQuality(QUALITY_FORCED ? +QUALITY_FORCED[1] : quality.max);
function stepQuality(now, inVR) {
  if (QUALITY_FORCED || inVR || /dev/.test(location.hash) || !gateOpen || document.hidden) { quality.lastNow = now; return; }
  if (!quality.startAt) quality.startAt = now + 2500; // let the opening settle first
  const dt = now - (quality.lastNow || now);
  quality.lastNow = now;
  if (now < quality.startAt || dt <= 0 || dt > 1500) return;
  quality.frames.push(dt);
  const sum = quality.frames.reduce((x, y) => x + y, 0);
  if (sum < 1500 || quality.frames.length < 8) return; // judge every second and a half
  const avg = sum / quality.frames.length;
  quality.frames.length = 0;
  if (avg > 27) quality.wantDown = true;
  if (spin.pointers.size > 0 || now - lastInteract < 1200) return; // never switch mid-gesture: wait for a pause
  if (quality.wantDown && quality.level > 0 && now - quality.lastChange > 2500) {
    quality.wantDown = false; // under ~37 fps: lighten up
    setQuality(quality.level - 1);
    quality.lastChange = now;
  } else if (avg < 15.5 && quality.level < quality.max && quality.ups < 1 && now - quality.lastChange > 9000) { // lots of headroom: one step back up
    setQuality(quality.level + 1);
    quality.lastChange = now;
    quality.ups++;
  }
}


/* ------------------------------------------------------------------ safe mode: never a black screen */

// Right after drawing, peek at a few pixels around the middle of the screen (where the world is). If they're all pure
// black several checks in a row, something this device's graphics can't handle is wiping the picture. Switch effects
// off one at a time, from most to least likely, until the world shows. Every step is noted for the diagnostics panel.
const safe = { since: 0, step: 0, direct: false, blackRuns: 0, lastCheck: 0, log: [] };
const SAFE_STEPS = [
  ['cloud shadows off', () => { WEATHER.uShadow.value = 0; baseShadowOff = true; }],
  ['anti-aliasing off', () => { [composer.renderTarget1, composer.renderTarget2].forEach((rt) => { rt.samples = 0; rt.dispose(); }); }],
  ['glow off', () => { bloom.enabled = false; }],
  ['film effects off', () => { lens.enabled = false; }],
  ['direct drawing', () => { safe.direct = true; renderer.toneMapping = THREE.ACESFilmicToneMapping; }],
];
const _px = new Uint8Array(4 * 9);
function watchdog(now) {
  if (!gateOpen || safe.step >= SAFE_STEPS.length) return;
  if (introDone && !safe.since) safe.since = now;
  if (safe.since && now - safe.since > 12000 && !safe.blackRuns) return; // checks cost a tiny stall: only in the first moments
  const every = now - safe.lastCheck;
  if (every < (safe.blackRuns ? 300 : 2500)) return;
  safe.lastCheck = now;
  if (!introDone || flight || coreMix > 0.05 || camera.position.length() > 6) return; // only judge when the world fills the middle
  const gl = renderer.getContext();
  const w = gl.drawingBufferWidth, h = gl.drawingBufferHeight;
  let sum = 0;
  try {
    for (let i = 0; i < 9; i++) {
      gl.readPixels(Math.floor(w * (0.4 + (i % 3) * 0.1)), Math.floor(h * (0.4 + Math.floor(i / 3) * 0.1)), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, _px.subarray(i * 4, i * 4 + 4));
    }
    for (let i = 0; i < 9; i++) sum += (_px[i * 4] + _px[i * 4 + 1] + _px[i * 4 + 2]) * (_px[i * 4 + 3] / 255);
  } catch (e) { return; }
  if (sum > 0) { safe.blackRuns = 0; return; }
  safe.blackRuns++;
  if (safe.blackRuns < 3) return;
  safe.blackRuns = 0;
  const [name, fix] = SAFE_STEPS[safe.step++];
  fix();
  safe.log.push(name);
}

// Diagnostics: tap the LIVE readout (top left) four times quickly. Screenshot it and send it over.
const diagErrors = [];
{
  const keep = (kind) => (...a) => { diagErrors.push(`${kind}: ${a.map((x) => String(x && x.message ? x.message : x)).join(' ').slice(0, 300)}`); if (diagErrors.length > 12) diagErrors.shift(); };
  const ce = console.error.bind(console), cw = console.warn.bind(console);
  console.error = (...a) => { keep('error')(...a); ce(...a); };
  console.warn = (...a) => { keep('warn')(...a); cw(...a); };
  addEventListener('error', (e) => keep('crash')(e.message));
}
function showDiag() {
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  const lines = [
    `GPU: ${gpu}`,
    `WebGL2: ${renderer.capabilities.isWebGL2} · max samples ${renderer.capabilities.maxSamples} · MSAA ${MSAA}`,
    `float buffers: ${Boolean(gl.getExtension('EXT_color_buffer_float'))} / half ${Boolean(gl.getExtension('EXT_color_buffer_half_float'))}`,
    `quality ${quality.level} · pixel ratio ${renderer.getPixelRatio().toFixed(2)} · screen ${innerWidth}×${innerHeight}`,
    `safe mode: ${safe.log.length ? safe.log.join(' → ') : 'not needed'}`,
    `frame ${Math.round(1000 / Math.max(1, (quality.frames.reduce((a, b) => a + b, 0) / Math.max(1, quality.frames.length)) || 16))} fps (approx)`,
    ...diagErrors.slice(-8),
  ];
  let el = $('#diag');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'diag';
    el.addEventListener('click', () => el.remove());
    document.body.appendChild(el);
  }
  el.textContent = `TD1.WORLD diagnostics (tap to close)\n\n${lines.join('\n')}`;
}
{
  let taps = [];
  const hudEl = $('#hud');
  if (hudEl) {
    hudEl.addEventListener('pointerdown', () => {
      const now = performance.now();
      taps = taps.filter((t) => now - t < 1500);
      taps.push(now);
      if (taps.length >= 4) { taps = []; showDiag(); }
    });
  }
}

/* ------------------------------------------------------------------ products close by */

// Fly near a town and its product introduces itself: what it is, a demo, and a way to ask about it.
const nearEl = document.createElement('aside');
nearEl.id = 'near-card';
nearEl.setAttribute('aria-live', 'polite');
document.body.appendChild(nearEl);
let nearCity = -1, nearTick = 0, nearDismissed = -1;
function stepNearCard() {
  if ((nearTick = (nearTick + 1) % 8) !== 0) return;
  const dist = camera.position.length();
  let best = -1;
  if (introDone && !flight && !panel.classList.contains('open') && coreMix < 0.05 && spin.energy < 0.2 && dist < 2.05) {
    const cx = innerWidth / 2, cy = innerHeight / 2;
    let bd = Math.min(innerWidth, innerHeight) * (dist < 1.1 ? 0.45 : 0.2);
    const camDir = camera.position.clone().normalize();
    cities.forEach((c, i) => {
      if (!facing(c.pos)) return;
      if (dist < 1.15 && c.dir.angleTo(camDir) > 0.05) return; // down low, only the towns actually around you
      const sp = toScreen(c.pos);
      if (sp.z > 1) return;
      const d = Math.hypot(sp.x - cx, sp.y - cy);
      if (d < bd) { bd = d; best = i; }
    });
  }
  if (best === nearCity) return;
  nearCity = best;
  if (best < 0) { nearEl.classList.remove('on'); return; }
  const c = cities[best], p = c.product, reg = REGIONS[c.region];
  nearEl.style.setProperty('--c', reg.color);
  if (nearDismissed === best) { nearEl.classList.remove('on'); return; }
  nearEl.innerHTML = `<button type="button" class="x" aria-label="Hide">×</button><p class="kicker">${esc(reg.name)} · Product town</p><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
    <div class="acts">${p.demo ? `<a class="cta" href="${esc(p.demo)}" target="_blank" rel="noopener">Try the demo ↗</a>` : ''}
    <button type="button" class="cta ghost" data-ask="${best}">Ask about it</button></div>`;
  nearEl.classList.add('on');
}
nearEl.addEventListener('click', (e) => {
  if (e.target.closest('.x')) { nearDismissed = nearCity; nearEl.classList.remove('on'); return; }
  const ask = e.target.closest('[data-ask]');
  if (!ask) return;
  const p = cities[+ask.dataset.ask].product;
  nearEl.classList.remove('on');
  openContact({ type: 'General enquiry', message: `Hi TD1, I'd like to know more about ${p.name}.` });
});

/* ------------------------------------------------------------------ loop */

const hudEls = { pos: $('#hud-pos'), alt: $('#hud-alt'), over: $('#hud-over'), sun: $('#hud-sun') };
function updateHud() {
  if (!hudEls.pos) return;
  const d = camera.position.clone().normalize();
  const lat = Math.asin(THREE.MathUtils.clamp(d.y, -1, 1)) / DEG;
  const lon = Math.atan2(-d.z, d.x) / DEG;
  hudEls.pos.textContent = `${fmtLat(lat)} ${fmtLon(lon)}`;
  hudEls.alt.textContent = `${Math.round((camera.position.length() - 1) * 6371).toLocaleString('en-AU')} km`;
  const tr = terrain(d.x, d.y, d.z);
  hudEls.over.textContent = tr.h > 0 ? (tr.region === UNCH ? UNCHARTED.name : REGIONS[tr.region].name) : OCEAN.name;
  // local time down there, on the world's own clock
  let hr = 12 + ((Math.atan2(sunDir.z, sunDir.x) - Math.atan2(d.z, d.x)) / (Math.PI * 2)) * 24;
  hr = ((hr % 24) + 24) % 24;
  const hm = `${String(Math.floor(hr)).padStart(2, '0')}:${String(Math.floor((hr % 1) * 60)).padStart(2, '0')}`;
  const el = d.dot(sunDir);
  hudEls.sun.textContent = spin.energy > 0.3 ? 'Spin warning' : `${el > 0.12 ? 'Day' : el > -0.12 ? (hr < 12 ? 'Dawn' : 'Dusk') : 'Night'} ${hm}`;
}
const _lC = new THREE.Vector3(), _lT = new THREE.Vector3(), _lP = new THREE.Vector3();
const introEl = $('#intro');
function updateLabels() {
  const camDir = _lC.copy(camera.position).normalize();
  // keep labels off the welcome text while it is up
  const ir = introEl && !introEl.classList.contains('gone') && introEl.offsetParent ? introEl.getBoundingClientRect() : null;
  const camDist = camera.position.length();
  labels.forEach((l) => {
    const p = l.getPos();
    let vis;
    if (l.layer === 'core') vis = ss(coreMix, 0.55, 1);
    else if (l.surface) vis = THREE.MathUtils.smoothstep(_lP.copy(p).normalize().dot(camDir), 0.2, 0.5);
    else {
      // hidden while behind the planet
      const toObj = _lT.copy(p).sub(camera.position);
      const tClosest = -camera.position.dot(toObj) / toObj.lengthSq();
      const closest = _lP.copy(camera.position).addScaledVector(toObj, Math.max(0, Math.min(1, tClosest)));
      vis = closest.length() < 1.1 && tClosest > 0 && tClosest < 1 ? 0 : 1;
    }
    if (l.layer !== 'core' && l.surface) {
      if (camDist < 1.9) vis *= THREE.MathUtils.smoothstep(camDist, 1.6, 1.9); // get out of the way up close
      vis *= 1 - coreMix;
    }
    vis *= 1 - Math.min(1, spin.energy * 1.5);
    // fade out at the screen edges and clear of the top bar and the Explore button, so labels never clip or overlap the UI
    const s = vis > 0.005 ? toScreen(p) : null;
    if (s) {
      const W = innerWidth, H = innerHeight, top = isSmall() ? 74 : 84, bottom = isSmall() ? 120 : 96;
      const edge = Math.min(s.x - 46, W - s.x - 46, s.y - top, H - bottom - s.y);
      vis *= THREE.MathUtils.clamp(edge / 36, 0, 1);
      if (ir && s.x > ir.left - 60 && s.x < ir.right + 60 && s.y > ir.top - 20 && s.y < ir.bottom + 20) vis *= 0.0;
    }
    const op = vis.toFixed(2);
    if (op !== l.op) { l.el.style.opacity = op; l.op = op; }
    const pe = vis > 0.4 ? 'auto' : 'none';
    if (pe !== l.pe) { l.el.style.pointerEvents = pe; l.pe = pe; }
    if (vis < 0.005) return; // hidden: no need to move it
    const tr = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) translate(-50%, -50%)`;
    if (tr !== l.tr) { l.el.style.transform = tr; l.tr = tr; }
  });
}

let introDone = false;
const introTo = latLon(22, ARRIVE_LON).multiplyScalar(fitDist(1.16, 3.0)); // the world fills more of the screen

/* The opening shot: skim low over the night side as the sun rises over the horizon, then pull back to reveal the world. */
const cine = { start: 0, S: new THREE.Vector3(), N: new THREE.Vector3(), titled: false, skip: false };
const CINE_R = 1.32;
const cinePose = (theta) => cine.N.clone().multiplyScalar(Math.cos(theta)).addScaledVector(cine.S, -Math.sin(theta)).multiplyScalar(CINE_R);
const CINE_A = 4200, CINE_B = 4600;
// Aim so the planet's edge sits in the lower third with the sun climbing over it.
function cineAim(pos) {
  const u = pos.clone().normalize().negate(); // towards the planet's centre
  const w = cine.S.clone().addScaledVector(u, -cine.S.dot(u)).normalize();
  const edge = Math.asin(1 / pos.length()); // angular radius of the planet from here
  const a = edge + 0.12;
  return { dir: u.clone().multiplyScalar(Math.cos(a)).addScaledVector(w, Math.sin(a)), up: w.clone().multiplyScalar(Math.cos(a)).addScaledVector(u, -Math.sin(a)) };
}
function aimCine() {
  cine.S.copy(sunDir).normalize();
  const f = introTo.clone().normalize();
  cine.N.copy(f).addScaledVector(cine.S, -f.dot(cine.S)).normalize();
}
// Behind the gate: hang in the dark just above the world's edge, the sun about to rise.
function stepGate(t) {
  aimCine();
  const pos = cinePose(0.86 + Math.sin(t * 0.15) * 0.01);
  camera.position.copy(pos);
  const aim = cineAim(pos);
  camera.up.copy(aim.up);
  camera.lookAt(pos.clone().add(aim.dir));
}
function stepIntro(now) {
  if (!cine.start) {
    cine.start = now;
    aimCine();
    if (!reduceMotion) document.body.classList.add('cine');
  }
  const hold = /^#cine=(\d+)$/.exec(location.hash); // td1.world/#cine=2000 freezes the opening at 2 s (for framing)
  const T = reduceMotion || cine.skip ? 1e9 : hold ? +hold[1] : now - cine.start;
  if (T < CINE_A) { // sunrise over the limb
    const k = T / CINE_A;
    score.swell(k * 0.55);
    if (k > 0.5 && !cine.bloomed) { cine.bloomed = true; score.bloom(); } // the sun breaks the horizon
    const pos = cinePose(THREE.MathUtils.lerp(0.86, 0.5, ease(k))); // the sun starts hidden behind the planet's edge
    camera.position.copy(pos);
    const aim = cineAim(pos);
    camera.up.copy(aim.up);
    camera.lookAt(pos.clone().add(aim.dir));
  } else if (T < CINE_A + CINE_B) { // pull back and swing round to face the world
    const k = ease((T - CINE_A) / CINE_B);
    score.swell(0.55 + k * 0.45);
    const p0 = cinePose(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(p0.clone().normalize(), introTo.clone().normalize());
    const dir = p0.clone().normalize().applyQuaternion(new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(), q, k));
    camera.position.copy(dir.multiplyScalar(THREE.MathUtils.lerp(p0.length(), introTo.length(), k)));
    const aim = cineAim(p0);
    camera.up.copy(aim.up).lerp(new THREE.Vector3(0, 1, 0), k).normalize();
    camera.lookAt(p0.clone().addScaledVector(aim.dir, 6).lerp(new THREE.Vector3(), Math.min(1, k * 1.2)));
    if (!cine.titled && T > CINE_A + 500) { cine.titled = true; document.body.classList.add('cine-title'); score.chime(81); }
  } else {
    camera.position.copy(introTo);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    introDone = true;
    syncSpin();
    score.swell(0.38);
    score.place('space');
    document.body.classList.remove('cine');
    setTimeout(() => document.body.classList.remove('cine-title'), 1400);
  }
}
let gateOpen = false, gateAt = 0;
const skipIntro = (e) => {
  if (!gateOpen || introDone || performance.now() - gateAt < 800) return;
  if (e && e.target && e.target.closest && e.target.closest('#gate')) return;
  cine.skip = true;
};
const soundBtn = $('#nav-sound');
// sound is on unless the visitor has turned it off before
const soundPref = () => { try { return localStorage.getItem('td1-sound') !== 'off'; } catch (e) { return true; } };
function setSound(onNow, remember = true) {
  if (onNow) score.enable(); else score.disable();
  if (remember) { try { localStorage.setItem('td1-sound', onNow ? 'on' : 'off'); } catch (e) { /* fine */ } }
  soundBtn.setAttribute('aria-pressed', String(onNow));
  soundBtn.querySelector('span').textContent = onNow ? 'Sound on' : 'Sound off';
  document.body.classList.toggle('sound-on', onNow);
}
soundBtn.addEventListener('click', () => setSound(soundBtn.getAttribute('aria-pressed') !== 'true'));
// The gate: one tap to enter. That tap is what lets the browser play sound, so the music is there from the first frame.
function enterWorld(withSound, remember = true) {
  if (gateOpen) return;
  gateOpen = true;
  gateAt = performance.now();
  if (withSound) { setSound(true, remember); score.open(); } else setSound(false, remember);
  document.body.classList.add('entered');
  enableMotion();
  setTimeout(() => { const g = $('#gate'); if (g) g.hidden = true; }, 1800);
}
const quietFirst = !soundPref(); // they chose quiet last time: offer that first
$('#enter').addEventListener('click', () => enterWorld(!quietFirst));
$('#enter-quiet').addEventListener('click', () => enterWorld(quietFirst));
if (quietFirst) {
  $('#gate .g-note').firstChild.textContent = 'Sound is off · ';
  $('#enter-quiet').textContent = 'Enter with sound';
}
// links for testing and framing (#dev, #cine=…) skip the gate, quietly
if (/dev|cine=/.test(location.hash)) enterWorld(false, false);
addEventListener('keydown', skipIntro);
$('#skip').addEventListener('click', skipIntro);

/* Lens flare: a starburst and anamorphic streak on the sun, ghosts across the lens, hidden when the planet blocks the sun. */
const flareEl = document.createElement('div');
flareEl.id = 'flare';
flareEl.setAttribute('aria-hidden', 'true');
flareEl.innerHTML = '<i class="core"></i><i class="streak"></i><i class="g g1"></i><i class="g g2"></i><i class="g g3"></i><i class="g g4"></i>';
document.body.appendChild(flareEl);
const flareParts = [...flareEl.children];
const FLARE_K = [0, 0, 0.55, 1.0, 1.4, 1.85];
function updateFlare() {
  const S = sunGlow.position;
  const toSun = S.clone().sub(camWorld).normalize();
  const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(camWorldQ);
  const p = S.clone().project(camera);
  const tca = -camWorld.dot(toSun);
  const closest = camWorld.clone().addScaledVector(toSun, Math.max(0, tca)).length();
  const clear = tca > 0 ? sstep(closest, 1.005, 1.08) : 1;
  const vis = clear * sstep(toSun.dot(fwd), 0.5, 0.8) * (1 - sstep(Math.max(Math.abs(p.x), Math.abs(p.y)), 0.95, 1.3));
  flareEl.style.opacity = vis.toFixed(3);
  if (vis < 0.005) return;
  const sx = (p.x * 0.5 + 0.5) * innerWidth, sy = (-p.y * 0.5 + 0.5) * innerHeight;
  const cx = innerWidth / 2, cy = innerHeight / 2;
  flareParts.forEach((el, i) => {
    const k = FLARE_K[i];
    el.style.transform = `translate(${sx + (cx - sx) * k * 2}px, ${sy + (cy - sy) * k * 2}px) translate(-50%, -50%)`;
  });
}

function loop() {
  const now = performance.now();
  const t = clock.getElapsedTime();
  const dtFrame = Math.min(0.05, t - (loop.prevT ?? t));
  loop.prevT = t;
  U.uTime.value = t;
  const inVR = renderer.xr.isPresenting;
  stepQuality(now, inVR);
  camera.getWorldPosition(camWorld);
  camera.getWorldQuaternion(camWorldQ);

  if (inVR) stepVR(dtFrame, t);
  else if (!introDone) { if (gateOpen) stepIntro(now); else stepGate(t); }
  else if (flight) stepFlight(now);
  else stepSpin(dtFrame, t, now);

  if (!reduceMotion) { // the sun circles the world: day and night
    sunAt(SUN0 + sunShift + t * DAY_RATE, sunDir);
    sun.position.copy(sunDir).multiplyScalar(10);
    rim.position.copy(sunDir).multiplyScalar(-10).setY(-2);
  }
  coreMix += (coreTarget - coreMix) * (reduceMotion ? 1 : 0.035);
  if (Math.abs(coreTarget - coreMix) < 0.001) coreMix = coreTarget;
  applyCore(coreMix, t);
  stepRipples(now);
  if (coreMix < 0.5) stepLife(reduceMotion ? 0 : Math.min(0.05, t - (loop.lastT ?? t)), t);
  loop.lastT = t;

  clouds.rotation.y += dtFrame * (0.01 + spin.energy * 2.5);
  WEATHER.uSunLocal.value.copy(sunDir).applyQuaternion(_pq.copy(planet.quaternion).invert());
  WEATHER.uCloudRot.value.setFromMatrix4(_cm.makeRotationY(-clouds.rotation.y));
  stepStorms(t, dtFrame);
  cloudBake.update(t, false);
  stepSpill(dtFrame, t);
  sunGlow.position.copy(sunDir).multiplyScalar(60);
  realmPivot.rotation.y = t * 0.06;
  realm.rotation.y = t * 0.2;
  { // the moon holds still while its panel is open
    const dt = Math.min(0.05, t - (mindaloo.userData.lastT ?? t));
    mindaloo.userData.lastT = t;
    if (!(selected && selected.kind === 'mindaloo')) mindaloo.userData.angle = (mindaloo.userData.angle || 0) - dt * 0.09;
    mindalooPivot.rotation.y = mindaloo.userData.angle || 0;
  }
  { // the station holds still while its shop is open, so it stays in view
    const dt = Math.min(0.05, t - (exchange.userData.lastT ?? t));
    exchange.userData.lastT = t;
    if (!(selected && selected.kind === 'shop')) exchange.userData.angle = (exchange.userData.angle || 0) + dt * 0.07;
    exchangePivot.rotation.y = exchange.userData.angle || 0;
  }
  exchange.userData.habitat.rotation.y = t * 0.5;
  exchange.lookAt(camWorld); // always shown three-quarter on: ring, dome and wings all visible
  exchange.userData.station.rotation.set(0.8, 0.5 + Math.sin(t * 0.25) * 0.5, 0.18);
  exchange.userData.shuttlePath.rotation.y = -t * 0.9;
  exchange.userData.navLights.forEach((n, i) => { n.visible = Math.sin(t * 4 + i * Math.PI) > 0.3; });
  exchange.userData.dome.material.emissiveIntensity = 0.7 + Math.sin(t * 1.6) * 0.25;
  {
    const d = exchange.getWorldPosition(new THREE.Vector3()).distanceTo(camWorld);
    exchange.scale.setScalar(1.5 * THREE.MathUtils.clamp((d - 0.3) / 0.8, 0.05, 1));
  }
  beacon.userData.sweep.rotation.y = t * 1.4;
  beaconFlash = Math.max(0, beaconFlash - 0.01);
  beacon.userData.sweep.children[0].material.opacity = 0.16 + beaconFlash * 0.5;
  beacon.visible = coreMix < 0.5;
  mindaloo.userData.body.rotation.y = t * 0.05;
  { // the emblem faces you: crown just behind the moon, rune just in front, a little below centre as in the artwork
    const u = mindaloo.userData;
    mindaloo.updateMatrixWorld();
    _mInv.copy(mindaloo.matrixWorld).invert();
    _mDir.copy(camWorld).applyMatrix4(_mInv).normalize();
    mindaloo.getWorldQuaternion(_mQ).invert();
    _mUp.copy(camAxis(1)).applyQuaternion(_mQ).normalize();
    _mRight.copy(camAxis(0)).applyQuaternion(_mQ).normalize();
    u.crown.position.set(0, 0, 0); // exactly at the moon's centre: no parallax, so it never drifts off-centre
    { // where to print the rune: the moon's centre and size, as you see it
      const rm = u.body.material.userData.rune;
      rm.c.value.copy(mindaloo.getWorldPosition(_mW)).applyMatrix4(camera.matrixWorldInverse);
      rm.r.value = u.MOON_R * 0.8 * mindaloo.scale.x;
    }
    CAM_RIGHT.value.copy(camAxis(0));
    CAM_UP.value.copy(camAxis(1));
    u.crescents.forEach((c, i) => { // at their places in the emblem, slowly turning
      c.position.copy(_mRight).multiplyScalar((i ? 253 : -253) * u.px).addScaledVector(_mUp, -73 * u.px);
      c.rotation.y = t * 0.04 * (i ? -1 : 1) + i * 2;
      c.visible = coreMix < 0.5;
    });
    // over the planet the crown would read like a sticker on the world: let it recede, and shine against space
    const mw = mindaloo.getWorldPosition(_mW);
    const toMoon = _mW2.copy(mw).sub(camWorld), dM = toMoon.length();
    const toPlanet = _mW3.copy(camWorld).negate();
    const sep = toMoon.angleTo(toPlanet);
    const planetAng = Math.asin(Math.min(1, 1.05 / camWorld.length()));
    const over = THREE.MathUtils.smoothstep(sep, planetAng + 0.05, planetAng - 0.25) * (dM < camWorld.length() ? 1 : 0);
    const sel = selected && selected.kind === 'mindaloo';
    u.crown.material.opacity += ((sel ? 1 : 0.8) * (1 - over * 0.75) - u.crown.material.opacity) * 0.06;
    u.crown.visible = coreMix < 0.5;
  }
  mindaloo.userData.halo.material.opacity = 0.8 + Math.sin(t * 0.8) * 0.2;
  { // shrink away instead of filling the screen when it passes the camera
    const d = mindaloo.getWorldPosition(new THREE.Vector3()).distanceTo(camWorld);
    mindaloo.scale.setScalar(THREE.MathUtils.clamp((d - 0.45) / 1.0, 0.05, 1));
  }
  peaks.forEach((p, i) => { p.gem.rotation.y = t * 1.2 + i; p.gem.position.y = 0.21 + Math.sin(t * 1.5 + i) * 0.008; });
  monoliths.forEach((m, i) => { m.cap.material.color.setHSL(0.11, 1, 0.55 + Math.sin(t * 2 + i) * 0.12); });

  if (!inVR && (loop.hudTick = (loop.hudTick || 0) + 1) % 6 === 0) updateHud();
  stepMeteor(t);
  stepComet(t);
  dust.rotation.y = t * 0.004;
  if (!inVR) {
    applyParallax(t);
    frame();
    updateHover();
    updateLabels();
    stepSay(t);
    stepNearCard();
    updateFlare();
  } else flareEl.style.opacity = '0';
  U.uLin.value = inVR || safe.direct ? 0 : 1;
  lens.uniforms.uTime.value = t;
  { // focus pulls in on close-ups
    const target = introDone && !inVR && quality.level > 0 && !isTouch ? THREE.MathUtils.smoothstep(2.35 - camWorld.length(), 0, 0.6) * (selected ? 1 : 0.7) * (1 - landK(camWorld.length()) * 0.75) : 0;
    lens.uniforms.uDof.value += (target - lens.uniforms.uDof.value) * 0.05;
  }
  const ground = stepGround(inVR);
  if (!inVR || score.on) score.spin(Math.max(spin.energy, ground * 0.22)); // wind when you're down in the air
  if (inVR || safe.direct) renderer.render(scene, camera);
  else composer.render(); // the camera keeps its parallax until the next frame, so taps line up with what's drawn
  if (!inVR) watchdog(now);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.resolution.set(innerWidth * bloomScale, innerHeight * bloomScale);
  lens.uniforms.uAspect.value = innerWidth / innerHeight;
});

document.body.classList.add('ready');
$('#enter').disabled = false;
$('#enter-quiet').disabled = false;
$('#enter').focus({ preventScroll: true });
if (location.hash === '#spill') setTimeout(() => startSpill(0.9), 3600); // td1.world/#spill shows the ocean spill straight away
// Custom shaders were written in display colours; in the film pipeline they convert to linear light so
// bloom and grading treat everything alike. In VR (rendered directly) they stay as written.
scene.traverse((o) => {
  const m = o.material;
  if (!m || !m.isShaderMaterial || m.userData.linearized) return;
  m.userData.linearized = true;
  m.uniforms.uLin = U.uLin;
  m.fragmentShader = `uniform float uLin;\n${m.fragmentShader}`;
  const end = m.fragmentShader.lastIndexOf('}');
  m.fragmentShader = `${m.fragmentShader.slice(0, end)}  gl_FragColor.rgb = mix(gl_FragColor.rgb, pow(max(gl_FragColor.rgb, vec3(0.0)), vec3(2.2)), uLin);\n}`;
  m.needsUpdate = true;
});
renderer.setAnimationLoop(loop);
// td1.world/#dev exposes a few handles for framing shots and testing
if (/blacktest/.test(location.hash)) { // for testing: one object that outputs invalid pixels
  const bad = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), new THREE.ShaderMaterial({ uniforms: { uZero: { value: 0 } }, vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: 'uniform float uZero; void main(){ gl_FragColor = vec4(vec3(uZero / uZero), 1.0); }' }));
  bad.position.set(0, 0, 1.3);
  planet.add(bad);
}
if (/dev/.test(location.hash)) {
  window.td1 = { THREE, PLACES, TOWN_MAX, camera, spin, planet, sunDir, latLon, flyTo, syncSpin, cities, landAt, selectRegion, surf: surfaceRadius, greetRobot, MSAA, safe, mindaloo, robots, ships, flocks, sats, comet, skip: () => { enterWorld(false, false); cine.skip = true; }, setSun: (rad) => { sunShift = rad; }, get introDone() { return introDone; } };
}

/* ------------------------------------------------------------------ no WebGL: still a usable site */

function showFallback() {
  document.body.classList.add('no-webgl');
  const box = $('#fallback');
  box.innerHTML = `<h2>TD1.WORLD</h2><p>Your browser could not start the 3D world, so here is the map in words.</p>${REGIONS.map((r) => `
    <section style="--c:${r.color}"><p class="kicker">${esc(r.era)}</p><h3>${esc(r.name)}</h3><p>${esc(r.intro)}</p></section>`).join('')}
    <p><a class="cta" href="${REALM_URL}">Enter Realm →</a></p>`;
}
