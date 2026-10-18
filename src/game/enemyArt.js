// ---------------- Procedural cartoon art for dinosaurs & dragons ----------------
// All characters are drawn with vector paths so they scale crisply to any screen.
// Local coordinate system: feet at (0,0), facing RIGHT, ~110 units tall.
import { mix, TAU, hexToRgb } from './utils.js';

const ICE = '#cdefff';
const ICE_DEEP = '#7cc8f0';
const INK = '#2a1a4a';

function hslHex(h, s, l) {
  s /= 100; l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${to(f(0))}${to(f(8))}${to(f(4))}`;
}

// Bounding boxes used for the ice-block when fully frozen
export const SHAPE_BOX = {
  raptor: { x: -88, y: -118, w: 160, h: 122 },
  trex: { x: -92, y: -122, w: 175, h: 126 },
  trike: { x: -78, y: -92, w: 160, h: 96 },
  stego: { x: -92, y: -96, w: 170, h: 100 },
  ankylo: { x: -92, y: -66, w: 170, h: 70 },
  dragon: { x: -82, y: -128, w: 150, h: 110 },
};
// Where the glowing weak-point gem sits on bosses
export const WEAK_POINT = {
  raptor: [8, -42], trex: [8, -44], trike: [4, -38], stego: [4, -38], ankylo: [0, -30], dragon: [4, -46],
};
// Hit-circle centre (local) & radius
export const HIT_SHAPE = {
  raptor: { y: -60, r: 52 }, trex: { y: -62, r: 58 }, trike: { y: -45, r: 55 },
  stego: { y: -48, r: 58 }, ankylo: { y: -34, r: 55 }, dragon: { y: -70, r: 55 },
};

// Seeded crystal positions (local coords) per shape
const CRYSTAL_SPOTS = {
  raptor: [[-10, -62], [20, -95], [-40, -38], [10, -30], [35, -70], [-20, -45], [0, -72], [-60, -30]],
  trex: [[-10, -62], [25, -100], [-45, -40], [10, -28], [45, -78], [-20, -50], [0, -75], [-65, -30]],
  trike: [[-20, -58], [30, -62], [-40, -40], [0, -30], [50, -40], [10, -60], [-55, -30], [40, -78]],
  stego: [[-20, -62], [20, -60], [-45, -42], [0, -30], [50, -32], [-5, -78], [30, -75], [-65, -34]],
  ankylo: [[-20, -44], [20, -44], [-50, -30], [0, -50], [48, -28], [-35, -52], [30, -20], [-70, -24]],
  dragon: [[-10, -55], [25, -90], [-40, -95], [5, -35], [-55, -40], [40, -75], [-20, -110], [15, -60]],
};

function palette(type, f, flash, t, hueShift) {
  const c = type.colors;
  const iceT = Math.min(1, f) * 0.82;
  const out = {};
  for (const k in c) {
    let base = c[k];
    if (type.rainbow && (k === 'body' || k === 'wing')) base = hslHex((t * 70 + hueShift + (k === 'wing' ? 120 : 0)) % 360, 85, 66);
    let col = iceT > 0 ? mix(base, ICE, iceT) : base;
    if (flash > 0) col = mixRgbStr(col, '#ffffff', flash * 0.7);
    out[k] = col;
  }
  out.ink = f >= 1 ? 'rgba(70,140,200,0.95)' : mix(type.colors.body, INK, 0.72 - iceT * 0.2);
  return out;
}
function mixRgbStr(col, hex, t) {
  let r, g, b;
  if (col[0] === '#') [r, g, b] = hexToRgb(col);
  else [r, g, b] = col.match(/\d+/g).map(Number);
  const w = hexToRgb(hex);
  return `rgb(${Math.round(r + (w[0] - r) * t)},${Math.round(g + (w[1] - g) * t)},${Math.round(b + (w[2] - b) * t)})`;
}

const fs = (ctx, fill) => { ctx.fillStyle = fill; ctx.fill(); ctx.stroke(); };
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); };
const circ = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };

function gloss(ctx, x, y, rx, ry, a = 0.35) {
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ell(ctx, x, y, rx, ry, -0.4);
  ctx.fill();
  ctx.restore();
}

function face(ctx, p, x, y, r, e, extraEye = false) {
  // big shiny cartoon eye + blush + mouth.  Expression changes with freeze.
  const f = e.freezeFrac;
  const blink = !e.frozen && (Math.sin(e.blinkT) > 0.985);
  ctx.save();
  ctx.lineWidth = 3;
  // eye white
  circ(ctx, x, y, r);
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = p.ink; ctx.stroke();
  if (blink) {
    ctx.fillStyle = p.body; circ(ctx, x, y, r); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - r * 0.7, y); ctx.quadraticCurveTo(x, y + r * 0.5, x + r * 0.7, y); ctx.stroke();
  } else {
    const shake = f > 0.4 && !e.frozen ? Math.sin(e.t * 40) * 1.2 : 0;
    const pr = r * (e.frozen ? 0.42 : 0.56);
    ctx.fillStyle = e.frozen ? '#3a6f9a' : '#1d1b3a';
    circ(ctx, x + r * 0.22 + shake, y + r * 0.05, pr); ctx.fill();
    ctx.fillStyle = '#fff';
    circ(ctx, x + r * 0.38 + shake, y - r * 0.22, pr * 0.42); ctx.fill();
    circ(ctx, x + r * 0.08 + shake, y + r * 0.3, pr * 0.2); ctx.fill();
  }
  if (extraEye) { /* reserved for 2-eye front views */ }
  // blush
  ctx.fillStyle = f >= 1 ? 'rgba(150,200,255,0.5)' : 'rgba(255,110,150,0.45)';
  ell(ctx, x + r * 0.9, y + r * 1.25, r * 0.55, r * 0.32); ctx.fill();
  // mouth
  ctx.strokeStyle = p.ink; ctx.lineWidth = 3; ctx.lineCap = 'round';
  const mx = x + r * 1.5, my = y + r * 1.5;
  ctx.beginPath();
  if (e.frozen) { ell(ctx, mx, my, r * 0.28, r * 0.36); ctx.fillStyle = '#3d6f99'; ctx.fill(); ctx.stroke(); }
  else if (f > 0.45) { // shivering wavy "brrr" mouth
    ctx.moveTo(mx - r * 0.5, my);
    for (let i = 1; i <= 4; i++) ctx.lineTo(mx - r * 0.5 + i * r * 0.25, my + (i % 2 ? -3 : 3));
    ctx.stroke();
  } else if (e.hitFlash > 0) { ell(ctx, mx, my, r * 0.3, r * 0.25); ctx.fillStyle = '#ff6f91'; ctx.fill(); ctx.stroke(); }
  else { ctx.arc(mx - r * 0.2, my - r * 0.35, r * 0.55, 0.25 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  ctx.restore();
}

// ---------------- Bipeds: raptor / t-rex ----------------
function drawBiped(ctx, e, p, isRex) {
  const ph = e.anim;
  const step = Math.sin(ph), step2 = Math.sin(ph + Math.PI);
  const bob = Math.abs(Math.cos(ph)) * 3;
  const wag = Math.sin(ph * 0.5 + e.t * 2) * 7;
  ctx.lineWidth = 4; ctx.strokeStyle = p.ink; ctx.lineJoin = 'round';
  // back leg
  legBiped(ctx, p, -6 + step2 * 9, Math.max(0, step2) * 7, true);
  // tail
  ctx.beginPath();
  ctx.moveTo(-18, -62 - bob);
  ctx.quadraticCurveTo(-60, -58 + wag * 0.4, -86, -36 + wag);
  ctx.quadraticCurveTo(-58, -34 + wag * 0.5, -16, -36 - bob);
  ctx.closePath(); fs(ctx, p.body);
  // body
  ctx.save(); ctx.translate(0, -bob);
  ell(ctx, 0, -48, 36, 30, -0.2); fs(ctx, p.body);
  ell(ctx, 10, -42, 22, 20, -0.2); ctx.fillStyle = p.belly; ctx.fill();
  ctx.fillStyle = p.spot; circ(ctx, -14, -64, 5); ctx.fill(); circ(ctx, -2, -70, 4); ctx.fill(); circ(ctx, -26, -54, 3.5); ctx.fill();
  gloss(ctx, -8, -64, 14, 7);
  // back spikes
  ctx.fillStyle = p.accent;
  for (let i = 0; i < 4; i++) {
    const sx = -30 + i * 13, sy = -66 - (i === 1 || i === 2 ? 8 : 2);
    ctx.beginPath(); ctx.moveTo(sx - 6, sy + 6); ctx.lineTo(sx, sy - 6); ctx.lineTo(sx + 6, sy + 6); ctx.closePath(); fs(ctx, p.accent);
  }
  // arm
  ctx.save(); ctx.translate(26, -50); ctx.rotate(0.6 + Math.sin(ph * 2) * 0.25);
  ell(ctx, 6, 0, 10, 5); fs(ctx, p.body); ctx.restore();
  // head
  const hx = isRex ? 34 : 30, hy = isRex ? -84 : -86, hr = isRex ? 30 : 25;
  ell(ctx, hx, hy, hr, hr * 0.92); fs(ctx, p.body);
  ell(ctx, hx + hr * 0.75, hy + hr * 0.25, hr * 0.7, hr * 0.5); fs(ctx, p.body); // snout
  ctx.fillStyle = p.body; ell(ctx, hx + hr * 0.3, hy + hr * 0.15, hr * 0.6, hr * 0.5); ctx.fill(); // hide seam
  gloss(ctx, hx - hr * 0.3, hy - hr * 0.5, hr * 0.4, hr * 0.2, 0.45);
  ctx.fillStyle = p.ink; circ(ctx, hx + hr * 1.3, hy + hr * 0.08, 2.2); ctx.fill(); // nostril
  if (isRex) { ctx.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); const tx = hx + hr * 0.8 + i * 7; ctx.moveTo(tx, hy + hr * 0.62); ctx.lineTo(tx + 3, hy + hr * 0.85); ctx.lineTo(tx + 6, hy + hr * 0.62); ctx.fill(); } }
  face(ctx, p, hx + hr * 0.2, hy - hr * 0.2, hr * 0.38, e);
  ctx.restore();
  // front leg
  legBiped(ctx, p, 10 + step * 9, Math.max(0, step) * 7, false);
}
function legBiped(ctx, p, x, lift, back) {
  ctx.save();
  if (back) ctx.globalAlpha *= 0.92;
  ell(ctx, x, -26 - lift * 0.5, 12, 15); fs(ctx, back ? p.accent : p.body);
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 6, -18 - lift, 12, 18, 5) : ctx.rect(x - 6, -18 - lift, 12, 18); fs(ctx, back ? p.accent : p.body);
  ell(ctx, x + 5, -2 - lift, 11, 5); fs(ctx, p.belly);
  ctx.restore();
}

// ---------------- Quadrupeds: trike / stego / ankylo ----------------
function legsQuad(ctx, p, ph, xs, h) {
  xs.forEach((x, i) => {
    const s = Math.sin(ph + (i % 2 ? Math.PI : 0));
    const lift = Math.max(0, s) * 6;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - 9 + s * 4, -h - lift, 18, h, 7); else ctx.rect(x - 9, -h - lift, 18, h);
    fs(ctx, i < 2 ? p.accent2 || p.body : p.body);
    ell(ctx, x + s * 4, -2 - lift, 11, 4.5); ctx.fillStyle = p.belly; ctx.fill(); ctx.stroke();
  });
}
function drawTrike(ctx, e, p) {
  const ph = e.anim, bob = Math.abs(Math.cos(ph)) * 2;
  ctx.lineWidth = 4; ctx.strokeStyle = p.ink; ctx.lineJoin = 'round';
  legsQuad(ctx, p, ph, [-30, 18], 26);
  ctx.save(); ctx.translate(0, -bob);
  ctx.beginPath(); ctx.moveTo(-36, -42); ctx.quadraticCurveTo(-66, -36, -76, -22); ctx.quadraticCurveTo(-56, -26, -34, -26); ctx.closePath(); fs(ctx, p.body);
  ell(ctx, -4, -44, 46, 27); fs(ctx, p.body);
  ell(ctx, 0, -34, 32, 13); ctx.fillStyle = p.belly; ctx.fill();
  ctx.fillStyle = p.spot; [[-20, -58], [-2, -64], [-30, -46]].forEach(([x, y]) => { circ(ctx, x, y, 5); ctx.fill(); });
  gloss(ctx, -14, -60, 18, 7);
  // frill
  ell(ctx, 38, -56, 30, 32); fs(ctx, p.accent);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = 0; i < 5; i++) { const a = -2.4 + i * 0.55; circ(ctx, 38 + Math.cos(a) * 22, -56 + Math.sin(a) * 24, 4); ctx.fill(); }
  // head
  ell(ctx, 52, -40, 24, 21); fs(ctx, p.body);
  ell(ctx, 70, -34, 14, 12); fs(ctx, p.body);
  ctx.fillStyle = p.body; ell(ctx, 60, -37, 14, 12); ctx.fill();
  // horns
  ctx.fillStyle = '#fff6dc';
  [[44, -60, -0.3], [58, -62, 0.2]].forEach(([x, y, r]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-5, 4); ctx.quadraticCurveTo(4, -10, 14, -22); ctx.quadraticCurveTo(8, -6, 6, 4); ctx.closePath(); fs(ctx, '#fff6dc'); ctx.restore(); });
  ctx.beginPath(); ctx.moveTo(74, -44); ctx.lineTo(84, -56); ctx.lineTo(80, -40); ctx.closePath(); fs(ctx, '#fff6dc');
  gloss(ctx, 46, -52, 9, 5, 0.45);
  face(ctx, p, 54, -46, 9, e);
  ctx.restore();
  legsQuad(ctx, p, ph + 0.6, [-14, 32], 24);
}
function drawStego(ctx, e, p) {
  const ph = e.anim, bob = Math.abs(Math.cos(ph)) * 2;
  const wag = Math.sin(e.t * 3) * 5;
  ctx.lineWidth = 4; ctx.strokeStyle = p.ink; ctx.lineJoin = 'round';
  legsQuad(ctx, p, ph, [-30, 16], 28);
  ctx.save(); ctx.translate(0, -bob);
  // tail w/ spikes
  ctx.beginPath(); ctx.moveTo(-38, -50); ctx.quadraticCurveTo(-70, -44 + wag, -88, -30 + wag); ctx.quadraticCurveTo(-64, -30, -36, -30); ctx.closePath(); fs(ctx, p.body);
  [[-74, -40], [-84, -36]].forEach(([x, y]) => { ctx.beginPath(); ctx.moveTo(x - 3, y + wag); ctx.lineTo(x - 8, y - 14 + wag); ctx.lineTo(x + 4, y + wag); ctx.closePath(); fs(ctx, '#fff6dc'); });
  // plates
  for (let i = 0; i < 5; i++) {
    const x = -34 + i * 15, h = [16, 24, 28, 24, 16][i], y = -66 - Math.sin((i / 4) * Math.PI) * 6;
    ctx.beginPath(); ctx.moveTo(x - 9, y + 8); ctx.quadraticCurveTo(x - 6, y - h, x, y - h - 2); ctx.quadraticCurveTo(x + 6, y - h, x + 9, y + 8); ctx.closePath(); fs(ctx, p.accent);
  }
  ell(ctx, -4, -46, 46, 26); fs(ctx, p.body);
  ell(ctx, 0, -36, 32, 12); ctx.fillStyle = p.belly; ctx.fill();
  ctx.fillStyle = p.spot; [[-20, -56], [0, -60], [16, -52]].forEach(([x, y]) => { circ(ctx, x, y, 4.5); ctx.fill(); });
  gloss(ctx, -12, -60, 18, 6);
  // neck + head
  ctx.beginPath(); ctx.moveTo(30, -56); ctx.quadraticCurveTo(48, -50, 54, -38); ctx.lineTo(36, -30); ctx.closePath(); fs(ctx, p.body);
  ell(ctx, 56, -38, 17, 14); fs(ctx, p.body);
  gloss(ctx, 52, -46, 6, 3, 0.45);
  face(ctx, p, 56, -42, 7, e);
  ctx.restore();
  legsQuad(ctx, p, ph + 0.6, [-14, 30], 26);
}
function drawAnkylo(ctx, e, p) {
  const ph = e.anim, bob = Math.abs(Math.cos(ph)) * 1.5;
  const swing = Math.sin(e.t * 3) * 6;
  ctx.lineWidth = 4; ctx.strokeStyle = p.ink; ctx.lineJoin = 'round';
  legsQuad(ctx, p, ph, [-30, 20], 18);
  ctx.save(); ctx.translate(0, -bob);
  ctx.beginPath(); ctx.moveTo(-40, -34); ctx.quadraticCurveTo(-64, -30 + swing, -74, -24 + swing); ctx.lineTo(-40, -22); ctx.closePath(); fs(ctx, p.body);
  circ(ctx, -76, -24 + swing, 11); fs(ctx, p.accent);
  ell(ctx, -2, -32, 50, 22); fs(ctx, p.body);
  ell(ctx, 0, -22, 38, 8); ctx.fillStyle = p.belly; ctx.fill();
  // armor studs
  for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) {
    const x = -38 + i * 15 + j * 7, y = -42 - j * 10 + Math.abs(i - 2.5) * 2;
    circ(ctx, x, y, 5.5); fs(ctx, p.spot);
  }
  gloss(ctx, -12, -46, 18, 5);
  ell(ctx, 50, -26, 18, 13); fs(ctx, p.body);
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.moveTo(38, -36); ctx.lineTo(42, -46); ctx.lineTo(48, -36); ctx.closePath(); fs(ctx, p.accent);
  face(ctx, p, 52, -30, 6.5, e);
  ctx.restore();
  legsQuad(ctx, p, ph + 0.6, [-14, 34], 16);
}

// ---------------- Dragon ----------------
function wing(ctx, p, flap, back) {
  ctx.save();
  ctx.scale(1, flap);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-10, -50, -40, -62);
  ctx.quadraticCurveTo(-46, -40, -62, -38);
  ctx.quadraticCurveTo(-56, -22, -66, -10);
  ctx.quadraticCurveTo(-36, -12, -6, 10);
  ctx.closePath();
  fs(ctx, back ? mixDark(p.wing) : p.wing);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-40, -58); ctx.moveTo(-4, 2); ctx.lineTo(-60, -36); ctx.moveTo(-4, 4); ctx.lineTo(-62, -12); ctx.stroke();
  ctx.restore();
}
const darkCache = new Map();
function mixDark(col) {
  let v = darkCache.get(col);
  if (!v) { v = mixRgbStr(col, '#3a2a6a', 0.3); if (darkCache.size > 400) darkCache.clear(); darkCache.set(col, v); }
  return v;
}
function drawDragon(ctx, e, p) {
  const flapSpeed = e.frozen ? 0 : 1;
  const fl = Math.sin(e.anim * 1.6 * flapSpeed);
  const flap = e.frozen ? 0.7 : 0.35 + (fl * 0.5 + 0.5) * 0.75;
  const bob = e.frozen ? 0 : fl * 4;
  const wag = Math.sin(e.t * 2.5) * 8;
  ctx.lineWidth = 4; ctx.strokeStyle = p.ink; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(0, -bob);
  // back wing
  ctx.save(); ctx.translate(4, -70); ctx.rotate(-0.2); wing(ctx, p, flap, true); ctx.restore();
  ctx.lineWidth = 4; ctx.strokeStyle = p.ink;
  // tail
  ctx.beginPath(); ctx.moveTo(-20, -58); ctx.quadraticCurveTo(-50, -40 + wag * 0.5, -70, -46 + wag); ctx.quadraticCurveTo(-48, -32 + wag * 0.4, -16, -38); ctx.closePath(); fs(ctx, p.body);
  ctx.save(); ctx.translate(-72, -46 + wag); ctx.rotate(-0.5);
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-14, 0); ctx.lineTo(0, 9); ctx.lineTo(4, 0); ctx.closePath(); fs(ctx, p.accent); ctx.restore();
  // feet
  [[-8, -30], [12, -30]].forEach(([x, y], i) => { ell(ctx, x, y + (i ? fl : -fl) * 2, 7, 9); fs(ctx, p.body); ell(ctx, x + 3, y + 8 + (i ? fl : -fl) * 2, 7, 4); fs(ctx, p.belly); });
  // body
  ell(ctx, 0, -54, 30, 27); fs(ctx, p.body);
  ell(ctx, 8, -48, 18, 20, -0.2); ctx.fillStyle = p.belly; ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-2, -60 + i * 9); ctx.quadraticCurveTo(8, -56 + i * 9, 20, -60 + i * 9); ctx.stroke(); }
  ctx.strokeStyle = p.ink; ctx.lineWidth = 4;
  gloss(ctx, -10, -70, 12, 6);
  // back spikes
  for (let i = 0; i < 3; i++) { const sx = -22 + i * 11, sy = -78 + i * 2; ctx.beginPath(); ctx.moveTo(sx - 5, sy + 5); ctx.lineTo(sx, sy - 7); ctx.lineTo(sx + 5, sy + 5); ctx.closePath(); fs(ctx, p.accent); }
  // head
  const hx = 28, hy = -86;
  [[18, -104, -0.5], [32, -108, 0.1]].forEach(([x, y, r]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.beginPath(); ctx.moveTo(-5, 6); ctx.quadraticCurveTo(-2, -8, 4, -14); ctx.quadraticCurveTo(6, -2, 6, 6); ctx.closePath(); fs(ctx, p.accent); ctx.restore(); });
  circ(ctx, hx, hy, 24); fs(ctx, p.body);
  ell(ctx, hx + 20, hy + 8, 15, 12); fs(ctx, p.body);
  ctx.fillStyle = p.body; ell(ctx, hx + 8, hy + 6, 14, 12); ctx.fill();
  ctx.fillStyle = p.ink; circ(ctx, hx + 30, hy + 4, 2); ctx.fill();
  gloss(ctx, hx - 8, hy - 12, 9, 5, 0.45);
  face(ctx, p, hx + 4, hy - 4, 9.5, e);
  // front wing
  ctx.save(); ctx.translate(-2, -68); ctx.rotate(0.1); wing(ctx, p, flap * 0.95, false); ctx.restore();
  ctx.restore();
}

// ---------------- Freeze overlays ----------------
function crystals(ctx, shape, f, t) {
  const spots = CRYSTAL_SPOTS[shape];
  const n = Math.min(spots.length, Math.floor(f * spots.length * 1.15));
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  for (let i = 0; i < n; i++) {
    const [x, y] = spots[i];
    const s = 6 + (i % 3) * 2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(i * 1.3);
    for (let k = 0; k < 3; k++) {
      ctx.rotate(TAU / 3);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 0.35, -s * 0.5); ctx.lineTo(0, -s * 1.4); ctx.lineTo(-s * 0.35, -s * 0.5); ctx.closePath();
      ctx.fillStyle = 'rgba(200,240,255,0.9)'; ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

function iceBlock(ctx, shape, e, t) {
  const b = SHAPE_BOX[shape];
  const pad = 8;
  ctx.save();
  const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h);
  g.addColorStop(0, 'rgba(230,250,255,0.55)');
  g.addColorStop(0.5, 'rgba(150,215,255,0.28)');
  g.addColorStop(1, 'rgba(110,190,255,0.5)');
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 3;
  // faceted ice shape
  const x0 = b.x - pad, y0 = b.y - pad, x1 = b.x + b.w + pad, y1 = b.y + b.h + 2;
  ctx.beginPath();
  ctx.moveTo(x0 + 18, y0); ctx.lineTo(x1 - 26, y0 + 6); ctx.lineTo(x1, y0 + 30); ctx.lineTo(x1 - 6, y1);
  ctx.lineTo(x0 + 10, y1); ctx.lineTo(x0, y0 + 40); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // shine streaks
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0 + 22, y0 + 18); ctx.lineTo(x0 + 48, y0 + 8); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x0 + 18, y0 + 34); ctx.lineTo(x0 + 34, y0 + 26); ctx.stroke();
  // moving glint
  const gx = x0 + ((t * 120) % (b.w + 80)) - 20;
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath(); ctx.moveTo(gx, y0); ctx.lineTo(gx + 18, y0); ctx.lineTo(gx - 22, y1); ctx.lineTo(gx - 40, y1); ctx.closePath(); ctx.fill();
  ctx.restore();
  // cracks grow just before shattering
  if (e.crack > 0) {
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.5;
    const cx = b.x + b.w * 0.5, cy = b.y + b.h * 0.5;
    const n = Math.floor(e.crack * 9);
    for (let i = 0; i < n; i++) {
      const a = i * 2.39 + 0.4, len = 30 + (i % 3) * 22;
      ctx.beginPath(); ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * len * 0.5 + 6, cy + Math.sin(a) * len * 0.5 - 4);
      ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** Draw enemy at origin (feet). Caller handles translate/scale/flip. */
export function drawEnemy(ctx, e, t) {
  const type = e.type;
  const f = e.freezeFrac;
  const p = palette(type, f, e.hitFlash, t, e.hue);
  p.accent2 = p.body;
  const shape = type.shape;
  // frozen-aura glow
  if (f > 0.25) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, f) * 0.5;
    const hs = HIT_SHAPE[shape];
    const g = ctx.createRadialGradient(0, hs.y, 5, 0, hs.y, hs.r * 1.5);
    g.addColorStop(0, 'rgba(160,230,255,0.9)'); g.addColorStop(1, 'rgba(160,230,255,0)');
    ctx.fillStyle = g; circ(ctx, 0, hs.y, hs.r * 1.5); ctx.fill();
    ctx.restore();
  }
  ctx.save();
  if (e.frozen) ctx.globalAlpha *= 0.9;
  switch (shape) {
    case 'raptor': drawBiped(ctx, e, p, false); break;
    case 'trex': drawBiped(ctx, e, p, true); break;
    case 'trike': drawTrike(ctx, e, p); break;
    case 'stego': drawStego(ctx, e, p); break;
    case 'ankylo': drawAnkylo(ctx, e, p); break;
    default: drawDragon(ctx, e, p);
  }
  ctx.restore();
  if (f > 0.15) crystals(ctx, shape, f, t);
  if (e.frozen) iceBlock(ctx, shape, e, t);
}

export { ICE, ICE_DEEP };
