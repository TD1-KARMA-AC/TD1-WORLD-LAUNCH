// TD1.WORLD — the living planet.
// One sphere, five impossible continents, an ocean of data, cities of light, and two moons.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import {
  REGIONS, OCEAN, UNCHARTED, HISTORY, PEAKS, HORIZONS, NOTES, MINDALOO_URL, REALM_URL, CORE, STRATA,
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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 1.45;
controls.maxDistance = 10;
controls.rotateSpeed = 0.55;
controls.zoomSpeed = 0.8;
controls.autoRotate = !reduceMotion;
controls.autoRotateSpeed = 0.35;

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

// h > 0 is land. region is a REGIONS index, UNCH for islands, -1 for open ocean.
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
  }
  return { h, region };
}
function elevation(x, y, z, h) {
  if (h <= 0) return Math.max(-0.03, h * 0.1);
  const ridge = 1 - Math.abs(fbm(x * 7 + 2, y * 7 + 9, z * 7 + 4, 3) * 1.6);
  return 0.005 + h * 0.045 + Math.pow(Math.max(0, ridge), 4) * Math.min(h, 0.8) * 0.07;
}

const planet = new THREE.Group();
scene.add(planet);

const landFaces = []; // per kept face: { c: centroid (unit), r: radius, region, h }
const byRegion = Array.from({ length: REGIONS.length + 1 }, () => []);

