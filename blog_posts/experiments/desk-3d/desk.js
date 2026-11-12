// My desk in 3D: a hand-built Three.js model of the corner where I write this site.
// Every object with a hotspot opens a card that links into the site.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const loadingEl = document.getElementById('loading');

function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}
if (!webglOK()) {
  loadingEl.classList.add('fail');
  loadingEl.innerHTML = '<span>Your browser can’t draw WebGL, so the 3D room can’t load. ' +
    'Open “Things in the room” (bottom left) for the same links as a list.</span>';
  document.getElementById('index-details').open = true;
  throw new Error('WebGL unavailable');
}

// ---------------------------------------------------------------- site data
let POSTS = [];
try { POSTS = JSON.parse(document.getElementById('site-posts').textContent); } catch (e) { POSTS = []; }

const KIND_COLORS = { search: '#7dd3fc', algorithms: '#a5f3a1', math: '#fbbf24', notes: '#c4b5fd', experiments: '#f9a8d4' };

// ---------------------------------------------------------------- renderer / scene
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
stage.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.05, 60);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minPolarAngle = 0.05;
controls.maxPolarAngle = 1.48;
controls.minDistance = 0.35;
controls.maxDistance = 12;
controls.screenSpacePanning = true;
controls.zoomToCursor = true;

// ---------------------------------------------------------------- helpers
const MAX_ANISO = renderer.capabilities.getMaxAnisotropy();
function canvasTex(w, h, draw, { srgb = true, repeat } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, MAX_ANISO);
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.userData = { canvas: c, ctx: g, draw };
  return t;
}
function redraw(t) { const { canvas, ctx, draw } = t.userData; draw(ctx, canvas.width, canvas.height); t.needsUpdate = true; }

function rng(seed) { // mulberry32: fixed seeds keep the room identical on every visit
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const std = (color, rough = 0.6, metal = 0, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });

const M = {
  wall: std('#dbe6e3', 0.92),
  white: std('#f3f3f0', 0.45),
  whiteMatte: std('#ecece8', 0.7),
  black: std('#1c1e21', 0.55),
  blackSoft: std('#26282c', 0.85),
  fabric: std('#1a1b1d', 0.95),
  silver: std('#c7cacd', 0.32, 0.75),
  darkMetal: std('#3a3d42', 0.4, 0.6),
  wood: std('#a26a3c', 0.65),
  woodLight: std('#c99a62', 0.7),
  door: std('#8b5a2b', 0.5),
  frame: std('#121314', 0.5),
};

// Box from extents: [x0,x1],[y0,y1],[z0,z1]
function boxX(parent, xs, ys, zs, mat, rounded = 0) {
  const w = xs[1] - xs[0], h = ys[1] - ys[0], d = zs[1] - zs[0];
  const geo = rounded > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(rounded, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set((xs[0] + xs[1]) / 2, (ys[0] + ys[1]) / 2, (zs[0] + zs[1]) / 2);
  parent.add(m);
  return m;
}
// Box from center + size
function box(parent, [w, h, d], [x, y, z], mat, rounded = 0) {
  const geo = rounded > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(rounded, w / 2, h / 2, d / 2))
    : new THREE.BoxGeometry(w, h, d);
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function cyl(parent, rTop, rBot, h, [x, y, z], mat, seg = 24, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, open), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function sphere(parent, r, [x, y, z], mat, seg = 16) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.75)), mat);
  m.position.set(x, y, z);
  parent.add(m);
  return m;
}
function plane(parent, [w, h], [x, y, z], mat, rotY = 0) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  parent.add(m);
  return m;
}
// A plane bent like a curved monitor (edges come toward the viewer)
function curvedPlane(w, h, R) {
  const g = new THREE.PlaneGeometry(w, h, 40, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setZ(i, (x * x) / (2 * R)); }
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- hotspots
const hotspots = {};   // id -> { group, data }
function hotspot(group, data) {
  hotspots[data.id] = { group, data };
  group.traverse(o => {
    o.userData.hs = data.id;
    if (o.isMesh && o.material && o.material.isMeshStandardMaterial) {
      o.material = o.material.clone();   // so hover glow doesn't leak to shared materials
      o.userData.baseEmissive = o.material.emissive.clone();
      o.userData.baseEmissiveIntensity = o.material.emissiveIntensity;
    }
  });
  return group;
}
const room = new THREE.Group();
scene.add(room);

// ---------------------------------------------------------------- dimensions (metres)
const W0 = -1.7, W1 = 1.7;      // left / right wall x
const BACK = -1.5;              // back wall z
const FRONT = 1.5;              // front wall z (the door wall)
const H = 2.75;                 // wall height
const DESK_Y = 0.75;            // desk top surface

// ---------------------------------------------------------------- floor
const floorTex = canvasTex(1024, 1024, (g, w, h) => {
  g.fillStyle = '#efeeea'; g.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < 2600; i++) { // faint marble speckle
    g.fillStyle = `rgba(160,155,148,${0.03 + r() * 0.05})`;
    g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
  g.strokeStyle = 'rgba(150,146,140,0.55)'; g.lineWidth = 3;
  for (let i = 0; i <= 2; i++) {
    g.beginPath(); g.moveTo(i * w / 2, 0); g.lineTo(i * w / 2, h); g.stroke();
    g.beginPath(); g.moveTo(0, i * h / 2); g.lineTo(w, i * h / 2); g.stroke();
  }
}, { repeat: [(W1 - W0) / 1.2, (FRONT - BACK) / 1.2] });
const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.18, metalness: 0.0, envMapIntensity: 1.2 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(W1 - W0, FRONT - BACK), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, 0, (BACK + FRONT) / 2);
room.add(floor);
// diorama base slab
boxX(room, [W0 - 0.1, W1 + 0.1], [-0.12, -0.001], [BACK - 0.1, FRONT], std('#20262c', 0.8));

// ---------------------------------------------------------------- walls (inner faces only, so the camera sees through from outside)
// Things hung on a wall live in that wall's group; the group hides while the camera is outside that wall,
// which turns the room into a dollhouse you can orbit all the way round.
const WB = new THREE.Group(), WL = new THREE.Group(), WR = new THREE.Group(), WF = new THREE.Group();
room.add(WB, WL, WR, WF);
const wallMat = M.wall;
plane(room, [W1 - W0, H], [0, H / 2, BACK], wallMat);
// left wall with a window opening
const WIN = { z0: -0.5, z1: 0.55, y0: 0.95, y1: 2.15 };
const lw = (z0, z1, y0, y1) => plane(room, [z1 - z0, y1 - y0], [W0, (y0 + y1) / 2, (z0 + z1) / 2], wallMat, Math.PI / 2);
lw(BACK, WIN.z0, 0, H); lw(WIN.z1, FRONT, 0, H); lw(WIN.z0, WIN.z1, 0, WIN.y0); lw(WIN.z0, WIN.z1, WIN.y1, H);
plane(room, [FRONT - BACK, H], [W1, H / 2, (BACK + FRONT) / 2], wallMat, -Math.PI / 2);
// front wall with the door opening
const DOOR = { x0: 0.6, x1: 1.46, y1: 2.1 };
const fw = (x0, x1, y0, y1) => plane(room, [x1 - x0, y1 - y0], [(x0 + x1) / 2, (y0 + y1) / 2, FRONT], wallMat, Math.PI);
fw(W0, DOOR.x0, 0, H); fw(DOOR.x1, W1, 0, H); fw(DOOR.x0, DOOR.x1, DOOR.y1, H);
// skirting and top trim give the cut-away its edges
const trim = std('#f6f6f3', 0.5);
boxX(room, [W0, W1], [0, 0.07], [BACK, BACK + 0.012], trim);
boxX(room, [W0, W0 + 0.012], [0, 0.07], [BACK, FRONT], trim);
boxX(room, [W1 - 0.012, W1], [0, 0.07], [BACK, FRONT], trim);
boxX(WF, [W0, DOOR.x0], [0, 0.07], [FRONT - 0.012, FRONT], trim);
boxX(WF, [DOOR.x1, W1], [0, 0.07], [FRONT - 0.012, FRONT], trim);
const capMat = std('#c9d3d0', 0.9);
boxX(WB, [W0 - 0.06, W1 + 0.06], [H, H + 0.05], [BACK - 0.06, BACK], capMat);
boxX(WF, [W0 - 0.06, W1 + 0.06], [H, H + 0.05], [FRONT, FRONT + 0.06], capMat);
boxX(WL, [W0 - 0.06, W0], [H, H + 0.05], [BACK, FRONT], capMat);
boxX(WR, [W1, W1 + 0.06], [H, H + 0.05], [BACK, FRONT], capMat);

// window: frame + glass that shows the sky colour
const glassMat = new THREE.MeshBasicMaterial({ color: '#bfe3ff', toneMapped: false });
const glass = plane(WL, [WIN.z1 - WIN.z0, WIN.y1 - WIN.y0], [W0 - 0.05, (WIN.y0 + WIN.y1) / 2, (WIN.z0 + WIN.z1) / 2], glassMat, Math.PI / 2);
glass.castShadow = false;
const wf = M.white;
boxX(WL, [W0 - 0.06, W0 + 0.02], [WIN.y0 - 0.04, WIN.y0], [WIN.z0 - 0.04, WIN.z1 + 0.04], wf);
boxX(WL, [W0 - 0.06, W0 + 0.02], [WIN.y1, WIN.y1 + 0.04], [WIN.z0 - 0.04, WIN.z1 + 0.04], wf);
boxX(WL, [W0 - 0.06, W0 + 0.02], [WIN.y0, WIN.y1], [WIN.z0 - 0.04, WIN.z0], wf);
boxX(WL, [W0 - 0.06, W0 + 0.02], [WIN.y0, WIN.y1], [WIN.z1, WIN.z1 + 0.04], wf);
boxX(WL, [W0 - 0.06, W0 - 0.02], [WIN.y0, WIN.y1], [(WIN.z0 + WIN.z1) / 2 - 0.015, (WIN.z0 + WIN.z1) / 2 + 0.015], wf);
boxX(WL, [W0, W0 + 0.09], [WIN.y0 - 0.05, WIN.y0 - 0.02], [WIN.z0 - 0.06, WIN.z1 + 0.06], wf); // sill
// curtain rod from the front wall across the window, with a wooden wall disc
{ const z0 = WIN.z0 - 0.15, z1 = FRONT - 0.01, y = WIN.y1 + 0.16;
  cyl(WL, 0.011, 0.011, z1 - z0, [W0 + 0.12, y, (z0 + z1) / 2], M.silver, 12).rotation.x = Math.PI / 2;
  for (const z of [z0 + 0.02, z1 - 0.12]) { box(WL, [0.12, 0.015, 0.015], [W0 + 0.06, y, z], M.silver); cyl(WL, 0.035, 0.035, 0.015, [W0 + 0.008, y, z], M.woodLight, 20).rotation.z = Math.PI / 2; }
  sphere(WL, 0.018, [W0 + 0.12, y, z0], M.silver, 10); }

// ---------------------------------------------------------------- main desk (along the back wall)
const DX0 = -1.36, DX1 = 0.64, DZ0 = BACK, DZ1 = -0.86;
boxX(room, [DX0, DX1], [DESK_Y - 0.03, DESK_Y], [DZ0, DZ1], M.white, 0.006);
// drawer unit on the left, five drawers
const AX0 = -1.34, AX1 = -0.92;
boxX(room, [AX0, AX1], [0.02, DESK_Y - 0.03], [DZ0 + 0.02, DZ1 - 0.01], M.whiteMatte);
for (let i = 0; i < 5; i++) {
  const y0 = 0.05 + i * 0.134, y1 = y0 + 0.125;
  boxX(room, [AX0 + 0.008, AX1 - 0.008], [y0, y1], [DZ1 - 0.012, DZ1 + 0.004], M.white, 0.004);
  boxX(room, [AX0 + 0.13, AX1 - 0.13], [y1 - 0.03, y1 - 0.012], [DZ1 + 0.0, DZ1 + 0.006], std('#9a9a96', 0.6));
}
// legs on the right
for (const [x, z] of [[0.58, -0.92], [0.58, -1.44]]) cyl(room, 0.02, 0.02, DESK_Y - 0.03, [x, (DESK_Y - 0.03) / 2, z], M.white);
// bin under the desk
const bin = cyl(room, 0.12, 0.1, 0.3, [-0.72, 0.15, -1.25], new THREE.MeshStandardMaterial({ color: '#16181a', roughness: 0.7, wireframe: false, transparent: true, opacity: 0.85 }), 24, true);
bin.material.side = THREE.DoubleSide;

// ---------------------------------------------------------------- return desk (right corner)
const RX0 = 0.64, RX1 = 1.66, RZ0 = BACK, RZ1 = -0.66;
boxX(room, [RX0, RX1], [DESK_Y - 0.03, DESK_Y], [RZ0, RZ1], M.white, 0.006);
for (const [x, z] of [[0.7, -0.72], [1.6, -0.72], [1.6, -1.44]]) cyl(room, 0.02, 0.02, DESK_Y - 0.03, [x, (DESK_Y - 0.03) / 2, z], M.white);
// colourful plastic drawers under the return
const drawerCols = ['#f5d142', '#9ad65a', '#ef6b6b', '#4f8fe0'];
for (let i = 0; i < 4; i++) {
  const y1 = 0.66 - i * 0.155, y0 = y1 - 0.145;
  boxX(room, [0.76, 1.18], [y0, y1], [-1.2, -0.76], std(drawerCols[i], 0.35, 0, { transparent: true, opacity: 0.9 }), 0.01);
}
boxX(room, [0.74, 1.2], [0.02, 0.68], [-1.22, -1.2], M.white);
// grass desk mat
const grassTex = canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#3f8a3a'; g.fillRect(0, 0, w, h);
  const r = rng(11);
  for (let i = 0; i < 9000; i++) {
    const v = r();
    g.strokeStyle = v < 0.5 ? '#5fae4c' : v < 0.85 ? '#2f6e2c' : '#7cc565';
    const x = r() * w, y = r() * h;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 6, y - 4 - r() * 6); g.lineWidth = 1.2; g.stroke();
  }
});
boxX(room, [0.67, 1.62], [DESK_Y, DESK_Y + 0.012], [-1.32, -0.69], new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));

