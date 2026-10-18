// ---------------- Procedural parallax backgrounds for the 5 worlds ----------------
import { seeded, rand, TAU } from './utils.js';

export const HORIZON = 0.4; // horizon line as fraction of screen height
const M = 70; // parallax margin (px each side)

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}
function vgrad(ctx, y0, y1, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach((s, i) => g.addColorStop(i / (stops.length - 1), s));
  return g;
}

const THEMES = {
  valley: {
    sky: ['#3fb8ff', '#8fdcff', '#d9f7ff'], sun: '#fff6a8', far: ['#7cc7b8', '#a6dccf'], hill: ['#5fc76a', '#3fae55'],
    ground: ['#86dc6c', '#57c25a', '#3a9f47'], path: '#f1dc9f', trees: 'palm', ambient: 'leaves', clouds: true,
  },
  frozen: {
    sky: ['#6a9dff', '#9fc4ff', '#eaf4ff'], sun: '#ffffff', far: ['#ffffff', '#c3daf7'], hill: ['#e9f4ff', '#bcd8f5'],
    ground: ['#f5fbff', '#ddeefd', '#bcdaf6'], path: '#bfe6ff', trees: 'pine', ambient: 'snow', clouds: true, snowCaps: true,
  },
  kingdom: {
    sky: ['#ff8fcf', '#ffb8d9', '#ffe6b5'], sun: '#fff1c1', far: ['#c9a2ff', '#e2c9ff'], hill: ['#9be38a', '#6ccf7b'],
    ground: ['#a7eb8c', '#78d27d', '#58b56f'], path: '#ffecb0', trees: 'lolly', ambient: 'sparkle', clouds: true, castle: true, rainbow: true,
  },
  lava: {
    sky: ['#ff9a5a', '#ffbf7a', '#ffe7b8'], sun: '#fff2b0', far: ['#a8644c', '#c98262'], hill: ['#b9774f', '#9c5f3e'],
    ground: ['#d39a6a', '#b77a50', '#8f5a3a'], path: '#ecc394', trees: 'palm', ambient: 'embers', volcano: true, lavaRivers: true,
  },
  cave: {
    sky: ['#1a1240', '#2d1f66', '#4a338f'], sun: null, far: ['#3a2a7a', '#4d3a96'], hill: ['#3b2b80', '#2f2168'],
    ground: ['#46338c', '#33246c', '#22174c'], path: '#6a54c0', trees: 'crystal', ambient: 'motes', stalactites: true,
  },
};

export class Background {
  constructor(levelId) {
    this.id = levelId;
    this.th = THEMES[levelId] || THEMES.valley;
    this.clouds = [];
    this.ambient = [];
    this.glows = [];
    this.smoke = [];
    this.W = 0; this.H = 0;
  }

  resize(W, H, quality = 1) {
    if (W === this.W && H === this.H) return;
    this.W = W; this.H = H;
    this.hy = H * HORIZON;
    this.quality = quality;
    this.build();
    this.clouds = [];
    if (this.th.clouds) for (let i = 0; i < 6; i++) this.clouds.push({ x: rand(-100, W + 100), y: rand(30, this.hy * 0.6), s: rand(0.6, 1.3), v: rand(6, 16) });
    const n = Math.round((this.th.ambient === 'snow' ? 90 : 45) * quality);
    this.ambient = [];
    for (let i = 0; i < n; i++) this.ambient.push(this.newAmbient(true));
  }

