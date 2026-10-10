// TD1.WORLD models: the real things that live on and around the world.
// Each model is built from simple shapes merged into one geometry, with its own colours baked in
// (attribute `color`) and a glow amount per part (attribute `aGlow`) for lights, eyes and screens.
// Units: a model is about 1 tall (or 1 long); the world scales each one into place.

import * as THREE from 'three';

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const S = new THREE.Vector3();
const P = new THREE.Vector3();

// one shape, moved into place, with a colour and a glow (0..1)
function part(geo, color, { at = [0, 0, 0], rot = [0, 0, 0], scale = [1, 1, 1], glow = 0 } = {}) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.applyMatrix4(M.compose(P.set(...at), Q.setFromEuler(E.set(...rot)), S.set(...scale)));
  const n = g.attributes.position.count;
  const c = new THREE.Color(color);
  const col = new Float32Array(n * 3), gl = new Float32Array(n).fill(glow);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
  return g;
}

export function merge(parts) {
  const names = ['position', 'normal', 'color', 'aGlow'];
  const total = parts.reduce((a, g) => a + g.attributes.position.count, 0);
  const out = new THREE.BufferGeometry();
  names.forEach((name) => {
    const size = parts[0].attributes[name].itemSize;
    const arr = new Float32Array(total * size);
    let o = 0;
    parts.forEach((g) => { arr.set(g.attributes[name].array, o); o += g.attributes[name].array.length; });
    out.setAttribute(name, new THREE.BufferAttribute(arr, size));
  });
  // extra per-vertex attributes some models use (bird wings)
  const extra = parts.find((g) => g.attributes.aWing);
  if (extra) {
    const arr = new Float32Array(total);
    let o = 0;
    parts.forEach((g) => { if (g.attributes.aWing) arr.set(g.attributes.aWing.array, o); o += g.attributes.position.count; });
    out.setAttribute('aWing', new THREE.BufferAttribute(arr, 1));
  }
  out.computeBoundingSphere();
  return out;
}

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const ball = (r, w = 12, h = 8) => new THREE.SphereGeometry(r, w, h);

/* ---------------------------------------------------------------- robots */

const WHITE = '#f2f4f8', GREY = '#8d93a0', DARK = '#23262e', VISOR = '#07090d', EYE = '#9ff4ff';