// ---------------------------------------------------------------- screen textures
const SCREEN_BG = '#0d1117';
function monoFont(px, weight = 400) { return `${weight} ${px}px "JetBrains Mono", ui-monospace, monospace`; }
function headFont(px, weight = 600) { return `${weight} ${px}px "Space Grotesk", Inter, system-ui, sans-serif`; }

const texMonL = canvasTex(1024, 600, (g, w, h) => {
  g.fillStyle = SCREEN_BG; g.fillRect(0, 0, w, h);
  g.fillStyle = '#161b22'; g.fillRect(0, 0, w, 44);
  ['#ff5f56', '#ffbd2e', '#27c93f'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(26 + i * 24, 22, 7, 0, 7); g.fill(); });
  g.fillStyle = '#8b949e'; g.font = monoFont(18); g.fillText('~/blog_posts — jaskamalkainth.github.io', 112, 28);
  g.fillStyle = '#11161d'; g.fillRect(0, 44, 64, h - 44);
  g.fillStyle = '#e6edf3'; g.font = headFont(38); g.fillText('Latest writing', 96, 104);
  g.fillStyle = '#8b949e'; g.font = monoFont(17); g.fillText('$ ls -t blog_posts/ | head', 96, 138);
  const list = POSTS.length ? POSTS : [{ title: 'Posts', kind: 'notes' }];
  list.slice(0, 6).forEach((p, i) => {
    const y = 192 + i * 62;
    g.fillStyle = '#1f6feb22'; if (i === 0) g.fillRect(84, y - 36, w - 120, 52);
    g.fillStyle = '#6e7681'; g.font = monoFont(16); g.fillText(String(i + 1).padStart(2, '0'), 30, y);
    const col = KIND_COLORS[p.kind] || '#8b949e';
    g.fillStyle = col; g.font = monoFont(16, 500); g.fillText((p.kind || '').padEnd(10), 96, y);
    g.fillStyle = '#e6edf3'; g.font = headFont(26, 500);
    let t = p.title; while (g.measureText(t).width > w - 360 && t.length > 4) t = t.slice(0, -2);
    if (t !== p.title) t = t.trimEnd() + '…';
    g.fillText(t, 230, y);
  });
});

// HNSW greedy search, computed for real on a fixed random graph
const hnsw = (() => {
  const r = rng(42), N = 64, pts = [];
  for (let i = 0; i < N; i++) pts.push([70 + r() * 884, 110 + r() * 440]);
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const adj = pts.map(() => new Set());
  pts.forEach((p, i) => {
    const near = pts.map((q, j) => [d2(p, q), j]).filter(x => x[1] !== i).sort((a, b) => a[0] - b[0]).slice(0, 4);
    near.forEach(([, j]) => { adj[i].add(j); adj[j].add(i); });
  });
  const qr = rng(99);
  let state = null;
  function newQuery() {
    const q = [90 + qr() * 844, 130 + qr() * 400];
    let cur = 0, evals = 0; const path = [0];
    for (;;) {
      let best = cur, bd = d2(pts[cur], q);
      for (const j of adj[cur]) { evals++; const dj = d2(pts[j], q); if (dj < bd) { bd = dj; best = j; } }
      if (best === cur) break;
      cur = best; path.push(cur);
    }
    state = { q, path, evals, step: 0, hold: 0 };
  }
  newQuery();
  return { pts, adj, get state() { return state; }, newQuery };
})();
const texMonR = canvasTex(1024, 600, (g, w, h) => {
  const s = hnsw.state;
  g.fillStyle = SCREEN_BG; g.fillRect(0, 0, w, h);
  g.fillStyle = '#161b22'; g.fillRect(0, 0, w, 44);
  g.fillStyle = '#8b949e'; g.font = monoFont(18); g.fillText('hnsw-simul — greedy search on layer 0', 24, 28);
  g.lineWidth = 1.5; g.strokeStyle = 'rgba(125,211,252,0.16)';
  hnsw.adj.forEach((nb, i) => nb.forEach(j => { if (j > i) { g.beginPath(); g.moveTo(...hnsw.pts[i]); g.lineTo(...hnsw.pts[j]); g.stroke(); } }));
  const shown = s.path.slice(0, s.step + 1);
  g.strokeStyle = '#fbbf24'; g.lineWidth = 4; g.beginPath();
  shown.forEach((k, i) => (i ? g.lineTo(...hnsw.pts[k]) : g.moveTo(...hnsw.pts[k]))); g.stroke();
  hnsw.pts.forEach((p, i) => {
    const on = shown.includes(i);
    g.fillStyle = on ? '#fbbf24' : '#7dd3fc'; g.globalAlpha = on ? 1 : 0.7;
    g.beginPath(); g.arc(p[0], p[1], on ? 8 : 5, 0, 7); g.fill();
  });
  g.globalAlpha = 1;
  const last = hnsw.pts[shown[shown.length - 1]];
  g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath(); g.arc(last[0], last[1], 14, 0, 7); g.stroke();
  // query
  g.fillStyle = '#f472b6'; g.save(); g.translate(...s.q); g.rotate(Math.PI / 4); g.fillRect(-9, -9, 18, 18); g.restore();
  g.fillStyle = '#e6edf3'; g.font = monoFont(18);
  const done = s.step >= s.path.length - 1;
  g.fillText(`hops ${s.step}/${s.path.length - 1}   distance evals ${s.evals}   ${done ? '✓ nearest found' : 'searching…'}`, 24, h - 22);
  g.fillStyle = '#f472b6'; g.fillText('◆ query', w - 140, h - 22);
});

const EXPERIMENTS = ['hnsw-simul/', 'monte-carlo/', 'bloom-filter/', 'fourier-epicycles/', 'multi-agent-patterns/', 'textgrain-watermark/', 'weight-space/', 'ekman-emotions/', 'Pixelate/', 'desk-3d/   ← you are here'];
let cursorOn = true;
const texMonS = canvasTex(900, 540, (g, w, h) => {
  g.fillStyle = '#0a0d0a'; g.fillRect(0, 0, w, h);
  g.font = monoFont(26); g.fillStyle = '#6ee787';
  g.fillText('jaskamal@desk:~$ ls experiments/', 30, 56);
  EXPERIMENTS.forEach((e, i) => { g.fillStyle = e.includes('here') ? '#fbbf24' : '#79c0ff'; g.fillText(e, 30, 100 + i * 38); });
  g.fillStyle = '#6ee787'; g.fillText('jaskamal@desk:~$ ', 30, 100 + EXPERIMENTS.length * 38 + 10);
  if (cursorOn) g.fillRect(30 + g.measureText('jaskamal@desk:~$ ').width, 100 + EXPERIMENTS.length * 38 - 12, 14, 26);
});

let viewHour = 12;
function fmtTime(hf) {
  const hh = Math.floor(hf) % 24, mm = Math.floor((hf - Math.floor(hf)) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
const texLaptop = canvasTex(800, 500, (g, w, h) => {
  // a coastal landscape like my lock screen
  const sky = g.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#6aa6d8'); sky.addColorStop(1, '#cfe3ef');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4d7f5b'; g.beginPath(); g.moveTo(0, h * 0.48);
  for (let x = 0; x <= w; x += 20) g.lineTo(x, h * 0.46 + Math.sin(x * 0.03) * 6); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  const sea = g.createLinearGradient(0, h * 0.5, 0, h);
  sea.addColorStop(0, '#5fb0c9'); sea.addColorStop(1, '#2d7d94');
  g.fillStyle = sea; g.fillRect(0, h * 0.52, w, h);
  g.fillStyle = '#b5704a'; g.beginPath(); g.moveTo(0, h * 0.7); g.bezierCurveTo(w * 0.25, h * 0.55, w * 0.45, h * 0.78, w * 0.7, h * 0.68);
  g.lineTo(w, h * 0.8); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillStyle = '#8f4f33'; g.beginPath(); g.ellipse(w * 0.4, h * 0.86, w * 0.22, h * 0.06, 0, 0, 7); g.fill();
  g.fillStyle = '#ffffff'; g.font = headFont(92, 500); g.textAlign = 'center';
  g.shadowColor = 'rgba(0,0,0,0.35)'; g.shadowBlur = 12;
  g.fillText(fmtTime(viewHour), w / 2, h * 0.3);
  g.font = headFont(24, 500);
  g.fillText(new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), w / 2, h * 0.3 + 40);
  g.shadowBlur = 0; g.textAlign = 'left';
});

// ---------------------------------------------------------------- monitors
function monitor(parent, { w, h, curve, tex, x, y, z, rotY, stand = 'base' }) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = rotY;
  const screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const geoS = curve ? curvedPlane(w, h, curve) : new THREE.PlaneGeometry(w, h);
  const screen = new THREE.Mesh(geoS, screenMat);
  screen.position.z = 0.002;
  g.add(screen);
  const bez = new THREE.Mesh(curve ? curvedPlane(w + 0.018, h + 0.03, curve) : new THREE.PlaneGeometry(w + 0.018, h + 0.03), std('#0b0c0e', 0.4, 0, { side: THREE.DoubleSide }));
  bez.position.set(0, -0.004, 0);
  g.add(bez);
  const back = new THREE.Mesh(curve ? curvedPlane(w + 0.01, h + 0.02, curve) : new THREE.PlaneGeometry(w + 0.01, h + 0.02), std('#cfd2d4', 0.45, 0.2, { side: THREE.DoubleSide }));
  back.position.set(0, -0.004, -0.022);
  g.add(back);
  box(g, [w * 0.35, h * 0.4, 0.04], [0, -0.02, -0.04], std('#cfd2d4', 0.45, 0.2), 0.012);
  if (stand === 'base') {
    box(g, [0.05, 0.2, 0.025], [0, -h / 2 - 0.04, -0.07], M.silver, 0.008);
    const b = box(g, [0.24, 0.012, 0.17], [0, -y + DESK_Y + 0.006, -0.06], M.silver, 0.005);
    b.position.y = DESK_Y - y + 0.006;
  } else if (stand === 'arm') {
    cyl(g, 0.016, 0.016, y - DESK_Y + 0.02, [0, (DESK_Y - y) / 2, -0.12], M.black);
    box(g, [0.04, 0.03, 0.12], [0, 0, -0.08], M.black, 0.01);
  } else if (stand === 'flat') {
    box(g, [0.05, 0.16, 0.03], [0, -h / 2 - 0.05, -0.05], M.black, 0.008);
    box(g, [0.22, 0.012, 0.15], [0, DESK_Y - y + 0.006, -0.04], M.black, 0.005);
  }
  parent.add(g);
  return g;
}
const MON_Y = 1.15, MON_Z = -1.3;
const monL = monitor(room, { w: 0.6, h: 0.35, curve: 1.0, tex: texMonL, x: -0.69, y: MON_Y, z: MON_Z, rotY: 0.13, stand: 'base' });
const monR = monitor(room, { w: 0.6, h: 0.35, curve: 1.0, tex: texMonR, x: -0.04, y: MON_Y, z: MON_Z, rotY: -0.13, stand: 'arm' });
const monS = monitor(room, { w: 0.52, h: 0.31, curve: 0, tex: texMonS, x: 1.5, y: 1.0, z: -1.02, rotY: -Math.PI / 2 + 0.12, stand: 'flat' });
// monitor glow at night
const screenGlow = new THREE.PointLight('#8fb8ff', 0, 2.2, 2);
screenGlow.position.set(-0.36, 1.1, -1.0);
room.add(screenGlow);

// speakers, CD and tiny clock between monitors
for (const x of [-0.5, -0.22]) {
  box(room, [0.07, 0.14, 0.08], [x, DESK_Y + 0.07, -1.4], M.black, 0.008);
  cyl(room, 0.02, 0.02, 0.003, [x, DESK_Y + 0.08, -1.359], M.darkMetal).rotation.x = Math.PI / 2;
}
box(room, [0.1, 0.05, 0.04], [-0.36, DESK_Y + 0.025, -1.42], M.black, 0.005);
cyl(room, 0.05, 0.05, 0.003, [-0.36, DESK_Y + 0.002, -1.32], std('#8fa4d9', 0.2, 0.8));

// ---------------------------------------------------------------- left desk clutter
// riser with plant, pen pot and dice
const riser = new THREE.Group(); room.add(riser);
boxX(riser, [-1.35, -1.0], [DESK_Y, DESK_Y + 0.2], [-1.5, -1.3], M.white);
const potMat = std('#111214', 0.3);
cyl(riser, 0.055, 0.045, 0.13, [-1.28, DESK_Y + 0.265, -1.41], potMat);
const leafMat = std('#2f7a3a', 0.45);
const stemMat = std('#3d6b2c', 0.6);
const plant = new THREE.Group(); plant.position.set(-1.28, DESK_Y + 0.33, -1.41); riser.add(plant);
{ const r = rng(5);
  for (let s = 0; s < 6; s++) {
    const len = 0.25 + r() * 0.3, ang = r() * Math.PI * 2, tilt = 0.08 + r() * 0.25;
    const stem = new THREE.Group(); stem.rotation.set(Math.sin(ang) * tilt, 0, Math.cos(ang) * tilt); plant.add(stem);
    cyl(stem, 0.004, 0.006, len, [0, len / 2, 0], stemMat, 6);
    for (let k = 0; k < 7; k++) {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 6), leafMat);
      leaf.scale.set(1, 0.18, 0.5);
      const side = k % 2 ? 1 : -1;
      leaf.position.set(side * 0.022, len * (0.3 + k * 0.1), 0);
      leaf.rotation.z = side * 0.5;
      stem.add(leaf);
    }
  }
}
const penPot = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.11, 6), std('#9a9da1', 0.7));
penPot.position.set(-1.15, DESK_Y + 0.255, -1.42); riser.add(penPot);
['#e8463c', '#2f5fd0', '#111', '#f2c640', '#7a3fb8', '#e78ac3'].forEach((c, i) => {
  const p = cyl(riser, 0.005, 0.005, 0.15, [-1.15 + Math.cos(i) * 0.02, DESK_Y + 0.3, -1.42 + Math.sin(i) * 0.02], std(c, 0.4), 6);
  p.rotation.set(Math.sin(i * 2) * 0.2, 0, Math.cos(i * 2) * 0.2);
});