function buildLand() {
  const detail = isSmall() || isTouch ? 52 : 80;
  const ico = new THREE.IcosahedronGeometry(1, detail);
  const src = ico.attributes.position;
  const cache = new Map();
  const sample = (i) => {
    const x = src.getX(i), y = src.getY(i), z = src.getZ(i);
    const key = `${Math.round(x * 1e5)},${Math.round(y * 1e5)},${Math.round(z * 1e5)}`;
    let v = cache.get(key);
    if (!v) { const t = terrain(x, y, z); v = { x, y, z, h: t.h, region: t.region, e: elevation(x, y, z, t.h) }; cache.set(key, v); }
    return v;
  };

  const pos = [], col = [], reg = [];
  const c = new THREE.Color(), white = new THREE.Color(1, 1, 1), uncharted = new THREE.Color(UNCHARTED.color);
  const jitter = rng(7);
  for (let f = 0; f < src.count / 3; f++) {
    const v = [sample(f * 3), sample(f * 3 + 1), sample(f * 3 + 2)];
    const top = v.reduce((a, b) => (b.h > a.h ? b : a));
    if (top.h <= 0) continue; // open ocean: the data sea covers it
    const region = top.region;
    const hAvg = (v[0].h + v[1].h + v[2].h) / 3;
    const t = Math.min(1, Math.max(0, hAvg / 0.75));
    c.copy(region === UNCH ? uncharted : REGIONS[region].col);
    c.multiplyScalar(0.42 + 0.5 * t);
    if (hAvg < 0.025) c.lerp(white, 0.32); // glowing shoreline
    if (t > 0.86) c.lerp(white, (t - 0.86) * 2.4); // lit peaks
    c.offsetHSL(0, 0, (jitter() - 0.5) * 0.06); // hand-made, felt-and-card texture
    for (const p of v) {
      const r = 1 + p.e;
      pos.push(p.x * r, p.y * r, p.z * r);
      col.push(c.r, c.g, c.b);
      reg.push(region);
    }
    const cx = (v[0].x + v[1].x + v[2].x) / 3, cy = (v[0].y + v[1].y + v[2].y) / 3, cz = (v[0].z + v[1].z + v[2].z) / 3;
    const face = { c: new THREE.Vector3(cx, cy, cz).normalize(), r: 1 + (v[0].e + v[1].e + v[2].e) / 3, region, h: hAvg };
    landFaces.push(face);
    byRegion[region].push(face);
  }
  ico.dispose();

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aRegion', new THREE.Float32BufferAttribute(reg, 1));
  g.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.82, metalness: 0.05, transparent: true });
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
        totalEmissiveRadiance += vColor.rgb * (0.07 + sel * (0.1 + 0.06 * sin(uTime * 2.6)));
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
    uniforms: { uTime: U.uTime, uSun: { value: sunDir }, uHi: { value: 0 }, uAlpha: { value: 1 } },
    transparent: true,
    vertexShader: `
      varying vec3 vPos; varying vec3 vN; varying vec3 vView;
      void main(){
        vPos = position;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uSun; uniform float uHi; uniform float uAlpha;
      varying vec3 vPos; varying vec3 vN; varying vec3 vView;
      float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
      float h2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){
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
addLabel('<span class="nm">Mindaloo AC</span><span class="era">Moonlight</span>', 'moon mindaloo', () => mindaloo.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.19, 0)), () => openSpecial('mindaloo'), { surface: false });

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
  controls.autoRotate = false;
  controls.enabled = false;
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
  if (t >= 1) { flight = null; controls.enabled = true; controls.update(); }
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
    extra = `<section><h3>Projections</h3><ul class="horizons">${HORIZONS.map(([h, t, d]) => `<li><span class="hz hz-${h.toLowerCase()}">${esc(h)}</span><div><b>${esc(t)}</b><span>${esc(d)}</span></div></li>`).join('')}</ul></section>`;
  }
  return header(r) + notesHtml(r.id) + extra + peaksHtml(ri) + citiesHtml(ri);
}
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
    return header({ name: 'Mindaloo AC', era: 'Moonlight', color: '#D9CCFF', tagline: 'The personal AI OS where Karma AC lives.', intro: 'Mindaloo means moonlight. This moon is Mindaloo AC: a sovereign AI operating system with a persistent identity, a spatial multi-agent canvas and its own home on the web. As it orbits, its light falls across every continent.' })
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
  const go = e.target.closest('[data-go]');
  if (go) {
    if (go.dataset.go === 'core') enterCore();
    else if (go.dataset.go === 'mindaloo') openSpecial('mindaloo');
    else if (go.dataset.go === 'surface') { closePanel(); flyTo(camera.position.clone(), fitDist(1.32, 3.4), 2000); }
  }
});
$('#panel-close').addEventListener('click', closePanel);
$('#panel-grip').addEventListener('click', () => panel.classList.toggle('peek'));
addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

/* ------------------------------------------------------------------ dock */

const dock = $('#dock');
[...REGIONS.map((r, i) => ({ id: r.id, name: r.name, color: r.color, go: () => selectRegion(i) })),
  { id: 'core', name: 'Karma Core', color: CORE.color, go: () => enterCore() },
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
    const hit = ray.intersectObjects([realm, mindaloo.userData.body, coreBall], false)[0];
    if (!hit) return null;
    if (hit.object === coreBall) return { kind: 'core', label: CORE.name, sub: 'Consciousness' };
    if (hit.object === realm) return { kind: 'realm', label: 'Realm', sub: 'Connected world' };
    return { kind: 'mindaloo', label: 'Mindaloo AC', sub: 'Moonlight' };
  }
  const reach = isTouch ? 26 : 15;
  const ci = nearest(cities, px, py, reach);
  if (ci !== null) return { kind: 'city', index: ci, label: cities[ci].product.name, sub: REGIONS[cities[ci].region].name };
  const pi = nearest(peaks, px, py, reach + 4);
  if (pi !== null) return { kind: 'peak', index: pi, label: peaks[pi].name, sub: 'Unsolved problem' };
  const mi = nearest(monoliths, px, py, reach);
  if (mi !== null) return { kind: 'monolith', index: mi, label: monoliths[mi].entry[1], sub: monoliths[mi].entry[0] };
  ndc.set((px / innerWidth) * 2 - 1, -(py / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects([realm, mindaloo.userData.body, pickSphere], false)[0];
  if (!hit) return null;
  if (hit.object === realm) return { kind: 'realm', label: 'Realm', sub: 'Connected world' };
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
  else openSpecial(h.kind);
}

const cv = renderer.domElement;
cv.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY, type: e.pointerType }; });
cv.addEventListener('pointerleave', () => { pointer = null; });
cv.addEventListener('pointerdown', (e) => { downAt = { x: e.clientX, y: e.clientY, t: performance.now() }; lastInteract = performance.now(); controls.autoRotate = false; $('#intro').classList.add('gone'); });
cv.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y);
  if (moved < 7 && performance.now() - downAt.t < 600) {
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
cv.addEventListener('wheel', () => { lastInteract = performance.now(); controls.autoRotate = false; $('#intro').classList.add('gone'); }, { passive: true });

const ripples = [];
const rippleGeo = new THREE.RingGeometry(0.9, 1, 64);
function spawnRipple(dir, color) {
  if (reduceMotion) return;
  const d = dir.clone().normalize();
  const t = terrain(d.x, d.y, d.z);
  const m = new THREE.Mesh(rippleGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.position.copy(d).multiplyScalar((t.h > 0 ? 1 + elevation(d.x, d.y, d.z, t.h) : 1) + 0.008);
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
  if (!pointer || pointer.type === 'touch' || flight) { tip.classList.remove('on'); cv.style.cursor = ''; return; }
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
  U.uTime.value = t;

  if (!introDone) {
    const k = reduceMotion ? 1 : Math.min(1, (now - introStart) / 2800);
    camera.position.lerpVectors(introFrom, introTo, ease(k));
    camera.lookAt(0, 0, 0);
    if (k >= 1) { introDone = true; controls.update(); }
  } else if (flight) stepFlight(now);
  else {
    if (!reduceMotion && !selected && !controls.autoRotate && now - lastInteract > 9000) controls.autoRotate = true;
    controls.update();
  }

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

  clouds.rotation.y = t * 0.01;
  realmPivot.rotation.y = t * 0.06;
  realm.rotation.y = t * 0.2;
  mindalooPivot.rotation.y = -t * 0.09;
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
loop();

/* ------------------------------------------------------------------ no WebGL: still a usable site */

function showFallback() {
  document.body.classList.add('no-webgl');
  const box = $('#fallback');
  box.innerHTML = `<h2>TD1.WORLD</h2><p>Your browser could not start the 3D world, so here is the map in words.</p>${REGIONS.map((r) => `
    <section style="--c:${r.color}"><p class="kicker">${esc(r.era)}</p><h3>${esc(r.name)}</h3><p>${esc(r.intro)}</p></section>`).join('')}
    <p><a class="cta" href="${REALM_URL}">Enter Realm →</a></p>`;
}