  build() {
    const { W, H, hy, th } = this;
    const rng = seeded(this.id.length * 977 + this.id.charCodeAt(0) * 31);
    const LW = W + M * 2;

    // ---- SKY (static) ----
    this.sky = mk(W, hy + 40);
    let c = this.sky.getContext('2d');
    c.fillStyle = vgrad(c, 0, hy + 40, th.sky); c.fillRect(0, 0, W, hy + 40);
    if (th.sun) {
      const sx = W * 0.8, sy = hy * 0.32;
      const g = c.createRadialGradient(sx, sy, 10, sx, sy, 180);
      g.addColorStop(0, 'rgba(255,255,230,0.9)'); g.addColorStop(0.25, 'rgba(255,250,200,0.45)'); g.addColorStop(1, 'rgba(255,250,200,0)');
      c.fillStyle = g; c.fillRect(sx - 200, sy - 200, 400, 400);
      c.fillStyle = th.sun; c.beginPath(); c.arc(sx, sy, 46, 0, TAU); c.fill();
    }
    if (th.rainbow) {
      const cols = ['#ff6b6b', '#ffb84d', '#ffe66d', '#7ee081', '#5ec8ff', '#a78bfa'];
      c.lineWidth = 14; c.globalAlpha = 0.35;
      cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(W * 0.3, hy + 60, 330 - i * 14, Math.PI, TAU); c.stroke(); });
      c.globalAlpha = 1;
    }
    if (th.stalactites) {
      c.fillStyle = '#120b2e';
      for (let x = -20; x < W + 20; x += 24 + rng() * 40) {
        const h = 30 + rng() * 110, w = 20 + rng() * 30;
        c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + w * 0.5, h * 0.4, x + w * 0.5, h); c.quadraticCurveTo(x + w * 0.5, h * 0.4, x + w, 0); c.fill();
      }
      for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(200,180,255,${0.2 + rng() * 0.5})`; c.beginPath(); c.arc(rng() * W, 40 + rng() * hy * 0.8, rng() * 1.8 + 0.5, 0, TAU); c.fill(); }
    }

    // ---- FAR layer ----
    this.far = mk(LW, hy + 20);
    c = this.far.getContext('2d');
    if (th.castle) this.drawCastle(c, LW, hy, rng);
    this.mountains(c, LW, hy + 10, hy * 0.55, th.far, rng, th.snowCaps || this.id === 'valley');
    if (th.volcano) this.drawVolcano(c, LW * 0.62, hy + 10, hy * 0.75);
    if (th.trees === 'crystal') for (let i = 0; i < 9; i++) this.crystalCluster(c, rng() * LW, hy + 10, 0.8 + rng() * 1.2, rng() > 0.5 ? '#6ff3ff' : '#ff8ff0', rng, 0.6);

    // ---- MID layer (hills + trees) ----
    this.mid = mk(LW, hy + 60);
    c = this.mid.getContext('2d');
    c.fillStyle = vgrad(c, hy - 50, hy + 60, th.hill);
    c.beginPath(); c.moveTo(0, hy + 60);
    for (let x = 0; x <= LW; x += 20) c.lineTo(x, hy - 18 - Math.sin(x * 0.008 + 1) * 16 - Math.sin(x * 0.021) * 8);
    c.lineTo(LW, hy + 60); c.closePath(); c.fill();
    const nT = Math.round(LW / 70);
    const treeSpots = [];
    for (let i = 0; i < nT; i++) treeSpots.push([i * 70 + rng() * 50, rng()]);
    treeSpots.forEach(([x, r]) => {
      const y = hy - 10 - Math.sin(x * 0.008 + 1) * 16;
      const s = 0.55 + r * 0.6;
      if (th.trees === 'palm') this.palm(c, x, y, s, rng);
      else if (th.trees === 'pine') this.pine(c, x, y, s);
      else if (th.trees === 'lolly') this.lolly(c, x, y, s, rng);
      else if (th.trees === 'crystal' && r > 0.4) this.crystalCluster(c, x, y + 8, s, r > 0.7 ? '#7ef9ff' : '#ff9cf3', rng, 1);
    });

    // ---- GROUND ----
    this.ground = mk(LW, H - hy + 10);
    c = this.ground.getContext('2d');
    const gh = H - hy + 10;
    c.fillStyle = vgrad(c, 0, gh, th.ground); c.fillRect(0, 0, LW, gh);
    // perspective path
    const cx = LW / 2;
    c.fillStyle = th.path; c.globalAlpha = 0.55;
    c.beginPath(); c.moveTo(cx - 40, 0); c.lineTo(cx + 40, 0); c.lineTo(cx + LW * 0.36, gh); c.lineTo(cx - LW * 0.36, gh); c.closePath(); c.fill();
    c.globalAlpha = 1;
    // depth stripes
    for (let i = 1; i < 14; i++) {
      const t = i / 14, y = t * t * gh;
      c.fillStyle = `rgba(255,255,255,${0.05 + t * 0.05})`;
      c.fillRect(0, y, LW, 2 + t * 6);
    }
    // converging lines
    c.strokeStyle = 'rgba(0,0,0,0.05)'; c.lineWidth = 2;
    for (let i = -8; i <= 8; i++) { c.beginPath(); c.moveTo(cx + i * 30, 0); c.lineTo(cx + i * LW * 0.18, gh); c.stroke(); }
    if (th.lavaRivers) {
      for (let k = 0; k < 2; k++) {
        const side = k ? 1 : -1;
        c.strokeStyle = '#ff7a2f'; c.lineWidth = 18; c.lineCap = 'round';
        c.shadowColor = '#ffb347'; c.shadowBlur = 25;
        c.beginPath(); c.moveTo(cx + side * 120, 0);
        c.bezierCurveTo(cx + side * 260, gh * 0.3, cx + side * 140, gh * 0.6, cx + side * LW * 0.45, gh);
        c.stroke();
        c.strokeStyle = '#ffd36b'; c.lineWidth = 6; c.stroke();
        c.shadowBlur = 0;
      }
    }
    // decorations: flowers / rocks / snow mounds / gems
    for (let i = 0; i < 70; i++) {
      const t = rng(), y = t * t * gh, x = rng() * LW;
      if (Math.abs(x - cx) < 60 + t * LW * 0.3) continue;
      const s = 0.3 + t * 1.3;
      this.decor(c, x, y, s, rng);
    }

    // glowing spots for cave/lava (animated later)
    this.glows = [];
    if (this.id === 'cave') for (let i = 0; i < 10; i++) this.glows.push({ x: rng() * W, y: hy + rng() * (H - hy) * 0.8, r: 40 + rng() * 70, col: rng() > 0.5 ? '120,240,255' : '255,140,240', ph: rng() * 6 });
    if (this.id === 'lava') for (let i = 0; i < 6; i++) this.glows.push({ x: rng() * W, y: hy + 20 + rng() * (H - hy) * 0.7, r: 50 + rng() * 60, col: '255,150,60', ph: rng() * 6 });
  }

  // ---------- drawing helpers ----------
  mountains(c, LW, baseY, h, cols, rng, caps) {
    for (let layer = 0; layer < 2; layer++) {
      c.fillStyle = vgrad(c, baseY - h, baseY, layer ? [cols[1], cols[0]] : [cols[0], cols[1]]);
      c.globalAlpha = layer ? 1 : 0.75;
      let x = -50;
      while (x < LW + 50) {
        const w = 160 + rng() * 220, ph = h * (0.45 + rng() * 0.55) * (layer ? 0.7 : 1);
        c.beginPath(); c.moveTo(x, baseY);
        c.quadraticCurveTo(x + w * 0.35, baseY - ph * 1.05, x + w * 0.5, baseY - ph);
        c.quadraticCurveTo(x + w * 0.65, baseY - ph * 1.05, x + w, baseY);
        c.closePath(); c.fill();
        if (caps && layer === 0) {
          c.save(); c.fillStyle = 'rgba(255,255,255,0.9)';
          c.beginPath(); c.moveTo(x + w * 0.36, baseY - ph * 0.78);
          c.quadraticCurveTo(x + w * 0.5, baseY - ph * 1.08, x + w * 0.64, baseY - ph * 0.78);
          c.lineTo(x + w * 0.57, baseY - ph * 0.72); c.lineTo(x + w * 0.5, baseY - ph * 0.8); c.lineTo(x + w * 0.43, baseY - ph * 0.72);
          c.closePath(); c.fill(); c.restore();
        }
        x += w * (0.55 + rng() * 0.3);
      }
    }
    c.globalAlpha = 1;
  }
  drawVolcano(c, x, baseY, h) {
    c.fillStyle = vgrad(c, baseY - h, baseY, ['#8a4b3a', '#b06a4c']);
    c.beginPath(); c.moveTo(x - 260, baseY); c.quadraticCurveTo(x - 80, baseY - h * 0.7, x - 50, baseY - h);
    c.lineTo(x + 50, baseY - h); c.quadraticCurveTo(x + 80, baseY - h * 0.7, x + 260, baseY); c.closePath(); c.fill();
    c.fillStyle = '#ff8a3d'; c.beginPath(); c.ellipse(x, baseY - h, 52, 12, 0, 0, TAU); c.fill();
    c.fillStyle = '#ffcf5a'; c.beginPath(); c.ellipse(x, baseY - h, 34, 7, 0, 0, TAU); c.fill();
    c.strokeStyle = '#ff9a3d'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.moveTo(x - 20, baseY - h + 6); c.quadraticCurveTo(x - 40, baseY - h * 0.6, x - 70, baseY - h * 0.35); c.stroke();
    this.volcanoTop = { x, y: baseY - h };
  }
  drawCastle(c, LW, hy, rng) {
    const x0 = LW * 0.55, base = hy + 5;
    c.fillStyle = '#d9b8ff';
    const towers = [[-120, 120, 34], [-60, 170, 40], [0, 230, 48], [60, 170, 40], [120, 120, 34]];
    c.fillRect(x0 - 130, base - 100, 260, 100);
    towers.forEach(([dx, h, w]) => {
      c.fillStyle = '#e7d1ff'; c.fillRect(x0 + dx - w / 2, base - h, w, h);
      c.fillStyle = '#ff8cc6'; c.beginPath(); c.moveTo(x0 + dx - w / 2 - 6, base - h); c.lineTo(x0 + dx, base - h - w * 1.3); c.lineTo(x0 + dx + w / 2 + 6, base - h); c.closePath(); c.fill();
      c.fillStyle = '#ffe36e'; c.fillRect(x0 + dx - 1, base - h - w * 1.3 - 18, 2, 18);
      c.beginPath(); c.moveTo(x0 + dx + 1, base - h - w * 1.3 - 18); c.lineTo(x0 + dx + 16, base - h - w * 1.3 - 13); c.lineTo(x0 + dx + 1, base - h - w * 1.3 - 8); c.fill();
      c.fillStyle = '#8f6bd6'; c.beginPath(); c.arc(x0 + dx, base - h * 0.6, w * 0.16, Math.PI, 0); c.fillRect(x0 + dx - w * 0.16, base - h * 0.6, w * 0.32, w * 0.3); c.fill();
    });
    // floating islands
    for (let i = 0; i < 3; i++) {
      const ix = LW * (0.12 + i * 0.3) + rng() * 40, iy = hy * (0.35 + rng() * 0.2), iw = 60 + rng() * 40;
      c.fillStyle = '#9b7bd8'; c.beginPath(); c.moveTo(ix - iw, iy); c.quadraticCurveTo(ix, iy + iw * 1.1, ix + iw, iy); c.fill();
      c.fillStyle = '#8be08a'; c.beginPath(); c.ellipse(ix, iy, iw, 12, 0, 0, TAU); c.fill();
    }
  }
  palm(c, x, y, s, rng) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.strokeStyle = '#9b6a3f'; c.lineWidth = 9; c.lineCap = 'round';
    c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(8, -40, -4, -80); c.stroke();
    c.fillStyle = '#2fb35a';
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.55;
      c.save(); c.translate(-4, -80); c.rotate(a);
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(22, -14, 46, 6); c.quadraticCurveTo(22, -2, 0, 0); c.fill(); c.restore();
    }
    c.fillStyle = '#7a4a24'; c.beginPath(); c.arc(-2, -76, 5, 0, TAU); c.arc(-9, -74, 5, 0, TAU); c.fill();
    c.restore();
  }
  pine(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#6b4a35'; c.fillRect(-4, -12, 8, 14);
    for (let i = 0; i < 3; i++) {
      const w = 30 - i * 7, yy = -10 - i * 22;
      c.fillStyle = '#2e8a7a'; c.beginPath(); c.moveTo(-w, yy); c.lineTo(0, yy - 34); c.lineTo(w, yy); c.closePath(); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-w * 0.45, yy - 18); c.lineTo(0, yy - 34); c.lineTo(w * 0.45, yy - 18); c.quadraticCurveTo(0, yy - 12, -w * 0.45, yy - 18); c.fill();
    }
    c.restore();
  }
  lolly(c, x, y, s, rng) {
    c.save(); c.translate(x, y); c.scale(s, s);
    c.fillStyle = '#fff3e0'; c.fillRect(-3, -50, 6, 50);
    const cols = ['#ff7eb6', '#7ee0d6', '#ffd36e', '#b69cff'];
    c.fillStyle = cols[Math.floor(rng() * cols.length)];
    c.beginPath(); c.arc(0, -64, 24, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(-8, -72, 8, 0, TAU); c.fill();
    c.restore();
  }
  crystalCluster(c, x, y, s, col, rng, alpha) {
    c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = alpha;
    c.shadowColor = col; c.shadowBlur = 20;
    for (let i = 0; i < 4; i++) {
      const a = (i - 1.5) * 0.35, h = 30 + rng() * 40, w = 8 + rng() * 6;
      c.save(); c.rotate(a);
      c.fillStyle = col; c.beginPath(); c.moveTo(-w, 0); c.lineTo(-w, -h); c.lineTo(0, -h - w * 1.5); c.lineTo(w, -h); c.lineTo(w, 0); c.closePath(); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.beginPath(); c.moveTo(-w * 0.6, -2); c.lineTo(-w * 0.6, -h); c.lineTo(0, -h - w * 1.2); c.lineTo(0, -2); c.fill();
      c.restore();
    }
    c.restore();
  }
  decor(c, x, y, s, rng) {
    const id = this.id;
    c.save(); c.translate(x, y); c.scale(s, s);
    if (id === 'valley' || id === 'kingdom') {
      if (rng() > 0.5) { // flower
        const col = ['#ff6fa8', '#ffd84d', '#ffffff', '#b28cff'][Math.floor(rng() * 4)];
        c.strokeStyle = '#2f9a43'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -10); c.stroke();
        c.fillStyle = col; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(Math.cos(i * 1.256) * 4, -12 + Math.sin(i * 1.256) * 4, 3.4, 0, TAU); c.fill(); }
        c.fillStyle = '#ffb02e'; c.beginPath(); c.arc(0, -12, 2.5, 0, TAU); c.fill();
      } else { c.fillStyle = 'rgba(40,120,50,0.35)'; c.beginPath(); c.ellipse(0, 0, 14, 5, 0, 0, TAU); c.fill(); for (let i = -2; i <= 2; i++) { c.fillStyle = '#4cbf5a'; c.beginPath(); c.moveTo(i * 4 - 2, 0); c.lineTo(i * 5, -12 - Math.abs(i) * -2); c.lineTo(i * 4 + 2, 0); c.fill(); } }
    } else if (id === 'frozen') {
      c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, 0, 20, 8, 0, Math.PI, TAU); c.fill();
      c.fillStyle = 'rgba(120,170,230,0.3)'; c.beginPath(); c.ellipse(4, 1, 18, 3, 0, 0, TAU); c.fill();
    } else if (id === 'lava') {
      c.fillStyle = '#7a4a34'; c.beginPath(); c.ellipse(0, 0, 14, 9, 0, Math.PI, TAU); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.15)'; c.beginPath(); c.ellipse(-4, -5, 5, 2, 0, 0, TAU); c.fill();
    } else {
      const col = rng() > 0.5 ? '#7ef9ff' : '#ff9cf3';
      c.fillStyle = col; c.shadowColor = col; c.shadowBlur = 10;
      c.beginPath(); c.moveTo(-5, 0); c.lineTo(0, -16); c.lineTo(5, 0); c.closePath(); c.fill();
    }
    c.restore();
  }

  newAmbient(init) {
    const { W, H } = this;
    const a = this.th.ambient;
    const p = { x: rand(0, W), y: init ? rand(0, H) : -20, vx: 0, vy: 0, s: rand(0.5, 1.4), r: rand(0, TAU), vr: rand(-2, 2), ph: rand(0, 6) };
    if (a === 'snow') { p.vy = rand(30, 80); p.vx = rand(-15, 15); }
    else if (a === 'leaves') { p.vy = rand(25, 55); p.vx = rand(10, 35); p.col = ['#7ed957', '#b5e655', '#ffd166'][Math.floor(rand(0, 3))]; }
    else if (a === 'sparkle') { p.vy = rand(-10, 10); p.vx = rand(-10, 10); p.y = init ? rand(0, H) : rand(0, H); p.life = rand(1, 4); }
    else if (a === 'embers') { p.vy = -rand(20, 60); p.vx = rand(-10, 10); p.y = init ? rand(0, H) : H + 20; }
    else { p.vy = -rand(5, 18); p.vx = rand(-8, 8); p.y = init ? rand(0, H) : H + 10; p.col = Math.random() > 0.5 ? '#7ef9ff' : '#ff9cf3'; }
    return p;
  }

  /** Back layers: sky, far, mid, ground (parallax shift px) */
  drawBack(ctx, par, t, dt) {
    const { W, H, hy } = this;
    ctx.drawImage(this.sky, 0, 0);
    // clouds
    for (const cl of this.clouds) {
      cl.x += cl.v * dt; if (cl.x > W + 150) cl.x = -150;
      this.cloud(ctx, cl.x - par * 0.08, cl.y, cl.s);
    }
    ctx.drawImage(this.far, -M - par * 0.15, 0);
    if (this.volcanoTop) this.smokePuffs(ctx, this.volcanoTop.x - M - par * 0.15, this.volcanoTop.y, t);
    ctx.drawImage(this.mid, -M - par * 0.3, 0);
    ctx.drawImage(this.ground, -M - par * 0.55, hy - 10);
    // pulsing glows
    if (this.glows.length) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const g of this.glows) {
        const a = 0.12 + 0.08 * Math.sin(t * 1.5 + g.ph);
        const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
        gr.addColorStop(0, `rgba(${g.col},${a})`); gr.addColorStop(1, `rgba(${g.col},0)`);
        ctx.fillStyle = gr; ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
      }
      ctx.restore();
    }
  }
  cloud(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = this.id === 'kingdom' ? 'rgba(255,240,250,0.9)' : 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, TAU); ctx.arc(28, -12, 32, 0, TAU); ctx.arc(62, 0, 24, 0, TAU); ctx.arc(30, 8, 26, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  smokePuffs(ctx, x, y, t) {
    ctx.save();
    for (let i = 0; i < 5; i++) {
      const k = ((t * 0.25 + i / 5) % 1);
      ctx.globalAlpha = 0.5 * (1 - k);
      ctx.fillStyle = '#fff1e0';
      ctx.beginPath(); ctx.arc(x + Math.sin(k * 6 + i) * 14 + k * 40, y - k * 120, 14 + k * 30, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /** Foreground ambient particles */
  drawAmbient(ctx, dt, t, reduced) {
    const { W, H } = this;
    const a = this.th.ambient;
    ctx.save();
    if (a === 'sparkle' || a === 'embers' || a === 'motes') ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < this.ambient.length; i++) {
      const p = this.ambient[i];
      p.x += (p.vx + (a === 'leaves' || a === 'snow' ? Math.sin(t + p.ph) * 12 : 0)) * dt;
      p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.y > H + 30 || p.y < -40 || p.x > W + 40 || p.x < -40 || (p.life !== undefined && (p.life -= dt) < 0)) { this.ambient[i] = this.newAmbient(false); continue; }
      if (a === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * p.s, 0, TAU); ctx.fill(); }
      else if (a === 'leaves') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.col; ctx.beginPath(); ctx.ellipse(0, 0, 6 * p.s, 3 * p.s, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      else if (a === 'sparkle') { const al = 0.5 + 0.5 * Math.sin(t * 4 + p.ph); this.star(ctx, p.x, p.y, 4 * p.s, `rgba(255,240,180,${al})`); }
      else if (a === 'embers') { ctx.fillStyle = `rgba(255,${150 + Math.floor(p.s * 60)},80,0.8)`; ctx.beginPath(); ctx.arc(p.x, p.y, 2.2 * p.s, 0, TAU); ctx.fill(); }
      else { const al = 0.35 + 0.35 * Math.sin(t * 2 + p.ph); ctx.fillStyle = p.col; ctx.globalAlpha = al; ctx.beginPath(); ctx.arc(p.x, p.y, 2.5 * p.s, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    ctx.restore();
  }
  star(ctx, x, y, r, col) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y - r * 2); ctx.quadraticCurveTo(x, y, x + r * 2, y); ctx.quadraticCurveTo(x, y, x, y + r * 2); ctx.quadraticCurveTo(x, y, x - r * 2, y); ctx.quadraticCurveTo(x, y, x, y - r * 2);
    ctx.fill();
  }
}