// dice (Monte Carlo)
function diceFace(n) {
  return canvasTex(128, 128, (g, w) => {
    g.fillStyle = '#f2e6cf'; g.fillRect(0, 0, w, w);
    const P = { 1: [[.5, .5]], 2: [[.27, .27], [.73, .73]], 3: [[.25, .25], [.5, .5], [.75, .75]], 4: [[.27, .27], [.73, .27], [.27, .73], [.73, .73]],
      5: [[.25, .25], [.75, .25], [.5, .5], [.25, .75], [.75, .75]], 6: [[.27, .22], [.73, .22], [.27, .5], [.73, .5], [.27, .78], [.73, .78]] }[n];
    g.fillStyle = n === 1 ? '#c0392b' : '#1a1a1a';
    P.forEach(([x, y]) => { g.beginPath(); g.arc(x * w, y * w, n === 1 ? 14 : 10, 0, 7); g.fill(); });
  });
}
const dice = new THREE.Group(); dice.position.set(-1.05, DESK_Y + 0.22, -1.38); room.add(dice);
const diceMesh = new THREE.Mesh(new RoundedBoxGeometry(0.035, 0.035, 0.035, 3, 0.005),
  [3, 4, 1, 6, 2, 5].map(n => new THREE.MeshStandardMaterial({ map: diceFace(n), roughness: 0.4 })));
diceMesh.rotation.y = 0.5;
dice.add(diceMesh);

// desk calendar (shows the visitor's month)
const now0 = new Date();
const texCal = canvasTex(400, 330, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  const r = rng(now0.getMonth() + 3);
  for (let i = 0; i < 80; i++) { g.fillStyle = `hsl(${30 + r() * 30},${20 + r() * 30}%,${40 + r() * 40}%)`; g.fillRect(30 + r() * 300, 40 + r() * 180, 40, 30); }
  g.fillStyle = '#222'; g.font = headFont(30, 600);
  g.fillText(now0.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase(), 30, 270);
  g.font = headFont(60, 700); g.textAlign = 'right'; g.fillText(String(now0.getDate()), w - 30, 290);
  g.fillStyle = '#555'; for (let i = 0; i < 24; i++) g.fillRect(16 + i * 16, 8, 6, 16);
});
const cal = new THREE.Group(); cal.position.set(-1.16, DESK_Y, -1.24); room.add(cal);
const calA = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.2), new THREE.MeshStandardMaterial({ map: texCal, roughness: 0.6 }));
calA.position.set(0, 0.09, 0.03); calA.rotation.x = -0.28; cal.add(calA);
const calB = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.2), std('#2a2a2a', 0.8));
calB.position.set(0, 0.09, -0.03); calB.rotation.x = 0.28; calB.rotation.y = Math.PI; cal.add(calB);

// wooden log tray with keys and bangles
cyl(room, 0.12, 0.12, 0.03, [-0.9, DESK_Y + 0.015, -1.2], M.woodLight, 32);
cyl(room, 0.105, 0.105, 0.002, [-0.9, DESK_Y + 0.031, -1.2], std('#d9b483', 0.8), 32);
for (let i = 0; i < 3; i++) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.004, 8, 24), M.silver);
  t.rotation.x = Math.PI / 2; t.position.set(-0.88 + i * 0.01, DESK_Y + 0.036 + i * 0.006, -1.22 + i * 0.008); room.add(t);
}
box(room, [0.06, 0.012, 0.03], [-0.95, DESK_Y + 0.04, -1.16], M.black, 0.004);
// small black mouse on the left
box(room, [0.06, 0.03, 0.1], [-1.03, DESK_Y + 0.015, -1.18], M.black, 0.014);

// snack container on the notebook (emotions vs hunger)
const texNote = canvasTex(300, 400, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#a7c8ea'); gr.addColorStop(1, '#e8f2fb');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(150, 250, 95, 60, 0, 0, 7); g.fill();
  g.beginPath(); g.ellipse(230, 210, 38, 32, 0, 0, 7); g.fill();
  g.fillStyle = '#7b5bd6'; g.fillRect(0, 0, w, 40);
});
const notebook = new THREE.Mesh(new THREE.BoxGeometry(0.21, 0.01, 0.28), [M.white, M.white, new THREE.MeshStandardMaterial({ map: texNote, roughness: 0.5 }), M.white, M.white, M.white]);
notebook.position.set(-1.2, DESK_Y + 0.005, -1.0); notebook.rotation.y = 0.12; room.add(notebook);
const snack = new THREE.Group(); snack.position.set(-1.21, DESK_Y + 0.01, -1.04); room.add(snack);
box(snack, [0.11, 0.08, 0.11], [0, 0.04, 0], new THREE.MeshStandardMaterial({ color: '#f4fbff', roughness: 0.08, transparent: true, opacity: 0.32, depthWrite: false }), 0.01);
box(snack, [0.115, 0.012, 0.115], [0, 0.086, 0], std('#f4f4f4', 0.2, 0, { transparent: true, opacity: 0.7 }), 0.004);
{ const r = rng(3); for (let i = 0; i < 9; i++) sphere(snack, 0.014, [(r() - 0.5) * 0.07, 0.015 + r() * 0.02, (r() - 0.5) * 0.07], std('#c98d45', 0.8), 8); }

// turtle toy with a mint jar
const turtle = new THREE.Group(); turtle.position.set(-1.04, DESK_Y, -0.98); turtle.rotation.y = 0.6; room.add(turtle);
const tg = std('#3fae6a', 0.4), tb = std('#8a6a43', 0.6);
const shell = sphere(turtle, 0.05, [0, 0.02, 0], tb, 20); shell.scale.set(1, 0.45, 1);
sphere(turtle, 0.022, [0, 0.03, 0.06], tg, 14);
for (const [x, z] of [[0.045, 0.035], [-0.045, 0.035], [0.04, -0.035], [-0.04, -0.035]]) { const l = sphere(turtle, 0.015, [x, 0.012, z], tg, 10); l.scale.set(1.4, 0.6, 1); }
cyl(turtle, 0.025, 0.025, 0.07, [0, 0.075, 0], std('#7a3fb8', 0.35), 20);
cyl(turtle, 0.027, 0.027, 0.012, [0, 0.115, 0], std('#5a2a90', 0.3), 20);

// deskmat with a world map
const texMat = canvasTex(1024, 360, (g, w, h) => {
  g.fillStyle = '#0d1a2e'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(120,160,220,0.12)'; g.lineWidth = 1;
  for (let x = 0; x < w; x += 48) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
  for (let y = 0; y < h; y += 48) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  const blobs = [[200, 110, 120, 70], [260, 240, 55, 80], [500, 100, 70, 45], [530, 210, 60, 80], [720, 120, 160, 70], [860, 260, 60, 35]];
  const r = rng(21);
  blobs.forEach(([cx, cy, rx, ry]) => {
    for (let i = 0; i < 520; i++) {
      const a = r() * 7, d = Math.sqrt(r());
      g.fillStyle = `rgba(70,120,200,${0.35 + r() * 0.4})`;
      g.fillRect(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, 3, 3);
    }
  });
});
boxX(room, [-0.98, -0.1], [DESK_Y, DESK_Y + 0.004], [-1.17, -0.89], new THREE.MeshStandardMaterial({ map: texMat, roughness: 0.9 }));

// main keyboard + wrist rest (C++ notes)
const texKeys = (keyCol, glow) => canvasTex(880, 280, (g, w, h) => {
  g.fillStyle = '#121316'; g.fillRect(0, 0, w, h);
  const rows = [15, 15, 14, 13, 12, 8], unit = w / 16.5;
  rows.forEach((n, r) => {
    let x = 8;
    for (let i = 0; i < n; i++) {
      const wide = (r === 5 && i === 3) ? unit * 6 : (i === n - 1 && r > 0 && r < 5) ? unit * 1.8 : unit;
      g.fillStyle = glow; g.fillRect(x - 1, 8 + r * (h / 6.2) - 1, wide - 4, h / 6.2 - 4);
      g.fillStyle = keyCol; g.fillRect(x + 2, 10 + r * (h / 6.2), wide - 10, h / 6.2 - 10);
      x += wide;
    }
  });
});
const kb = new THREE.Group(); kb.position.set(-0.38, DESK_Y + 0.004, -1.06); room.add(kb);
const kbTop = texKeys('#1c1d21', 'rgba(70,110,255,0.55)');
box(kb, [0.44, 0.03, 0.14], [0, 0.015, 0], new THREE.MeshStandardMaterial({ color: '#202124', roughness: 0.5 }), 0.006);
const kbFace = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.125), new THREE.MeshStandardMaterial({ map: kbTop, roughness: 0.55, emissiveMap: kbTop, emissive: '#ffffff', emissiveIntensity: 0.25 }));
kbFace.rotation.x = -Math.PI / 2 + 0.06; kbFace.position.set(0, 0.032, 0); kb.add(kbFace);
box(kb, [0.44, 0.018, 0.08], [0, 0.009, 0.12], std('#1a1b1e', 0.9), 0.01);

// mouse pad + MX mouse
boxX(room, [0.0, 0.24], [DESK_Y, DESK_Y + 0.006], [-1.17, -0.92], std('#1d1f23', 0.95), 0.004);
box(room, [0.22, 0.016, 0.07], [0.12, DESK_Y + 0.014, -0.955], std('#2a2c30', 0.9), 0.01);
const mx = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 14), std('#3a3d42', 0.45, 0.2));
mx.scale.set(0.85, 0.5, 1.2); mx.position.set(0.12, DESK_Y + 0.025, -1.08); room.add(mx);

// ---------------------------------------------------------------- return desk items
// laptop (about me), angled toward the chair
const laptop = new THREE.Group(); laptop.position.set(0.98, DESK_Y + 0.012, -1.18); laptop.rotation.y = -0.38; room.add(laptop);
box(laptop, [0.34, 0.016, 0.23], [0, 0.008, 0], std('#8f9194', 0.35, 0.6), 0.006);
const lpKeys = texKeys('#55575a', 'rgba(0,0,0,0)');
const lk = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: lpKeys, roughness: 0.6 }));
lk.rotation.x = -Math.PI / 2; lk.position.set(0, 0.0165, -0.035); laptop.add(lk);
box(laptop, [0.11, 0.001, 0.065], [0, 0.0165, 0.07], std('#9c9ea1', 0.3, 0.5));
const lid = new THREE.Group(); lid.position.set(0, 0.016, -0.112); lid.rotation.x = -0.32; laptop.add(lid);
box(lid, [0.34, 0.22, 0.008], [0, 0.11, -0.004], std('#8f9194', 0.35, 0.6), 0.004);
const lscreen = new THREE.Mesh(new THREE.PlaneGeometry(0.315, 0.195), new THREE.MeshBasicMaterial({ map: texLaptop, toneMapped: false }));
lscreen.position.set(0, 0.112, 0.001); lid.add(lscreen);
// laptop stand
box(room, [0.2, 0.012, 0.18], [0.98, DESK_Y + 0.006, -1.18], M.black, 0.004).rotation.y = -0.38;

// red-backlit keyboard in front of the side monitor
const rkTex = texKeys('#141416', 'rgba(255,40,40,0.75)');
const rk = new THREE.Group(); rk.position.set(1.33, DESK_Y + 0.012, -0.98); rk.rotation.y = -Math.PI / 2 + 0.12; room.add(rk);
box(rk, [0.44, 0.025, 0.14], [0, 0.012, 0], std('#111214', 0.5), 0.005);
const rkFace = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.125), new THREE.MeshStandardMaterial({ map: rkTex, emissiveMap: rkTex, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.5 }));
rkFace.rotation.x = -Math.PI / 2; rkFace.position.y = 0.0255; rk.add(rkFace);

// headphones (music)
const phones = new THREE.Group(); phones.position.set(0.98, DESK_Y + 0.02, -0.84); phones.rotation.y = 0.2; room.add(phones);
box(room, [0.24, 0.006, 0.2], [0.98, DESK_Y + 0.015, -0.86], std('#111214', 0.9), 0.003).rotation.y = 0.2;
const band = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.009, 10, 32, Math.PI), M.black);
band.rotation.x = -Math.PI / 2 + 0.25; band.position.y = 0.022; phones.add(band);
for (const s of [-1, 1]) { const cup = cyl(phones, 0.04, 0.04, 0.03, [s * 0.085, 0.022, 0], std('#1e1f22', 0.7), 24); cup.rotation.z = Math.PI / 2; }
// power bank + misc
box(room, [0.07, 0.025, 0.15], [0.82, DESK_Y + 0.025, -1.0], std('#e8e8e6', 0.4), 0.008).rotation.y = 1.3;
box(room, [0.05, 0.025, 0.06], [0.76, DESK_Y + 0.025, -1.14], M.black, 0.01);
cyl(room, 0.06, 0.06, 0.008, [1.22, DESK_Y + 0.016, -0.74], std('#cfa47a', 0.8), 24);

// backpack on the floor
const pack = new THREE.Group(); pack.position.set(1.2, 0, -0.32); pack.rotation.y = -0.3; room.add(pack);
box(pack, [0.32, 0.44, 0.16], [0, 0.22, 0], std('#16171a', 0.85), 0.06);
box(pack, [0.24, 0.2, 0.05], [0, 0.17, 0.09], std('#1d1e21', 0.85), 0.03);
for (const s of [-1, 1]) box(pack, [0.04, 0.3, 0.02], [s * 0.08, 0.24, -0.09], std('#101113', 0.9), 0.008);
box(pack, [0.1, 0.03, 0.03], [0, 0.45, 0], std('#101113', 0.9), 0.012);
// tote bag in the corner
box(room, [0.36, 0.3, 0.14], [1.48, 0.17, -0.55], std('#d6cbb4', 0.95), 0.03).rotation.y = -0.4;