// The body: tracks, torso with a chest light, neck, round head with a visor and two glowing eyes, an antenna.
export function robotBody() {
  return merge([
    part(box(0.13, 0.18, 0.34), DARK, { at: [-0.16, 0.09, 0] }), // tracks
    part(box(0.13, 0.18, 0.34), DARK, { at: [0.16, 0.09, 0] }),
    part(cyl(0.05, 0.05, 0.14, 10), GREY, { at: [-0.16, 0.09, 0.17], rot: [0, 0, Math.PI / 2] }),
    part(cyl(0.05, 0.05, 0.14, 10), GREY, { at: [0.16, 0.09, 0.17], rot: [0, 0, Math.PI / 2] }),
    part(box(0.3, 0.06, 0.3), GREY, { at: [0, 0.2, 0] }), // hips
    part(box(0.46, 0.38, 0.34), WHITE, { at: [0, 0.42, 0] }), // torso
    part(box(0.48, 0.05, 0.36), GREY, { at: [0, 0.6, 0] }), // shoulder plate
    part(box(0.15, 0.06, 0.02), '#ffd27a', { at: [0, 0.47, 0.172], glow: 1 }), // chest light
    part(box(0.06, 0.03, 0.02), '#7affb0', { at: [-0.13, 0.36, 0.172], glow: 1 }),
    part(cyl(0.06, 0.07, 0.09), GREY, { at: [0, 0.665, 0] }), // neck
    part(ball(0.19, 16, 12), WHITE, { at: [0, 0.83, 0] }), // head
    part(box(0.3, 0.12, 0.08), VISOR, { at: [0, 0.85, 0.15] }), // visor
    part(box(0.07, 0.04, 0.02), EYE, { at: [-0.07, 0.855, 0.193], glow: 1 }), // eyes
    part(box(0.07, 0.04, 0.02), EYE, { at: [0.07, 0.855, 0.193], glow: 1 }),
    part(cyl(0.012, 0.012, 0.2, 6), GREY, { at: [0.09, 1.07, -0.02] }), // antenna
    part(ball(0.035, 8, 6), '#ff8a5c', { at: [0.09, 1.18, -0.02], glow: 1 }),
  ]);
}
// One arm, hanging from the shoulder at the origin.
export function robotArm() {
  return merge([
    part(ball(0.065, 10, 8), GREY),
    part(box(0.09, 0.3, 0.09), WHITE, { at: [0, -0.17, 0] }),
    part(ball(0.06, 10, 8), DARK, { at: [0, -0.35, 0] }),
  ]);
}
// Tools, held in the right hand (the hand is at y = -0.35 on the arm).
export function robotTool(kind) {
  const grip = [0, -0.36, 0];
  if (kind === 'pick') {
    return merge([
      part(cyl(0.018, 0.018, 0.42, 6), '#8a6a45', { at: [0, -0.36, 0.17], rot: [Math.PI / 2, 0, 0] }),
      part(box(0.04, 0.32, 0.05), '#c7ccd6', { at: [0, -0.36, 0.38], rot: [0.25, 0, 0] }),
    ]);
  }
  if (kind === 'hammer') {
    return merge([
      part(cyl(0.018, 0.018, 0.34, 6), '#8a6a45', { at: [0, -0.36, 0.14], rot: [Math.PI / 2, 0, 0] }),
      part(box(0.2, 0.1, 0.1), '#5c6270', { at: [0, -0.36, 0.31] }),
    ]);
  }
  if (kind === 'scanner') {
    return merge([
      part(cyl(0.03, 0.03, 0.16, 8), GREY, { at: [0, -0.4, 0.05], rot: [Math.PI / 2, 0, 0] }),
      part(cyl(0.09, 0.03, 0.06, 12), WHITE, { at: [0, -0.4, 0.15], rot: [Math.PI / 2, 0, 0] }),
      part(cyl(0.07, 0.07, 0.01, 12), '#7fe9ff', { at: [0, -0.4, 0.185], rot: [Math.PI / 2, 0, 0], glow: 1 }),
    ]);
  }
  if (kind === 'torch') {
    return merge([
      part(cyl(0.025, 0.02, 0.28, 8), GREY, { at: [0, -0.37, 0.12], rot: [Math.PI / 2, 0, 0] }),
      part(ball(0.03, 8, 6), '#ffd9a0', { at: [0, -0.37, 0.27], glow: 1 }),
    ]);
  }
  if (kind === 'can') { // a watering can for the gardeners
    return merge([
      part(cyl(0.07, 0.08, 0.14, 10), '#6fbf8a', { at: [0, -0.43, 0.06] }),
      part(cyl(0.012, 0.016, 0.2, 6), '#6fbf8a', { at: [0, -0.4, 0.18], rot: [1.0, 0, 0] }),
    ]);
  }
  return merge([part(box(0.02, 0.02, 0.02), GREY, { at: grip })]);
}
// A glowing block of data, carried overhead.
export function dataCube() {
  return merge([
    part(box(0.26, 0.26, 0.26), '#6fb8ff', { glow: 0.35 }),
    part(box(0.28, 0.03, 0.28), '#ffffff', { at: [0, 0.13, 0], glow: 0.4 }),
    part(box(0.28, 0.03, 0.28), '#ffffff', { at: [0, -0.13, 0], glow: 0.4 }),
  ]);
}

/* ---------------------------------------------------------------- drones */

export function drone() {
  const parts = [
    part(box(0.42, 0.1, 0.42), DARK),
    part(box(0.3, 0.06, 0.3), WHITE, { at: [0, 0.07, 0] }),
    part(box(0.08, 0.03, 0.02), '#ffffff', { at: [0, 0.02, 0.215], glow: 1 }), // headlight
    part(box(0.08, 0.03, 0.02), '#ff4040', { at: [0, 0.02, -0.215], glow: 1 }), // tail light
    part(box(0.14, 0.14, 0.14), '#7fe0ff', { at: [0, -0.16, 0], glow: 0.9 }), // the cargo: a data cube
    part(box(0.02, 0.1, 0.02), GREY, { at: [0, -0.07, 0] }),
  ];
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z]) => {
    parts.push(part(box(0.5, 0.035, 0.05), GREY, { at: [x * 0.17, 0.02, z * 0.17], rot: [0, x * z > 0 ? -Math.PI / 4 : Math.PI / 4, 0] }));
    parts.push(part(cyl(0.035, 0.035, 0.06, 8), DARK, { at: [x * 0.34, 0.05, z * 0.34] }));
    parts.push(part(cyl(0.17, 0.17, 0.008, 18), '#c9d3e6', { at: [x * 0.34, 0.085, z * 0.34] })); // rotor blur
  });
  return merge(parts);
}

/* ---------------------------------------------------------------- birds */