// ---------------------------------------------------------------- chairs
function makeChair({ x, z, rotY, office = false }) {
  const chair = new THREE.Group(); chair.position.set(x, 0, z); chair.rotation.y = rotY; room.add(chair);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leg = box(chair, [0.3, 0.035, 0.05], [Math.cos(a) * 0.15, 0.09, Math.sin(a) * 0.15], M.black, 0.01);
    leg.rotation.y = -a;
    sphere(chair, 0.03, [Math.cos(a) * 0.29, 0.03, Math.sin(a) * 0.29], M.black, 10);
  }
  cyl(chair, 0.025, 0.03, 0.36, [0, 0.28, 0], M.darkMetal);
  box(chair, [0.54, 0.1, 0.52], [0, 0.5, 0], office ? std('#2c2e33', 0.95) : M.fabric, 0.04);
  const backPivot = new THREE.Group(); backPivot.position.set(0, 0.52, 0.24); backPivot.rotation.x = 0.13; chair.add(backPivot);
  if (!office) {   // tall gaming-style chair (mine)
    box(backPivot, [0.5, 0.84, 0.1], [0, 0.44, 0], M.fabric, 0.05);
    for (const s of [-1, 1]) box(backPivot, [0.06, 0.6, 0.12], [s * 0.24, 0.36, -0.03], M.fabric, 0.03);
    box(backPivot, [0.26, 0.12, 0.04], [0, 0.68, -0.07], std('#232427', 0.9), 0.02);
  } else {         // mesh office chair with a white frame and a jacket over the back
    box(backPivot, [0.46, 0.62, 0.05], [0, 0.38, 0], std('#303236', 0.95), 0.025);
    for (const s of [-1, 1]) box(backPivot, [0.035, 0.66, 0.05], [s * 0.245, 0.36, 0.01], M.white, 0.012);
    const jacket = std('#121318', 0.98);
    box(backPivot, [0.54, 0.56, 0.17], [0, 0.42, 0.0], jacket, 0.07);
    for (const s of [-1, 1]) { const sl = box(backPivot, [0.1, 0.5, 0.09], [s * 0.3, 0.16, 0.02], jacket, 0.04); sl.rotation.z = s * 0.08; }
  }
  for (const s of [-1, 1]) {
    box(chair, [0.035, 0.18, 0.04], [s * 0.3, 0.62, 0.02], office ? M.white : M.black, 0.01);
    box(chair, [0.08, 0.035, 0.26], [s * 0.3, 0.72, -0.02], std('#2a2b2e', 0.85), 0.015);
  }
  return chair;
}
const chair = makeChair({ x: -0.32, z: -0.32, rotY: 0.18 });
const chair2 = makeChair({ x: -0.42, z: 0.5, rotY: Math.PI - 0.25, office: true });

// ---------------------------------------------------------------- back wall: shelf, posters, frames, whiteboards
const SHELF_Y = 1.72;
boxX(WB, [-1.32, 0.38], [SHELF_Y - 0.035, SHELF_Y], [BACK, BACK + 0.24], M.white, 0.004);

function poster(parent, { w, h, x, y, z, rotY = 0, draw, wall = 'back' }) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = rotY;
  box(g, [w + 0.03, h + 0.03, 0.02], [0, 0, 0.01], M.frame, 0.003);
  const lw = Math.round(w * 1000), lh = Math.round(h * 1000);
  const t = canvasTex(lw * 2, lh * 2, (g) => { g.save(); g.scale(2, 2); draw(g, lw, lh); g.restore(); });
  const art = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35 }));
  art.position.z = 0.0205; g.add(art);
  parent.add(g);
  return g;
}
// shrink a font until the text fits the width
function fitFont(g, text, maxW, px, font) { let s = px; g.font = font(s); while (g.measureText(text).width > maxW && s > 8) { s -= 1; g.font = font(s); } return s; }
function collage(g, w, h, seed, palette) {
  const r = rng(seed);
  for (let i = 0; i < 40; i++) { g.fillStyle = palette[Math.floor(r() * palette.length)]; g.globalAlpha = 0.5 + r() * 0.5; g.fillRect(r() * w, r() * h, 30 + r() * 120, 30 + r() * 110); }
  g.globalAlpha = 1;
}
const PY = 1.38, PW = 0.27, PH = 0.36;
const posterEnd = poster(WB, { w: PW, h: PH, x: -1.05, y: PY, z: BACK, draw: (g, w, h) => {
  g.fillStyle = '#e9e9e6'; g.fillRect(0, 0, w, h);
  collage(g, w, h * 0.55, 4, ['#222', '#555', '#888', '#bbb']);
  g.fillStyle = '#111'; fitFont(g, 'IN THE END', w - 30, 52, s => headFont(s, 700)); g.fillText('IN THE END', 15, h * 0.68);
  g.font = monoFont(16, 500); g.fillText('lyrics · 2000', 18, h * 0.74);
  g.fillStyle = '#333'; for (let i = 0; i < 9; i++) g.fillRect(18, h * 0.78 + i * 8, 80 + (i * 37) % 120, 3);
} });
const posterWild = poster(WB, { w: PW, h: PH, x: -0.72, y: PY, z: BACK, draw: (g, w, h) => {
  g.fillStyle = '#d9dfe2'; g.fillRect(0, 0, w, h);
  collage(g, w, h, 8, ['#3b5a73', '#6f8fa3', '#9fb7c3', '#28394a', '#c9b98f']);
  g.fillStyle = '#ffffff'; g.fillRect(14, h * 0.48, w - 28, 60);
  g.fillStyle = '#1b2733'; fitFont(g, 'INTO THE WILD', w - 44, 40, s => headFont(s, 700)); g.fillText('INTO THE WILD', 22, h * 0.48 + 40);
} });
const posterBeatles = poster(WB, { w: PW, h: PH, x: -0.39, y: PY, z: BACK, draw: (g, w, h) => {
  g.fillStyle = '#efeae0'; g.fillRect(0, 0, w, h);
  collage(g, w, h, 12, ['#1d1d1d', '#d4483b', '#f0c43c', '#3c6fb4', '#ffffff', '#777']);
  g.fillStyle = '#111'; g.fillRect(16, 16, w - 32, 70);
  g.fillStyle = '#ffffff'; fitFont(g, 'THE BEATLES', w - 50, 46, s => headFont(s, 700)); g.textAlign = 'center'; g.fillText('THE BEATLES', w / 2, 62); g.textAlign = 'left';
} });
const posterDPS = poster(WB, { w: PW, h: PH, x: -0.06, y: PY, z: BACK, draw: (g, w, h) => {
  g.fillStyle = '#f1efe8'; g.fillRect(0, 0, w, h);
  collage(g, w, h * 0.24, 15, ['#2a2a2a', '#555', '#999']);
  g.fillStyle = '#111'; fitFont(g, 'SOCIETY', w * 0.58, 46, s => `italic 700 ${s}px Georgia, serif`);
  g.fillText('DEAD', 18, h * 0.48); g.fillText('POETS', 18, h * 0.6); g.fillText('SOCIETY', 18, h * 0.72);
  g.font = '700 26px Georgia, serif'; g.fillText('(1989)', 18, h * 0.82);
  g.fillStyle = '#555'; for (let i = 0; i < 8; i++) g.fillRect(w * 0.62, h * 0.42 + i * 12, w * 0.3, 3);
} });

// photo frames above the shelf, drawn as pixel mosaics
function mosaic(seed, warm = false) {
  return (g, w, h) => {
    const r = rng(seed), cell = 22;
    for (let y = 0; y < h; y += cell) for (let x = 0; x < w; x += cell) {
      const v = r();
      const hue = warm ? 25 + v * 30 : (y / h) < 0.45 ? 195 + v * 25 : 20 + v * 40;
      const sat = warm ? 55 + v * 30 : 30 + v * 40;
      const lig = warm ? 35 + v * 35 + (1 - Math.abs(x / w - 0.5) * 2) * 10 : 45 + v * 35;
      g.fillStyle = `hsl(${hue},${sat}%,${lig}%)`; g.fillRect(x, y, cell, cell);
    }
  };
}
const frames = new THREE.Group(); WB.add(frames);
[[-1.2, 2.2, 0.16, 0.2], [-1.2, 1.96, 0.16, 0.2], [-0.95, 2.1, 0.32, 0.22], [-0.62, 2.12, 0.2, 0.28], [-0.36, 2.3, 0.2, 0.18], [-0.36, 2.06, 0.2, 0.18]]
  .forEach(([x, y, w, h], i) => poster(frames, { w, h, x, y, z: BACK, draw: mosaic(30 + i) }));
poster(frames, { w: 0.42, h: 0.56, x: 0.06, y: 2.2, z: BACK, draw: mosaic(77, true) });

// shelf decorations
const SY = SHELF_Y;
// black dog figurine
{ const d = new THREE.Group(); d.position.set(-1.22, SY, -1.4); WB.add(d);
  const blk = std('#141416', 0.25, 0.3);
  box(d, [0.08, 0.12, 0.06], [0, 0.06, 0], blk, 0.02); box(d, [0.06, 0.07, 0.07], [0, 0.15, 0.01], blk, 0.02);
  box(d, [0.015, 0.05, 0.02], [-0.02, 0.2, 0.01], blk); box(d, [0.015, 0.05, 0.02], [0.02, 0.2, 0.01], blk);
  box(d, [0.03, 0.02, 0.02], [0, 0.17, 0.05], std('#c9a24a', 0.3, 0.8)); }
// lanterns
function lantern(x, col) {
  const l = new THREE.Group(); l.position.set(x, SY, -1.4); WB.add(l);
  const m = std(col, 0.4);
  box(l, [0.08, 0.012, 0.08], [0, 0.006, 0], m);
  cyl(l, 0.035, 0.035, 0.12, [0, 0.07, 0], new THREE.MeshStandardMaterial({ color: col, roughness: 0.4, transparent: true, opacity: 0.85 }), 6);
  cyl(l, 0.005, 0.05, 0.04, [0, 0.15, 0], m, 6);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 6, 16), m); ring.position.y = 0.18; l.add(ring);
  const flame = sphere(l, 0.012, [0, 0.06, 0], new THREE.MeshBasicMaterial({ color: '#ffcf7a' }), 8);
  return { l, flame };
}
const lanternRed = lantern(-0.98, '#c0392b');
const lanternWhite = lantern(-0.84, '#f4f1ea');
// toy bicycle (Fourier epicycles)
const bike = new THREE.Group(); bike.position.set(-0.56, SY, -1.38); WB.add(bike);
{ const bm = std('#1a1a1a', 0.4, 0.5);
  for (const x of [-0.07, 0.07]) {
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.004, 8, 32), bm); wheel.position.set(x, 0.05, 0); bike.add(wheel);
    for (let s = 0; s < 6; s++) { const sp = box(bike, [0.088, 0.0015, 0.0015], [x, 0.05, 0], bm); sp.rotation.z = (s / 6) * Math.PI; }
  }
  const f1 = box(bike, [0.14, 0.006, 0.006], [0, 0.085, 0], bm); f1.rotation.z = 0.1;
  const f2 = box(bike, [0.006, 0.07, 0.006], [-0.02, 0.07, 0], bm); f2.rotation.z = 0.35;
  const f3 = box(bike, [0.006, 0.07, 0.006], [0.055, 0.075, 0], bm); f3.rotation.z = -0.3;
  box(bike, [0.04, 0.008, 0.02], [-0.03, 0.11, 0], std('#5a3a20', 0.7));
  box(bike, [0.005, 0.005, 0.06], [0.06, 0.115, 0], bm); }
// oil burner
cyl(WB, 0.03, 0.04, 0.08, [-0.36, SY + 0.04, -1.4], std('#d8c6a3', 0.5), 16);
// yellow toy car
{ const c = new THREE.Group(); c.position.set(-0.16, SY, -1.36); c.rotation.y = 0.2; WB.add(c);
  box(c, [0.14, 0.025, 0.06], [0, 0.02, 0], std('#f2c81d', 0.25, 0.3), 0.008);
  box(c, [0.07, 0.02, 0.05], [-0.01, 0.04, 0], std('#2a2a2a', 0.1, 0.5), 0.008);
  for (const [x, z] of [[-0.045, 0.03], [0.045, 0.03], [-0.045, -0.03], [0.045, -0.03]]) { const w = cyl(c, 0.012, 0.012, 0.01, [x, 0.012, z], M.black, 12); w.rotation.x = Math.PI / 2; } }
// gemstone tree
{ const t = new THREE.Group(); t.position.set(0.04, SY, -1.4); WB.add(t);
  cyl(t, 0.025, 0.035, 0.03, [0, 0.015, 0], std('#5a4a3a', 0.8), 10);
  const r = rng(17), gems = ['#e7a33e', '#9b59b6', '#3a8f5c', '#c0392b', '#f1c40f', '#7f8c8d'];
  for (let i = 0; i < 4; i++) { const b = cyl(t, 0.003, 0.004, 0.12, [0, 0.08, 0], std('#6b4a2a', 0.6), 5); b.rotation.set((r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.9); }
  for (let i = 0; i < 46; i++) sphere(t, 0.009, [(r() - 0.5) * 0.12, 0.1 + r() * 0.1, (r() - 0.5) * 0.07], std(gems[i % gems.length], 0.2, 0.1), 6); }
// 사랑 sign (Korean notes)
const texSarang = canvasTex(256, 140, (g, w, h) => {
  g.fillStyle = '#2b6fd6'; g.beginPath(); g.roundRect(4, 4, w - 8, h - 8, 26); g.fill();
  g.fillStyle = '#ffffff'; g.font = '700 68px "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('사랑', w / 2, h / 2 + 4);
});
const sarang = new THREE.Group(); sarang.position.set(0.25, SY + 0.05, -1.36); sarang.rotation.y = -0.2; WB.add(sarang);
box(sarang, [0.14, 0.08, 0.012], [0, 0, 0], std('#2b6fd6', 0.4), 0.004);
const sf = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.077), new THREE.MeshStandardMaterial({ map: texSarang, roughness: 0.4, transparent: true }));
sf.position.z = 0.0065; sarang.add(sf);
// prayer beads hanging from the shelf
{ const r = rng(23), cols = ['#8a5a36', '#c9a46a', '#7a2e2e', '#e8dcc6'];
  for (let i = 0; i < 26; i++) { const t = i / 25; sphere(WB, 0.008, [-1.18 + Math.sin(t * 3) * 0.02, SY - 0.03 - t * 0.38, BACK + 0.25 - t * 0.04], std(cols[Math.floor(r() * 4)], 0.5), 6); } }

// big whiteboard (Bloom filters)
const marker = (g, col, wd) => { g.strokeStyle = col; g.fillStyle = col; g.lineWidth = wd; g.lineCap = 'round'; g.lineJoin = 'round'; };
const handFont = (px) => `${px}px "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive`;
function wobble(g, x0, y0, x1, y1, r) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (r() - 0.5) * 6, (y0 + y1) / 2 + (r() - 0.5) * 6, x1, y1); g.stroke(); }
// it hangs on the window wall, between the window and the corner
const wbBig = new THREE.Group(); wbBig.position.set(W0, 1.5, -1.06); wbBig.rotation.y = Math.PI / 2; WL.add(wbBig);
{ const w = 0.6, h = 0.9;
  box(wbBig, [w + 0.03, h + 0.03, 0.02], [0, 0, 0.01], M.silver, 0.004);
  const t = canvasTex(600, 900, (g, W, Hh) => {
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, W, Hh);
    const r = rng(31);
    marker(g, '#1f4fb8', 4); g.font = handFont(40); g.fillText('Bloom filter', 40, 90);
    g.font = handFont(26); g.fillText('k = 3 hashes', 60, 140);
    const bits = [0, 1, 0, 0, 1, 0, 1, 1, 0, 0];
    bits.forEach((b, i) => {
      const x = 30 + i * 44, y = 420;
      marker(g, '#222', 3); wobble(g, x, y, x + 44, y, r); wobble(g, x, y + 50, x + 44, y + 50, r); wobble(g, x, y, x, y + 50, r);
      if (i === bits.length - 1) wobble(g, x + 44, y, x + 44, y + 50, r);
      g.font = handFont(30); g.fillStyle = b ? '#c0392b' : '#777'; g.fillText(String(b), x + 13, y + 37);
    });
    marker(g, '#222', 3); g.font = handFont(32); g.fillText('"cat"', 180, 250);
    marker(g, '#c0392b', 3);
    [1, 4, 7].forEach(i => wobble(g, 215, 265, 30 + i * 44 + 22, 410, r));
    marker(g, '#1f4fb8', 3); g.font = handFont(26);
    g.fillText('no false negatives', 40, 560); g.fillText('p ≈ (1 − e^(−kn/m))^k', 40, 610);
    marker(g, '#2e8b57', 3); g.font = handFont(28); g.fillText('TODO:', 40, 720);
    g.font = handFont(24); g.fillText('□ next post', 60, 765); g.fillText('☑ 3D room', 60, 805); g.fillText('□ more sleep', 60, 845);
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: 0.25 }));
  face.position.set(0, 0, 0.021); wbBig.add(face);
  box(wbBig, [w, 0.015, 0.04], [0, -h / 2 - 0.02, 0.03], M.silver); }

// small whiteboard + felt board (segment trees)
const wbSmall = new THREE.Group(); WB.add(wbSmall);
{ const x0 = 0.58, x1 = 1.4, y0 = 1.3, y1 = 1.88;
  boxX(wbSmall, [x0 - 0.015, x1 + 0.015], [y0 - 0.015, y1 + 0.015], [BACK, BACK + 0.02], M.silver, 0.004);
  const t = canvasTex(820, 580, (g, W, Hh) => {
    g.fillStyle = '#fbfbfa'; g.fillRect(0, 0, W * 0.6, Hh);
    g.fillStyle = '#16213d'; g.fillRect(W * 0.6, 0, W * 0.4, Hh);
    const r = rng(41);
    const nodes = [[245, 90, '36'], [130, 210, '15'], [360, 210, '21'], [70, 330, '7'], [190, 330, '8'], [300, 330, '9'], [420, 330, '12']];
    const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]];
    marker(g, '#333', 3); edges.forEach(([a, b]) => wobble(g, nodes[a][0], nodes[a][1] + 22, nodes[b][0], nodes[b][1] - 22, r));
    nodes.forEach(([x, y, v]) => { marker(g, '#1f4fb8', 3); g.beginPath(); g.arc(x, y, 26, 0, 7); g.stroke(); g.font = handFont(24); g.fillText(v, x - 14, y + 9); });
    marker(g, '#c0392b', 3); g.font = handFont(30); g.fillText('segment tree', 40, 450); g.font = handFont(22); g.fillText('query O(log n)', 40, 495);
    // pinned notes on the felt
    [['#fde68a', 540, 80], ['#bbf7d0', 640, 180], ['#fbcfe8', 560, 320]].forEach(([c, x, y], i) => {
      g.fillStyle = c; g.save(); g.translate(x, y); g.rotate((i - 1) * 0.08); g.fillRect(0, 0, 110, 100);
      g.fillStyle = '#444'; for (let k = 0; k < 4; k++) g.fillRect(12, 24 + k * 18, 70 + (k * 13) % 20, 4);
      g.fillStyle = '#c0392b'; g.beginPath(); g.arc(55, 8, 6, 0, 7); g.fill(); g.restore();
    });
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4 }));
  face.position.set((x0 + x1) / 2, (y0 + y1) / 2, BACK + 0.021); wbSmall.add(face); }

// ---------------------------------------------------------------- right wall: corner shelves, rainbow, posters, clock, door
const RW = W1;
for (const y of [1.55, 1.95]) {
  boxX(WR, [RW - 0.24, RW], [y - 0.025, y], [-1.25, -0.72], M.white, 0.004);
  for (const z of [-1.18, -0.8]) { const b = boxX(WR, [RW - 0.16, RW], [y - 0.12, y - 0.025], [z - 0.008, z + 0.008], M.white); b.scale.x = 0.9; }
}
{ const r = rng(51), cols = ['#c0392b', '#e67e22', '#f1c40f', '#8e44ad', '#2c3e50', '#795548', '#ecf0f1', '#e84393'];
  for (let i = 0; i < 14; i++) {
    const y = r() < 0.5 ? 1.55 : 1.95, z = -1.2 + r() * 0.44, x = RW - 0.05 - r() * 0.15, s = 0.02 + r() * 0.035;
    const m = std(cols[Math.floor(r() * cols.length)], 0.4, r() * 0.4);
    if (r() < 0.5) box(WR, [s, s * 1.4, s], [x, y + s * 0.7, z], m, s * 0.2); else sphere(WR, s * 0.6, [x, y + s * 0.6, z], m, 10);
  } }
// small key-holder tree on the lower shelf
{ const t = new THREE.Group(); t.position.set(RW - 0.12, 1.55, -1.08); WR.add(t);
  const tm = std('#2b2b2b', 0.5, 0.3);
  cyl(t, 0.004, 0.006, 0.16, [0, 0.08, 0], tm, 6);
  for (let i = 0; i < 6; i++) { const b = cyl(t, 0.003, 0.003, 0.08, [0, 0.12, 0], tm, 5); b.rotation.set(Math.sin(i) * 0.9, 0, Math.cos(i) * 0.9); } }
// white rainbow arch with a soft glow beneath
const rainbow = new THREE.Group(); rainbow.position.set(RW - 0.01, 1.32, -0.98); rainbow.rotation.y = -Math.PI / 2; WR.add(rainbow);
for (let i = 0; i < 4; i++) {
  const arc = new THREE.Mesh(new THREE.TorusGeometry(0.06 + i * 0.03, 0.011, 8, 32, Math.PI), std('#f6f6f3', 0.6));
  arc.position.z = 0.01; rainbow.add(arc);
}
const wallGlow = new THREE.PointLight('#d8ffd0', 0.0, 0.6, 2);
wallGlow.position.set(RW - 0.12, 1.2, -0.98); WR.add(wallGlow);

// posters on the right wall
const ROT_R = -Math.PI / 2;
poster(WR, { w: 0.3, h: 0.42, x: RW, y: 2.2, z: -0.95, rotY: ROT_R, draw: (g, w, h) => {
  g.fillStyle = '#0e0e0f'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#c62828'; g.beginPath(); g.moveTo(w * 0.55, 0); g.lineTo(w * 0.85, 0); g.lineTo(w * 0.62, h * 0.7); g.lineTo(w * 0.45, h * 0.7); g.fill();
  g.fillStyle = '#d6d6d6'; g.beginPath(); g.ellipse(w * 0.45, h * 0.32, w * 0.16, h * 0.15, 0, 0, 7); g.fill();
  g.fillStyle = '#0e0e0f'; g.fillRect(w * 0.29, h * 0.15, w * 0.32, h * 0.08);
  g.fillStyle = '#222'; g.beginPath(); g.moveTo(w * 0.15, h); g.lineTo(w * 0.3, h * 0.5); g.lineTo(w * 0.62, h * 0.5); g.lineTo(w * 0.8, h); g.fill();
} });
poster(WR, { w: 0.3, h: 0.42, x: RW, y: 1.95, z: -0.36, rotY: ROT_R, draw: (g, w, h) => {
  g.fillStyle = '#151515'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8e8e8'; fitFont(g, 'HAVE TO INTRODUCE YOURSELF.', w - 24, 17, s => headFont(s, 600)); g.textAlign = 'center';
  g.fillText('WORK UNTIL YOU NO LONGER', w / 2, 34); g.fillText('HAVE TO INTRODUCE YOURSELF.', w / 2, 56);
  g.fillStyle = '#3a3a3a'; g.fillRect(w * 0.12, 80, w * 0.34, h * 0.62); g.fillRect(w * 0.54, 80, w * 0.34, h * 0.62);
  g.fillStyle = '#d32f2f'; g.font = headFont(52, 700); g.fillText('SUITS', w / 2, h - 34); g.textAlign = 'left';
} });
poster(WR, { w: 0.3, h: 0.42, x: RW, y: 1.45, z: -0.36, rotY: ROT_R, draw: (g, w, h) => {
  collage(g, w, h, 61, ['#e84393', '#fdcb6e', '#00b894', '#0984e3', '#d63031', '#ffffff']);
  g.fillStyle = 'rgba(20,24,40,0.75)'; g.fillRect(w * 0.18, h * 0.2, w * 0.64, h * 0.55);
  g.fillStyle = '#ffffff'; fitFont(g, 'THE MAN', w - 40, 40, s => headFont(s, 700)); g.textAlign = 'center';
  g.fillText('I PLAY', w / 2, h * 0.84); g.fillText('THE MAN', w / 2, h * 0.94); g.textAlign = 'left';
} });

// wall clock (shows the visitor's time)
const clock = new THREE.Group(); clock.position.set(RW - 0.02, 2.42, -0.42); clock.rotation.y = ROT_R; WR.add(clock);
cyl(clock, 0.15, 0.15, 0.03, [0, 0, 0], std('#f4f4f1', 0.4), 40).rotation.x = Math.PI / 2;
const texClock = canvasTex(256, 256, (g, w) => {
  g.fillStyle = '#ffffff'; g.beginPath(); g.arc(w / 2, w / 2, w / 2, 0, 7); g.fill();
  g.fillStyle = '#9a9a9a'; g.font = headFont(24, 500); g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), w / 2 + Math.sin(a) * 98, w / 2 - Math.cos(a) * 98); }
});
const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.14, 40), new THREE.MeshStandardMaterial({ map: texClock, roughness: 0.4 }));
clockFace.position.z = 0.016; clock.add(clockFace);
const hourHand = new THREE.Group(), minHand = new THREE.Group();
hourHand.position.z = minHand.position.z = 0.019;
box(hourHand, [0.008, 0.07, 0.002], [0, 0.03, 0], std('#555', 0.5));
box(minHand, [0.005, 0.11, 0.002], [0, 0.05, 0.002], std('#555', 0.5));
clock.add(hourHand, minHand);

// light switch on the right wall, just inside the door
const lightSwitch = new THREE.Group(); WR.add(lightSwitch);
box(lightSwitch, [0.012, 0.11, 0.08], [W1 - 0.006, 1.2, 0.38], std('#f7f7f5', 0.4), 0.004);
const rocker = box(lightSwitch, [0.01, 0.04, 0.03], [W1 - 0.015, 1.2, 0.38], std('#e8e8e5', 0.4), 0.003);

// ---------------------------------------------------------------- window wall: drawer tower, cabinet with books
// clear drawer tower squeezed between the drawer unit and the wall
const tower = new THREE.Group(); room.add(tower);
{ const x0 = W0 + 0.03, x1 = W0 + 0.31, z0 = -1.22, z1 = -0.9;
  const frameM = std('#f4f4f2', 0.5);
  for (const x of [x0, x1 - 0.012]) boxX(tower, [x, x + 0.012], [0.02, 0.72], [z0, z1], frameM);
  boxX(tower, [x0, x1], [0.71, 0.73], [z0, z1], frameM);
  for (let i = 0; i < 4; i++) {
    const y0 = 0.05 + i * 0.165;
    boxX(tower, [x0 + 0.015, x1 - 0.015], [y0, y0 + 0.15], [z0 + 0.01, z1 - 0.005], std('#e6eef2', 0.25, 0, { transparent: true, opacity: 0.55, depthWrite: false }));
  }
  box(tower, [0.2, 0.02, 0.26], [(x0 + x1) / 2, 0.75, (z0 + z1) / 2], std('#b08acb', 0.6), 0.004); // notebooks on top
  box(tower, [0.18, 0.015, 0.24], [(x0 + x1) / 2, 0.767, (z0 + z1) / 2], std('#f0a3b8', 0.6), 0.004);
}

// white cabinet in the corner, with a book holder on top (philosophy)
const cab = new THREE.Group(); room.add(cab);
const CB = { x0: W0 + 0.01, x1: W0 + 0.43, z0: 0.98, z1: FRONT - 0.02, h: 0.95 };
boxX(cab, [CB.x0, CB.x1], [0.02, CB.h], [CB.z0, CB.z1], M.whiteMatte, 0.006);
boxX(cab, [CB.x1, CB.x1 + 0.012], [0.07, CB.h - 0.04], [CB.z0 + 0.025, CB.z1 - 0.025], M.white, 0.003);
boxX(cab, [CB.x1 + 0.012, CB.x1 + 0.018], [0.16, CB.h - 0.13], [CB.z0 + 0.08, CB.z1 - 0.08], std('#efefeb', 0.5), 0.003);
[[1.08, 0.8, '#fde68a', 0.05], [1.17, 0.76, '#fef3a0', -0.06], [1.32, 0.7, '#fde68a', 0.08]].forEach(([z, y, c, r]) => {
  const n = plane(cab, [0.07, 0.06], [CB.x1 + 0.0195, y, z], std(c, 0.85), Math.PI / 2); n.rotation.z = r;
});
const books = new THREE.Group(); books.position.set((CB.x0 + CB.x1) / 2, CB.h, (CB.z0 + CB.z1) / 2); cab.add(books);
{ const holder = M.white;
  box(books, [0.3, 0.012, 0.44], [0, 0.006, 0], holder);
  for (const s of [-1, 1]) box(books, [0.3, 0.3, 0.012], [0, 0.15, s * 0.214], holder);
  box(books, [0.012, 0.3, 0.44], [-0.144, 0.15, 0], holder);
  box(books, [0.29, 0.012, 0.42], [0, 0.075, 0], holder);
  for (let i = 0; i < 4; i++) box(books, [0.24, 0.012, 0.32], [0.01, 0.018 + i * 0.013, 0], std(i % 2 ? '#d8d8d8' : '#f2f2f2', 0.6), 0.003);
  const r = rng(71), cols = ['#8b2e2e', '#c0392b', '#e74c3c', '#2c3e50', '#ecf0f1', '#d35400', '#34495e', '#f39c12', '#7f3b1d'];
  let z = -0.19;
  while (z < 0.17) {
    const t = 0.022 + r() * 0.022, hgt = 0.17 + r() * 0.05;
    const bk = box(books, [0.15, hgt, t], [0.04, 0.081 + hgt / 2, z + t / 2], std(cols[Math.floor(r() * cols.length)], 0.7));
    if (z > 0.1) bk.rotation.x = -0.25;
    z += t + 0.002;
  }
}