// Body and wings; aWing is 0 on the body and rises to 1 at the wing tips, so a shader can flap them.
export function bird() {
  const body = part(new THREE.OctahedronGeometry(0.5, 0), '#2a2d33', { scale: [0.16, 0.12, 0.9] });
  body.setAttribute('aWing', new THREE.BufferAttribute(new Float32Array(body.attributes.position.count), 1));
  const wing = (side) => {
    const g = new THREE.BufferGeometry();
    const v = [0.05 * side, 0, 0.18, 1.05 * side, 0.02, -0.1, 0.05 * side, 0, -0.22];
    const w = [0, 1, 0];
    if (side < 0) { [v[3], v[6]] = [v[6], v[3]]; [v[4], v[7]] = [v[7], v[4]]; [v[5], v[8]] = [v[8], v[5]]; [w[1], w[2]] = [w[2], w[1]]; }
    g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    g.computeVertexNormals();
    const p = part(g, '#e6e8ec');
    p.setAttribute('aWing', new THREE.Float32BufferAttribute(w, 1));
    return p;
  };
  return merge([body, wing(1), wing(-1)]);
}

/* ---------------------------------------------------------------- ships */

// A container ship, 1 long, bow toward +z: hull, stacked containers, bridge with lit windows, mast and nav lights.
export function ship(seed = 1) {
  let s = seed;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const hullShape = new THREE.Shape();
  hullShape.moveTo(-0.15, -0.5);
  hullShape.lineTo(0.15, -0.5);
  hullShape.lineTo(0.16, 0.22);
  hullShape.quadraticCurveTo(0.12, 0.42, 0, 0.5);
  hullShape.quadraticCurveTo(-0.12, 0.42, -0.16, 0.22);
  hullShape.closePath();
  const hull = new THREE.ExtrudeGeometry(hullShape, { depth: 0.12, bevelEnabled: false, curveSegments: 6 });
  hull.rotateX(-Math.PI / 2); // shape lies flat, extruded upward
  hull.translate(0, -0.05, 0);
  hull.computeVertexNormals();
  const parts = [
    part(hull, '#24324a'),
    part(box(0.3, 0.012, 0.98), '#b8432f', { at: [0, -0.05, -0.01], scale: [1, 1, 0.98] }), // waterline stripe
    part(box(0.28, 0.02, 0.9), '#5b6270', { at: [0, 0.075, -0.03] }), // deck
    part(box(0.26, 0.17, 0.12), '#f2f2ee', { at: [0, 0.17, -0.4] }), // bridge
    part(box(0.27, 0.03, 0.01), '#ffe2a8', { at: [0, 0.21, -0.338], glow: 1 }), // bridge windows
    part(cyl(0.01, 0.012, 0.14, 6), '#d0d0d0', { at: [0, 0.32, -0.42] }), // mast
    part(ball(0.018, 6, 4), '#ffffff', { at: [0, 0.4, -0.42], glow: 1 }), // masthead light
    part(ball(0.015, 6, 4), '#ff2a2a', { at: [-0.135, 0.22, -0.38], glow: 1 }), // port
    part(ball(0.015, 6, 4), '#2aff6a', { at: [0.135, 0.22, -0.38], glow: 1 }), // starboard
    part(cyl(0.03, 0.035, 0.1, 8), '#c23b2c', { at: [0, 0.3, -0.46] }), // funnel
  ];
  const cols = ['#c0392b', '#2e86c1', '#e1a33a', '#27ae60', '#8e44ad', '#d35400', '#ecf0f1', '#16a085'];
  for (let z = -0.28; z < 0.3; z += 0.075) {
    const stack = 1 + Math.floor(rnd() * 3);
    for (let y = 0; y < stack; y++) {
      for (let x = -1; x <= 1; x++) {
        parts.push(part(box(0.075, 0.05, 0.068), cols[Math.floor(rnd() * cols.length)], { at: [x * 0.08, 0.11 + y * 0.052, z] }));
      }
    }
  }
  return merge(parts);
}

/* ---------------------------------------------------------------- trees and plants */