// ---------------------------------------------------------------- the second desk (front wall): a standing desk
const SD = { x0: -1.24, x1: 0.46, z0: 0.82, z1: FRONT - 0.01, y: DESK_Y };
const desk2 = new THREE.Group(); room.add(desk2);
boxX(desk2, [SD.x0, SD.x1], [SD.y - 0.03, SD.y], [SD.z0, SD.z1], M.white, 0.006);
for (const x of [SD.x0 + 0.13, SD.x1 - 0.13]) {
  boxX(desk2, [x - 0.035, x + 0.035], [0.04, SD.y - 0.03], [1.13, 1.2], M.white, 0.004);
  boxX(desk2, [x - 0.035, x + 0.035], [0, 0.04], [SD.z0 + 0.03, SD.z1 - 0.03], M.white, 0.012);
}
boxX(desk2, [SD.x0 + 0.13, SD.x1 - 0.13], [SD.y - 0.1, SD.y - 0.06], [1.14, 1.19], M.white);
box(desk2, [0.12, 0.022, 0.045], [SD.x0 + 0.3, SD.y - 0.045, SD.z0 + 0.012], M.black, 0.006);   // height controls
box(desk2, [0.34, 0.16, 0.12], [-0.42, 0.56, 1.38], M.black, 0.01);                               // UPS on the cable tray
const bin2 = cyl(desk2, 0.11, 0.09, 0.28, [0.22, 0.14, 1.3], std('#16181a', 0.7, 0, { side: THREE.DoubleSide }), 24, true);
// pink desk mat, white keyboard, pink mouse
boxX(desk2, [-0.98, 0.08], [SD.y, SD.y + 0.004], [0.9, 1.27], std('#e8b2aa', 0.95), 0.004);
const kb2 = texKeys('#f3f3f1', 'rgba(0,0,0,0.12)');
box(desk2, [0.36, 0.016, 0.115], [-0.4, SD.y + 0.012, 1.04], std('#ecece9', 0.5), 0.005);
const kb2f = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.1), new THREE.MeshStandardMaterial({ map: kb2, roughness: 0.5 }));
kb2f.rotation.x = -Math.PI / 2; kb2f.rotation.z = Math.PI; kb2f.position.set(-0.4, SD.y + 0.0205, 1.04); desk2.add(kb2f);
cyl(desk2, 0.075, 0.075, 0.004, [-0.74, SD.y + 0.006, 1.04], std('#f6d4cf', 0.9), 28);
const pm = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), std('#f2b8c0', 0.4));
pm.scale.set(0.9, 0.5, 1.25); pm.position.set(-0.74, SD.y + 0.022, 1.05); desk2.add(pm);
box(desk2, [0.17, 0.045, 0.11], [-1.0, SD.y + 0.023, 0.97], std('#f3d21c', 0.5), 0.015).rotation.y = 0.4;   // snack pack

// screens are off on this desk
const texOff = canvasTex(256, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#1a1e24'); gr.addColorStop(0.45, '#0b0d10'); gr.addColorStop(1, '#16191e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
});
monitor(desk2, { w: 0.6, h: 0.34, curve: 0, tex: texOff, x: -0.4, y: 1.13, z: 1.36, rotY: Math.PI, stand: 'flat' });
monitor(desk2, { w: 0.34, h: 0.6, curve: 0, tex: texOff, x: 0.12, y: 1.21, z: 1.33, rotY: Math.PI + 0.2, stand: 'flat' });
// tablet on a stand in front of the monitor
const tab = box(desk2, [0.2, 0.14, 0.01], [-0.4, SD.y + 0.09, 1.2], std('#15171b', 0.3, 0.2), 0.008); tab.rotation.x = 0.22;
box(desk2, [0.08, 0.012, 0.08], [-0.4, SD.y + 0.006, 1.22], M.silver, 0.004);
// laptop on a stand, angled toward the chair
const laptop2 = new THREE.Group(); laptop2.position.set(-0.86, SD.y + 0.1, 1.28); laptop2.rotation.y = Math.PI - 0.25; desk2.add(laptop2);
box(laptop2, [0.06, 0.1, 0.18], [0, -0.05, -0.02], M.black, 0.01);
const lbase = new THREE.Group(); lbase.rotation.x = 0.18; laptop2.add(lbase);
box(lbase, [0.32, 0.014, 0.22], [0, 0.007, 0], std('#c8cacd', 0.35, 0.6), 0.006);
const lk2 = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.1), new THREE.MeshStandardMaterial({ map: texKeys('#2a2b2e', 'rgba(0,0,0,0)'), roughness: 0.6 }));
lk2.rotation.x = -Math.PI / 2; lk2.position.set(0, 0.0145, -0.03); lbase.add(lk2);
const lid2 = new THREE.Group(); lid2.position.set(0, 0.014, -0.11); lid2.rotation.x = -0.3; lbase.add(lid2);
box(lid2, [0.32, 0.21, 0.007], [0, 0.105, -0.004], std('#c8cacd', 0.35, 0.6), 0.004);
const ls2 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.19), new THREE.MeshBasicMaterial({ map: texOff, toneMapped: false }));
ls2.position.set(0, 0.107, 0.0005); lid2.add(ls2);
// clutter at the left end: little drawers, tissues, pen caddy, notebooks
['#e2b04a', '#5f9ea0', '#6aa9ab'].forEach((c, i) => {
  box(desk2, [0.2, 0.07, 0.22], [0.33, SD.y + 0.036 + i * 0.074, 1.36], std(c, 0.55), 0.008);
  box(desk2, [0.04, 0.012, 0.004], [0.33, SD.y + 0.036 + i * 0.074, 1.249], std('#3b3b3b', 0.5));
});
box(desk2, [0.12, 0.06, 0.12], [0.33, SD.y + 0.25, 1.37], std('#f7f7f5', 0.8), 0.01);
cyl(desk2, 0.04, 0.035, 0.09, [0.3, SD.y + 0.045, 1.08], std('#8d8f93', 0.6), 6);
['#e74c3c', '#2f5fd0', '#f2c640', '#111'].forEach((c, i) => cyl(desk2, 0.005, 0.005, 0.14, [0.3 + Math.cos(i * 1.7) * 0.015, SD.y + 0.1, 1.08 + Math.sin(i * 1.7) * 0.015], std(c, 0.4), 6));
box(desk2, [0.18, 0.03, 0.24], [0.28, SD.y + 0.015, 0.94], std('#b9b1e0', 0.7), 0.004);
box(desk2, [0.16, 0.012, 0.22], [0.28, SD.y + 0.036, 0.94], std('#f6f3ee', 0.7), 0.003);
const scrunch = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.014, 8, 20), std('#d9c7b3', 1)); scrunch.rotation.x = Math.PI / 2;
scrunch.position.set(0.28, SD.y + 0.055, 0.93); desk2.add(scrunch);
// the camel who supervises
const camel = new THREE.Group(); camel.position.set(-1.1, SD.y, 1.16); camel.rotation.y = 2.3; desk2.add(camel);
{ const tan = std('#c99a62', 0.98), dark = std('#8a5a34', 0.98);
  const body = sphere(camel, 0.08, [0, 0.13, 0], tan, 18); body.scale.set(1.45, 0.78, 0.85);
  const hump = sphere(camel, 0.055, [-0.01, 0.2, 0], tan, 14); hump.scale.set(1.2, 0.8, 0.9);
  box(camel, [0.13, 0.11, 0.155], [-0.01, 0.19, 0], std('#2e5b3c', 0.95), 0.03);
  const neck = cyl(camel, 0.028, 0.034, 0.13, [0.12, 0.2, 0], tan, 12); neck.rotation.z = -0.55;
  const head = sphere(camel, 0.042, [0.17, 0.27, 0], tan, 14); head.scale.set(1.45, 0.9, 0.9);
  sphere(camel, 0.02, [0.165, 0.305, 0], dark, 10);
  for (const [x, z] of [[0.07, 0.04], [0.07, -0.04], [-0.07, 0.04], [-0.07, -0.04]]) cyl(camel, 0.02, 0.022, 0.1, [x, 0.05, z], tan, 10);
  const tail = cyl(camel, 0.006, 0.006, 0.08, [-0.13, 0.12, 0], dark, 6); tail.rotation.z = 0.4; }

// ---------------------------------------------------------------- front wall decor: family tree clock, floating shelves, door frame
const famClock = new THREE.Group(); famClock.position.set(-0.42, 2.02, FRONT - 0.014); famClock.rotation.y = Math.PI; WF.add(famClock);
const FT = { w: 0.6, h: 0.64, cx: 300, cy: 250 };
const texTree = canvasTex(600, 640, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  const wood = '#7b4226';
  // canopy: a wooden disc with leafy cut-outs
  g.fillStyle = wood; g.beginPath(); g.ellipse(300, 250, 285, 240, 0, 0, 7); g.fill();
  g.globalCompositeOperation = 'destination-out';
  const r = rng(81);
  for (let i = 0; i < 90; i++) {
    const a = r() * Math.PI * 2, d = 0.72 + r() * 0.24;
    g.beginPath(); g.ellipse(300 + Math.cos(a) * 285 * d, 250 + Math.sin(a) * 240 * d, 8 + r() * 14, 5 + r() * 9, a, 0, 7); g.fill();
  }
  g.globalCompositeOperation = 'source-over';
  // trunk and plaque
  g.fillStyle = wood; g.beginPath(); g.moveTo(275, 470); g.lineTo(325, 470); g.lineTo(350, 600); g.lineTo(250, 600); g.fill();
  g.fillStyle = '#6a3820'; g.beginPath(); g.roundRect(170, 585, 260, 50, 10); g.fill();
  g.fillStyle = '#e8c36a'; g.font = 'italic 700 36px Georgia, serif'; g.textAlign = 'center'; g.fillText('Family', 300, 622);
  // photo frames, drawn as warm pixel mosaics
  [[300, 95, 120, 86], [172, 140, 90, 74], [428, 140, 90, 74], [140, 255, 108, 80], [460, 255, 108, 80], [215, 385, 120, 84], [385, 385, 120, 84]].forEach(([x, y, fw, fh], k) => {
    g.fillStyle = '#5a2f1a'; g.fillRect(x - fw / 2 - 7, y - fh / 2 - 7, fw + 14, fh + 14);
    const rr = rng(90 + k), cell = 10;
    for (let yy = 0; yy < fh; yy += cell) for (let xx = 0; xx < fw; xx += cell) {
      const v = rr(); g.fillStyle = `hsl(${(k * 47 + v * 60) % 360},${45 + v * 30}%,${45 + v * 30}%)`;
      g.fillRect(x - fw / 2 + xx, y - fh / 2 + yy, cell, cell);
    }
  });
  // clock face in the middle
  g.fillStyle = '#5a2f1a'; g.beginPath(); g.ellipse(300, 250, 68, 88, 0, 0, 7); g.fill();
  g.fillStyle = '#fbf7ee'; g.beginPath(); g.ellipse(300, 250, 58, 78, 0, 0, 7); g.fill();
  g.fillStyle = '#b03a2e'; g.font = '600 15px Georgia, serif'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2; g.fillText(String(i), 300 + Math.sin(a) * 46, 250 - Math.cos(a) * 64); }
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
});
const treeFace = new THREE.Mesh(new THREE.PlaneGeometry(FT.w, FT.h), new THREE.MeshStandardMaterial({ map: texTree, roughness: 0.6, transparent: true, alphaTest: 0.5 }));
famClock.add(treeFace);
const famHour = new THREE.Group(), famMin = new THREE.Group();
famHour.position.set(0, (0.5 - FT.cy / 640) * FT.h, 0.006); famMin.position.copy(famHour.position); famMin.position.z = 0.008;
box(famHour, [0.007, 0.04, 0.002], [0, 0.017, 0], std('#222', 0.5));
box(famMin, [0.005, 0.058, 0.002], [0, 0.026, 0], std('#222', 0.5));
famClock.add(famHour, famMin);

// three small floating shelves: paintings, a plant, a parrot
function miniPainting(parent, [x, y, z], draw, w = 0.09, h = 0.12) {
  const t = canvasTex(180, 240, draw);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.012), [M.white, M.white, M.white, M.white, new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 }), M.white]);
  m.position.set(x, y + h / 2, z); m.rotation.y = Math.PI; m.rotation.x = 0.08; parent.add(m);
  return m;
}
const FZ = FRONT;
boxX(WF, [0.06, 0.44], [1.5, 1.52], [FZ - 0.17, FZ], M.white, 0.003);
boxX(WF, [0.26, 0.5], [1.8, 1.82], [FZ - 0.17, FZ], M.white, 0.003);
boxX(WF, [0.06, 0.4], [2.08, 2.1], [FZ - 0.17, FZ], M.white, 0.003);
miniPainting(WF, [0.2, 1.52, FZ - 0.06], (g, w, h) => {
  g.fillStyle = '#1f3b8a'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f5f0d8'; g.beginPath(); g.arc(w / 2, h * 0.45, 46, 0, 7); g.fill();
  g.fillStyle = '#2e7d4f'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(i * 34, h); g.lineTo(i * 34 + 17, h - 70); g.lineTo(i * 34 + 34, h); g.fill(); }
});
miniPainting(WF, [0.31, 1.52, FZ - 0.06], (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f39c12'); gr.addColorStop(0.6, '#e74c3c'); gr.addColorStop(1, '#8e44ad');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = '#1e5631'; for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(i * 40, h); g.lineTo(i * 40 + 20, h - 90); g.lineTo(i * 40 + 40, h); g.fill(); }
});
{ const bowl = sphere(WF, 0.04, [0.11, 1.53, FZ - 0.08], std('#5b6b73', 0.3, 0.4), 16); bowl.scale.set(1, 0.4, 1); }
cyl(WF, 0.045, 0.035, 0.09, [0.38, 1.865, FZ - 0.08], std('#f5f5f2', 0.4), 18);
{ const r = rng(85), lm = std('#3f8f3a', 0.5);
  for (let i = 0; i < 18; i++) {
    const lf = sphere(WF, 0.03, [0.38 + (r() - 0.5) * 0.16, 1.93 + r() * 0.13, FZ - 0.08 + (r() - 0.5) * 0.1], lm, 8);
    lf.scale.set(1, 0.35, 0.8); lf.rotation.set(r() * 3, r() * 3, r() * 3);
  } }
miniPainting(WF, [0.16, 2.1, FZ - 0.06], (g, w, h) => {
  g.fillStyle = '#e8d8a8'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#4a7fb5'; g.fillRect(0, 0, w, h * 0.4);
  g.fillStyle = '#c47f3a'; g.fillRect(20, h * 0.45, w - 40, h * 0.35);
}, 0.14, 0.1);
{ const parrot = new THREE.Group(); parrot.position.set(0.31, 2.1, FZ - 0.07); parrot.rotation.y = Math.PI - 0.4; WF.add(parrot);
  const green = std('#2fa84f', 0.5);
  const b = sphere(parrot, 0.025, [0, 0.045, 0], green, 12); b.scale.set(0.9, 1.5, 0.9);
  sphere(parrot, 0.018, [0, 0.09, 0.008], green, 10);
  const beak = sphere(parrot, 0.008, [0, 0.087, 0.026], std('#d9452b', 0.4), 8); beak.scale.set(1, 1, 1.5);
  const tail = box(parrot, [0.014, 0.06, 0.008], [0, 0.0, -0.02], green); tail.rotation.x = -0.4; }
// door frame and the pull-up bar across it
const archi = std('#5a3416', 0.5);
boxX(WF, [DOOR.x0 - 0.06, DOOR.x0], [0, DOOR.y1 + 0.06], [FRONT - 0.03, FRONT], archi);
boxX(WF, [DOOR.x1, DOOR.x1 + 0.06], [0, DOOR.y1 + 0.06], [FRONT - 0.03, FRONT], archi);
boxX(WF, [DOOR.x0 - 0.06, DOOR.x1 + 0.06], [DOOR.y1, DOOR.y1 + 0.06], [FRONT - 0.03, FRONT], archi);
{ const bar = cyl(WF, 0.017, 0.017, DOOR.x1 - DOOR.x0, [(DOOR.x0 + DOOR.x1) / 2, 1.98, FRONT - 0.06], M.black, 12); bar.rotation.z = Math.PI / 2;
  for (const x of [DOOR.x0 + 0.22, DOOR.x1 - 0.22]) { const gr = cyl(WF, 0.024, 0.024, 0.16, [x, 1.98, FRONT - 0.06], std('#a3262a', 0.6), 12); gr.rotation.z = Math.PI / 2; }
  for (const x of [DOOR.x0 + 0.02, DOOR.x1 - 0.02]) box(WF, [0.05, 0.06, 0.07], [x, 1.98, FRONT - 0.05], M.black, 0.01); }
// a glimpse of the hall through the doorway
plane(WF, [DOOR.x1 - DOOR.x0, DOOR.y1], [(DOOR.x0 + DOOR.x1) / 2, DOOR.y1 / 2, FRONT + 0.4], std('#2a2420', 0.9), Math.PI);

// the door, open into the room against the right side
const door = new THREE.Group(); door.position.set(DOOR.x1 - 0.02, 0, FRONT - 0.02); door.rotation.y = -Math.PI / 2 - 0.12; room.add(door);
box(door, [DOOR.x1 - DOOR.x0 - 0.02, DOOR.y1 - 0.01, 0.04], [-(DOOR.x1 - DOOR.x0) / 2, (DOOR.y1 - 0.01) / 2, 0], M.door, 0.004);
for (const s of [-1, 1]) {
  sphere(door, 0.028, [-(DOOR.x1 - DOOR.x0) + 0.1, 1.0, s * 0.055], M.silver, 16);
  cyl(door, 0.01, 0.01, 0.03, [-(DOOR.x1 - DOOR.x0) + 0.1, 1.0, s * 0.032], M.silver, 10).rotation.x = Math.PI / 2;
}

// ---------------------------------------------------------------- lighting
const hemi = new THREE.HemisphereLight('#dfefff', '#d8cfc0', 0.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff3e0', 2.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -3.5; sun.shadow.camera.right = 3.5; sun.shadow.camera.top = 3.5; sun.shadow.camera.bottom = -3.5;
sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 14;
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
sun.target.position.set(0, 0.6, 0);
scene.add(sun, sun.target);
const ceiling = [0, 1, 2].map(() => new THREE.PointLight('#fff1dc', 0, 6, 1.6));
ceiling[0].position.set(-0.6, 2.62, -0.45); ceiling[1].position.set(0.9, 2.62, -0.6); ceiling[2].position.set(-0.3, 2.62, 0.9);
ceiling.forEach(l => room.add(l));
// recessed downlight discs on top of the walls are implied; show small glowing pucks above the room


// shadows everywhere except glass and screens
room.traverse(o => {
  if (!o.isMesh) return;
  const basic = o.material && o.material.isMeshBasicMaterial;
  o.castShadow = !basic && o !== floor;
  o.receiveShadow = !basic;
});

// ---------------------------------------------------------------- time of day
const C = (h) => new THREE.Color(h);
const SKY = { night: C('#0b1430'), dawn: C('#f2a97e'), day: C('#a9d6ff') };
const BG = { night: C('#0a0e16'), dawn: C('#2a2230'), day: C('#1a2430') };
let lightsOn = true, lightsAuto = true, followNow = true;
const tmpC = new THREE.Color();

function applyTime(h) {
  viewHour = h;
  // sun elevation: 0 at 6:00 and 18:00, 1 at noon
  const elev = Math.sin(((h - 6) / 12) * Math.PI);
  const day = THREE.MathUtils.clamp(elev * 1.8 + 0.1, 0, 1);
  const golden = THREE.MathUtils.clamp(1 - Math.abs(elev) * 3.2, 0, 1) * (elev > -0.25 ? 1 : 0);
  sun.position.set(-6, 0.6 + Math.max(elev, 0) * 5, 0.05 + (h - 12) * 0.35);
  sun.intensity = day * 3.2;
  sun.color.copy(C('#fff4e2')).lerp(C('#ff9a55'), golden);
  sun.visible = sun.intensity > 0.01;
  dayNow = day;
  hemi.color.copy(SKY.night).lerp(C('#dfefff'), day);
  glassMat.color.copy(SKY.night).lerp(SKY.day, day).lerp(SKY.dawn, golden * 0.8);
  tmpC.copy(BG.night).lerp(BG.day, day).lerp(BG.dawn, golden * 0.6);
  scene.background = tmpC.clone();
  renderer.setClearColor(tmpC);
  if (lightsAuto) setLights(day < 0.55, false); else updateAmbient();
  lanternRed.flame.visible = lanternWhite.flame.visible = day < 0.5;
  // clock hands
  const mins = (h % 12) * 60;
  hourHand.rotation.z = -(mins / 720) * Math.PI * 2;
  minHand.rotation.z = -((mins % 60) / 60) * Math.PI * 2;
  famHour.rotation.z = hourHand.rotation.z; famMin.rotation.z = minHand.rotation.z;
  document.getElementById('time-label').textContent = fmtTime(h) + (followNow ? ' now' : '');
  redraw(texLaptop);
}
let dayNow = 1;
function updateAmbient() {
  // ambient light comes from the window by day and from the ceiling lights when they are on
  const lit = lightsOn ? 1 : 0, night = 1 - dayNow;
  hemi.intensity = 0.03 + dayNow * 0.65 + lit * 0.14;
  scene.environmentIntensity = 0.03 + dayNow * 0.48 + lit * 0.14;
  screenGlow.intensity = 0.25 + night * (lit ? 0.9 : 2.2);
  wallGlow.intensity = 0.02 + night * 0.18;
}
function setLights(on, manual = true) {
  lightsOn = on;
  if (manual) lightsAuto = false;
  ceiling.forEach(l => { l.intensity = on ? 2.2 : 0; });
  rocker.rotation.z = on ? 0.25 : -0.25;
  updateAmbient();
  const b = document.getElementById('lights');
  b.setAttribute('aria-pressed', String(on));
  b.title = on ? 'Turn ceiling lights off' : 'Turn ceiling lights on';
}
const slider = document.getElementById('time-slider');
function localHour() { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
slider.addEventListener('input', () => { followNow = false; applyTime(parseFloat(slider.value)); });
document.getElementById('time-now').addEventListener('click', () => { followNow = true; slider.value = localHour(); applyTime(localHour()); });
document.getElementById('lights').addEventListener('click', () => setLights(!lightsOn));
setInterval(() => { if (followNow) { slider.value = localHour(); applyTime(localHour()); } }, 30000);

// ---------------------------------------------------------------- hotspot content
const latestLinks = POSTS.slice(0, 4).map(p => ({ label: p.title, href: p.href }));
hotspot(monL, { id: 'monL', label: 'Left monitor', kicker: 'monitor 1 · writing', title: 'Everything I’ve written',
  desc: 'Notes on search, algorithms, math and AI. This screen lists my newest posts, straight from the homepage data.',
  links: [...latestLinks, { label: 'All posts on the homepage', href: '/#work' }], face: [0.13, 0, 1] });
hotspot(monR, { id: 'monR', label: 'Right monitor', kicker: 'monitor 2 · day job', title: 'HNSW: how vector search works',
  desc: 'The screen runs a real greedy search on a small random graph: from the entry point, hop to whichever neighbour is closer to the query until none is. That is the bottom layer of HNSW.',
  links: [{ label: 'Read: HNSW explained', href: '/blog_posts/hnsw-explained.html' }, { label: 'Play: HNSW simulator', href: '/blog_posts/experiments/hnsw-simul/' }], face: [-0.13, 0, 1] });
hotspot(monS, { id: 'monS', label: 'Side monitor', kicker: 'monitor 3 · lab', title: 'Interactive experiments',
  desc: 'Small simulations I build to understand things: Monte Carlo darts, multi-agent patterns, text watermarks, weight-space programming.',
  links: [{ label: 'Multi-agent patterns', href: '/blog_posts/experiments/multi-agent-patterns/' }, { label: 'Monte Carlo simulator', href: '/blog_posts/experiments/monte-carlo/' },
    { label: 'textGrain watermark demo', href: '/blog_posts/experiments/textgrain-watermark/' }, { label: 'All experiments', href: '/#work' }], face: [-1, 0.1, 0.12] });
hotspot(laptop, { id: 'laptop', label: 'Laptop', kicker: 'laptop · about', title: 'Who sits here',
  desc: 'I’m Jaskamal Kainth, a search engineer at Samsung R&D Institute India. I work on product search used in 55+ markets: query understanding, retrieval and ranking. The laptop shows your local time.',
  links: [{ label: 'About me', href: '/' }], face: [-0.4, 0.5, 1] });
hotspot(wbBig, { id: 'wbBig', label: 'Whiteboard', kicker: 'whiteboard · algorithms', title: 'Bloom filters',
  desc: 'A bit array and k hash functions answer “have I seen this?” in constant time, never with a false negative.',
  links: [{ label: 'Read: Bloom filters explained', href: '/blog_posts/bloom_filters.html' }, { label: 'Play: Bloom filter demo', href: '/blog_posts/experiments/bloom-filter/index.html' }], face: [1, 0, 0.1] });
hotspot(wbSmall, { id: 'wbSmall', label: 'Small whiteboard', kicker: 'whiteboard · practice', title: 'Segment trees and DSU',
  desc: 'Competitive programming practice sets I keep coming back to, sorted from easy to hard.',
  links: [{ label: 'Segment tree problems', href: '/blog_posts/segment_tree_problems.html' }, { label: 'DSU (union-find) problems', href: '/blog_posts/DSU_problems.html' }], face: [0, 0, 1] });
hotspot(kb, { id: 'kb', label: 'Keyboard', kicker: 'keyboard · c++', title: 'C++ notes',
  desc: 'Short, example-first notes on templates, lambdas, constexpr and the STL, typed on this keyboard.',
  links: [{ label: 'Read: C++ notes', href: '/blog_posts/CppNotes.html' }], face: [0, 1.4, 1] });
hotspot(dice, { id: 'dice', label: 'Dice', kicker: 'dice · probability', title: 'Monte Carlo simulation',
  desc: 'Roll the dice thousands of times and count: that is how Monte Carlo answers probability questions that are hard to solve on paper.',
  links: [{ label: 'Read: Monte Carlo explained', href: '/blog_posts/monte-carlo-simulation-explained.html' }, { label: 'Play: Monte Carlo demo', href: '/blog_posts/experiments/monte-carlo/' }], face: [0.3, 0.6, 1], roll: true });
hotspot(bike, { id: 'bike', label: 'Toy bicycle', kicker: 'shelf · circles', title: 'Fourier epicycles',
  desc: 'Wheels on wheels: enough rotating circles, added together, can redraw any closed shape. That is the discrete Fourier transform.',
  links: [{ label: 'Play: Fourier epicycles', href: '/blog_posts/experiments/fourier-epicycles/index.html' }], face: [0, 0.2, 1] });
const musicData = { kicker: 'music', title: 'Music I love',
  desc: 'From Mohammed Rafi and Arijit Singh to The Beatles and Linkin Park: what I keep on repeat while I work.',
  links: [{ label: 'Read: Music I love', href: '/blog_posts/music.html' }] };
hotspot(posterEnd, { id: 'pEnd', label: 'In the End poster', ...musicData, face: [0, 0, 1] });
hotspot(posterBeatles, { id: 'pBeatles', label: 'The Beatles poster', ...musicData, face: [0, 0, 1] });
hotspot(phones, { id: 'phones', label: 'Headphones', ...musicData, face: [-0.3, 1, 0.8] });
hotspot(posterDPS, { id: 'pDPS', label: 'Dead Poets Society poster', kicker: 'poster · philosophy', title: 'Philosophy notes',
  desc: '25 thinkers across 2,500 years, from Socrates to cognitive science, each with a one-line answer to why humans do what they do.',
  links: [{ label: 'Philosophy timeline', href: '/blog_posts/philosophy-notes.html' }], face: [0, 0, 1] });
hotspot(posterWild, { id: 'pWild', label: 'Into the Wild poster', kicker: 'poster · essay', title: 'Why do we do what we do?',
  desc: 'An essay on what drives human action, from Plato and the Stoics to Nietzsche, Sartre and modern psychology.',
  links: [{ label: 'Read the essay', href: '/blog_posts/whatwedowhywedo.html' }], face: [0, 0, 1] });
hotspot(sarang, { id: 'sarang', label: '사랑 sign', kicker: 'shelf · 한국어', title: 'Korean learning notes',
  desc: '사랑 (sarang) means love. My notes from Sejong Korean levels 1 and 2: Hangul, pronunciation, numbers, grammar and a verb table.',
  links: [{ label: 'Read: Korean notes', href: '/blog_posts/korean-learning-notes.html' }], face: [-0.15, 0.1, 1] });
hotspot(snack, { id: 'snack', label: 'Snack box', kicker: 'desk · psychology', title: 'Emotions vs hunger',
  desc: 'Paul Ekman argued basic emotions can override even hunger: disgust makes a hungry person push this box away.',
  links: [{ label: 'Read: Ekman’s basic emotions', href: '/blog_posts/paul-ekman-basic-emotions-override-hunger.html' }], face: [0.2, 1, 1] });
hotspot(frames, { id: 'frames', label: 'Photo frames', kicker: 'wall · pixels', title: 'Pixelate your image',
  desc: 'Family photos, drawn here as pixel mosaics. My pixelate tool turns any picture into pixel art in the browser.',
  links: [{ label: 'Play: Pixelate your image', href: '/blog_posts/experiments/Pixelate/index.html' }], face: [0, -0.1, 1] });
const clockData = { kicker: 'clock · your time', title: 'The room keeps your time',
  desc: 'Both clocks, the laptop and the light through the window follow your local time. Use the slider at the top to scrub through the day, or flip the light switch by the door.',
  links: [] };
hotspot(clock, { id: 'clock', label: 'Clock', ...clockData, face: [-1, 0, 0] });
hotspot(famClock, { id: 'famClock', label: 'Family tree clock', ...clockData, face: [0, 0, -1] });
hotspot(books, { id: 'books', label: 'Books', kicker: 'bookshelf · philosophy', title: 'Philosophy and the big question',
  desc: 'The books on the cabinet are where my philosophy notes start: 25 thinkers across 2,500 years, and an essay on why we do what we do.',
  links: [{ label: 'Philosophy timeline', href: '/blog_posts/philosophy-notes.html' }, { label: 'Essay: Why do we do what we do?', href: '/blog_posts/whatwedowhywedo.html' }], face: [1, 0.35, 0] });
hotspot(desk2, { id: 'desk2', label: 'Second desk', kicker: 'desk 2 · standing desk', title: 'The other desk',
  desc: 'The other half of the room: a height-adjustable standing desk with a vertical monitor, a laptop on a stand, a pink desk mat, and a camel who supervises.',
  links: [], view: { pos: [-0.3, 1.75, 0.0], target: [-0.4, 1.0, 1.2] } });
hotspot(lightSwitch, { id: 'switch', label: 'Light switch', kicker: 'switch', title: 'Lights', desc: '', links: [], face: [-1, 0, 0.3], action: () => setLights(!lightsOn) });
hotspot(door, { id: 'door', label: 'Door', kicker: 'exit', title: 'Back to the homepage', desc: 'Leave the room and go to the main site.',
  links: [{ label: 'jaskamalkainth.github.io', href: '/' }], view: { pos: [0.2, 1.6, -0.2], target: [1.1, 1.1, 1.2] } });
hotspot(chair, { id: 'chair', label: 'Sit down', kicker: 'chair · first person', title: 'You’re in my seat',
  desc: 'This is roughly what I see every day. Drag to look around, or close this card to stand up.',
  links: [{ label: 'Start with the latest post', href: POSTS[0] ? POSTS[0].href : '/' }],
  view: { pos: [-0.33, 1.24, -0.12], target: [-0.36, 1.1, -1.4] } });

// ---------------------------------------------------------------- camera views
// preset views; every one starts outside the room and lets the wall in front fade away
const VIEWS = {
  room:   { target: [0.05, 0.75, 0.0],  dir: [0.62, 1.25, 1],    fit: [5.0, 4.2] },
  main:   { target: [0.0, 0.95, -0.95], pos: [0.25, 2.6, 1.4] },   // just inside the front wall, over the second desk
  second: { target: [-0.4, 0.95, 1.0],  dir: [-0.15, 1.0, -1],   fit: [3.4, 2.8] },
  top:    { target: [0, 0, 0],          dir: [0, 1, 0.1],        fit: [4.6, 4.4] },
};
let currentView = 'room';
function presetView(name) {
  const v = VIEWS[name];
  if (v.pos) {   // fixed camera; on narrow screens step back along the same line so both desks fit
    const target = new THREE.Vector3(...v.target), pos = new THREE.Vector3(...v.pos);
    if (camera.aspect < 0.8) pos.lerp(target, -0.4);
    return { pos, target };
  }
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camera.aspect);
  const [fw, fh] = v.fit;
  const fitW = ((camera.aspect < 0.8 ? fw * 1.1 : fw) / 2) / Math.tan(hfov / 2);
  const fitH = (fh / 2) / Math.tan(vfov / 2);
  const dist = Math.min(Math.max(fitW, fitH) * 1.02 + 0.6, 11.5);
  const target = new THREE.Vector3(...v.target);
  return { pos: target.clone().addScaledVector(new THREE.Vector3(...v.dir).normalize(), dist), target };
}
function homeView() { return presetView(currentView); }
function viewFor(id) {
  const { group, data } = hotspots[id];
  if (data.view) return { pos: new THREE.Vector3(...data.view.pos), target: new THREE.Vector3(...data.view.target) };
  const bb = new THREE.Box3().setFromObject(group);
  const c = bb.getCenter(new THREE.Vector3());
  const s = bb.getSize(new THREE.Vector3());
  const size = Math.max(s.x, s.y, s.z);
  const dir = new THREE.Vector3(...(data.face || [0, 0.3, 1])).normalize();
  const vfov = THREE.MathUtils.degToRad(camera.fov);
  const aspectFix = camera.aspect < 1 ? 1 / camera.aspect : 1;
  const dist = Math.max(0.42 * Math.min(aspectFix, 2.2), (size * 0.75 / Math.tan(vfov / 2)) * Math.min(aspectFix, 2.2) + 0.1);
  const pos = c.clone().addScaledVector(dir, dist);
  // keep the camera inside the room bounds (plus the open front)
  pos.x = THREE.MathUtils.clamp(pos.x, W0 + 0.15, W1 - 0.15);
  pos.z = THREE.MathUtils.clamp(pos.z, BACK + 0.15, FRONT - 0.15);
  pos.y = THREE.MathUtils.clamp(pos.y, 0.4, H + 3);
  // on phones, nudge the target up so the bottom card doesn't cover the object
  if (camera.aspect < 0.8) c.y -= dist * 0.1;
  return { pos, target: c };
}
let tween = null;
function flyTo({ pos, target }, ms = 950, done) {
  if (reduceMotion) ms = 0;
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), ms, done };
}
function stepTween(now) {
  if (!tween) return;
  const k = tween.ms ? Math.min(1, (now - tween.start) / tween.ms) : 1;
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(tween.p0, tween.p1, e);
  controls.target.lerpVectors(tween.t0, tween.t1, e);
  if (k >= 1) { const d = tween.done; tween = null; if (d) d(); }
}
function setOrbitForFocus(focused) {
  // let the camera look up a little while looking at an object up close
  controls.maxPolarAngle = focused ? 2.2 : 1.48;
}