const TRUNK = '#5a4130';
export function tree(kind) {
  switch (kind) {
    case 'pine': return merge([
      part(cyl(0.04, 0.06, 0.3, 6), TRUNK, { at: [0, 0.15, 0] }),
      part(new THREE.ConeGeometry(0.34, 0.5, 8), '#e8eee8', { at: [0, 0.48, 0] }),
      part(new THREE.ConeGeometry(0.27, 0.44, 8), '#f2f6f2', { at: [0, 0.72, 0] }),
      part(new THREE.ConeGeometry(0.18, 0.36, 8), '#ffffff', { at: [0, 0.94, 0] }),
    ]);
    case 'round': return merge([
      part(cyl(0.045, 0.07, 0.42, 6), TRUNK, { at: [0, 0.21, 0] }),
      part(new THREE.IcosahedronGeometry(0.34, 0), '#f0f0f0', { at: [0, 0.62, 0] }),
      part(new THREE.IcosahedronGeometry(0.22, 0), '#ffffff', { at: [0.16, 0.78, 0.05] }),
    ]);
    case 'tall': return merge([
      part(cyl(0.035, 0.05, 0.55, 6), TRUNK, { at: [0, 0.27, 0] }),
      part(new THREE.IcosahedronGeometry(0.22, 0), '#f4f4f4', { at: [0, 0.82, 0], scale: [1, 1.9, 1] }),
    ]);
    case 'cactus': return merge([
      part(cyl(0.07, 0.08, 0.7, 6), '#ffffff', { at: [0, 0.35, 0] }),
      part(ball(0.07, 8, 6), '#ffffff', { at: [0, 0.7, 0] }),
      part(cyl(0.05, 0.05, 0.2, 8), '#ffffff', { at: [0.13, 0.38, 0], rot: [0, 0, Math.PI / 2] }),
      part(cyl(0.05, 0.05, 0.25, 8), '#ffffff', { at: [0.22, 0.5, 0] }),
      part(cyl(0.045, 0.045, 0.16, 8), '#ffffff', { at: [-0.11, 0.3, 0], rot: [0, 0, Math.PI / 2] }),
      part(cyl(0.045, 0.045, 0.18, 8), '#ffffff', { at: [-0.18, 0.4, 0] }),
    ]);
    case 'shrub': return merge([
      part(new THREE.IcosahedronGeometry(0.28, 0), '#ffffff', { at: [0, 0.2, 0], scale: [1.3, 0.8, 1.1] }),
      part(new THREE.IcosahedronGeometry(0.2, 0), '#f0f0f0', { at: [0.22, 0.16, 0.08] }),
    ]);
    default: return merge([part(new THREE.DodecahedronGeometry(0.3, 0), '#ffffff', { at: [0, 0.15, 0], scale: [1.2, 0.7, 1] })]); // a boulder
  }
}

/* ---------------------------------------------------------------- satellites */

// A satellite: gold-foil bus, two long solar wings, a dish and a blinking light. Returns a Group.
export function satellite() {
  const g = new THREE.Group();
  const mk = (geo, color, glow = 0, metal = 0.6, rough = 0.35) => new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color, metalness: metal, roughness: rough, emissive: glow ? color : 0x000000, emissiveIntensity: glow,
  }));
  const bus = mk(box(0.32, 0.32, 0.45), '#c9a14a', 0, 0.85, 0.3);
  g.add(bus);
  const panelGeo = box(1.05, 0.01, 0.3);
  const panelMat = new THREE.MeshStandardMaterial({ color: '#1d2f6b', metalness: 0.5, roughness: 0.25, emissive: '#0b1a44', emissiveIntensity: 0.4 });
  [-1, 1].forEach((side) => {
    const arm = mk(cyl(0.012, 0.012, 0.22, 6), '#c0c4cc');
    arm.rotation.z = Math.PI / 2;
    arm.position.x = side * 0.27;
    g.add(arm);
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.position.x = side * 0.9;
    g.add(panel);
    for (let i = -2; i <= 2; i++) { // cell lines
      const line = mk(box(0.008, 0.012, 0.3), '#9fb3e8');
      line.position.set(side * 0.9 + i * 0.2, 0.001, 0);
      g.add(line);
    }
  });
  const dish = mk(new THREE.SphereGeometry(0.16, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), '#e9ecf2', 0, 0.2, 0.5);
  dish.material.side = THREE.DoubleSide;
  dish.rotation.x = -Math.PI / 2;
  dish.position.z = 0.32;
  g.add(dish);
  const feed = mk(cyl(0.008, 0.008, 0.16, 6), '#c0c4cc');
  feed.rotation.x = Math.PI / 2;
  feed.position.z = 0.36;
  g.add(feed);
  const blink = mk(ball(0.03, 8, 6), '#ff3b3b', 2);
  blink.position.set(0, 0.2, -0.15);
  g.add(blink);
  g.userData.blink = blink;
  return g;
}

/* ---------------------------------------------------------------- material */

// Standard lit material that also makes the parts marked with aGlow shine. Optional bird flapping.
export function modelMaterial({ flap = false, timeUniform } = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, metalness: 0.2 });
  mat.onBeforeCompile = (sh) => {
    if (timeUniform) sh.uniforms.uTime = timeUniform;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aGlow; varying float vGlow;
        ${flap ? 'attribute float aWing; uniform float uTime;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vGlow = aGlow;
        ${flap ? `
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 917.0 + instanceMatrix[3].z * 613.0;
        #else
          float ph = 0.0;
        #endif
        transformed.y += aWing * sin(uTime * 11.0 + ph) * 0.42;` : ''}`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vColor.rgb * vGlow * 2.4;');
  };
  return mat;
}