// ---------------------------------------------------------------- picking
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tip = document.getElementById('tip');
let hovered = null, focusedId = null;
const pickables = [];
room.traverse(o => { if (o.isMesh) pickables.push(o); });
function shown(o) { for (; o; o = o.parent) if (!o.visible) return false; return true; }
function pick(clientX, clientY) {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(pickables, false).find(h => shown(h.object));
  return hit && hit.object.userData.hs ? hit.object.userData.hs : null;
}
function setGlow(id, on) {
  if (!id) return;
  hotspots[id].group.traverse(o => {
    if (o.isMesh && o.material && o.material.isMeshStandardMaterial && o.userData.baseEmissive) {
      if (on) { o.material.emissive.set('#3aa8ff'); o.material.emissiveIntensity = 0.35; }
      else { o.material.emissive.copy(o.userData.baseEmissive); o.material.emissiveIntensity = o.userData.baseEmissiveIntensity; }
    }
  });
}
const canHover = window.matchMedia('(hover: hover)').matches;
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!canHover || e.buttons) return;
  const id = pick(e.clientX, e.clientY);
  if (id !== hovered) { setGlow(hovered, false); setGlow(id, true); hovered = id; }
  stage.classList.toggle('hovering', !!id);
  if (id) {
    tip.textContent = hotspots[id].data.label;
    tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px';
    tip.classList.add('on');
  } else tip.classList.remove('on');
});
renderer.domElement.addEventListener('pointerleave', () => { setGlow(hovered, false); hovered = null; tip.classList.remove('on'); });

let downAt = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY, performance.now()]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downAt) return;
  const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
  const quick = performance.now() - downAt[2] < 500;
  downAt = null;
  if (moved > 6 || !quick) return;
  const id = pick(e.clientX, e.clientY);
  if (id) openHotspot(id); else if (focusedId) closeCard();
});

// ---------------------------------------------------------------- card
const card = document.getElementById('card');
let diceRoll = null;
function openHotspot(id) {
  const { data } = hotspots[id];
  if (data.action) { data.action(); return; }
  focusedId = id;
  document.getElementById('card-kicker').textContent = data.kicker || '';
  document.getElementById('card-title').textContent = data.title;
  const desc = document.getElementById('card-desc');
  desc.textContent = data.desc; desc.hidden = !data.desc;
  const ul = document.getElementById('card-links');
  ul.replaceChildren(...data.links.map(l => { const li = document.createElement('li'); const a = document.createElement('a'); a.href = l.href; a.textContent = l.label; li.append(a); return li; }));
  card.hidden = false; document.body.classList.add('card-open');
  setOrbitForFocus(true);
  flyTo(viewFor(id));
  if (data.roll && !reduceMotion) diceRoll = { start: performance.now(), from: diceMesh.rotation.clone(), turns: [Math.PI * 2 * (2 + Math.floor(Math.random() * 3)) + Math.floor(Math.random() * 4) * Math.PI / 2, Math.PI * 2 * 2 + Math.floor(Math.random() * 4) * Math.PI / 2] };
}
function closeCard() {
  focusedId = null;
  card.hidden = true; document.body.classList.remove('card-open');
  setOrbitForFocus(false);
  flyTo(homeView());
}
card.querySelector('.card-close').addEventListener('click', closeCard);
const viewBtns = [...document.querySelectorAll('[data-view]')];
function setView(name) {
  currentView = name;
  viewBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.view === name)));
  if (focusedId) { focusedId = null; card.hidden = true; document.body.classList.remove('card-open'); setOrbitForFocus(false); }
  flyTo(presetView(name), 1100);
}
viewBtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && focusedId) closeCard(); });

// ---------------------------------------------------------------- resize
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = camera.aspect < 0.8 ? 50 : 40;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  if (!focusedId && !tween) { const v = homeView(); camera.position.copy(v.pos); controls.target.copy(v.target); }
}
window.addEventListener('resize', onResize);

// ---------------------------------------------------------------- loop
let lastScreen = 0, lastBlink = 0;
const clockT = new THREE.Clock();
function frame(now) {
  stepTween(now);
  controls.update();
  // keep panning inside the room
  controls.target.x = THREE.MathUtils.clamp(controls.target.x, W0 + 0.1, W1 - 0.1);
  controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.2, H);
  controls.target.z = THREE.MathUtils.clamp(controls.target.z, BACK + 0.05, FRONT - 0.05);
  // dollhouse: hide whatever hangs on a wall while the camera is outside it
  const cp = camera.position;
  WB.visible = cp.z > BACK; WF.visible = cp.z < FRONT; WL.visible = cp.x > W0; WR.visible = cp.x < W1;

  if (!reduceMotion && now - lastScreen > 420) {   // HNSW screen: one hop at a time
    lastScreen = now;
    const s = hnsw.state;
    if (s.step < s.path.length - 1) s.step++;
    else if (++s.hold > 4) hnsw.newQuery();
    redraw(texMonR);
  }
  if (!reduceMotion && now - lastBlink > 530) { lastBlink = now; cursorOn = !cursorOn; redraw(texMonS); }
  if (diceRoll) {
    const k = Math.min(1, (now - diceRoll.start) / 900), e = 1 - Math.pow(1 - k, 3);
    diceMesh.rotation.x = diceRoll.from.x + diceRoll.turns[0] * e;
    diceMesh.rotation.z = diceRoll.from.z + diceRoll.turns[1] * e;
    diceMesh.position.y = Math.sin(k * Math.PI) * 0.05;
    if (k >= 1) diceRoll = null;
  }
  const t = clockT.getElapsedTime();
  if (!reduceMotion) plant.rotation.z = Math.sin(t * 0.6) * 0.012;
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- start
(async function start() {
  try { await Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]); } catch (e) { /* fonts optional */ }
  [texMonL, texMonR, texMonS, texLaptop].forEach(redraw);
  slider.value = localHour();
  applyTime(localHour());
  onResize();
  const home = homeView();
  if (reduceMotion) { camera.position.copy(home.pos); controls.target.copy(home.target); }
  else {
    camera.position.copy(home.target.clone().add(new THREE.Vector3(-2.2, 2.6, 7.5)));
    controls.target.copy(home.target);
    flyTo(home, 1700);
  }
  loadingEl.classList.add('done');
  requestAnimationFrame(frame);
  window.__desk = { scene, camera, controls, openHotspot, closeCard, applyTime, setLights, setView, hotspots: Object.keys(hotspots) };
}());
