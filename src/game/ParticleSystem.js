// ---------------- Pooled particle system + floating text ----------------
import { rand, TAU } from './utils.js';

// shapes: 0 circle, 1 shard (ice polygon), 2 star sparkle, 3 ring (shockwave), 4 snowflake, 5 bubble, 6 cube
export const P = { CIRCLE: 0, SHARD: 1, STAR: 2, RING: 3, FLAKE: 4, BUBBLE: 5, CUBE: 6 };

export class ParticleSystem {
  constructor(max = 1400) {
    this.max = max;
    this.pool = [];
    for (let i = 0; i < max; i++) this.pool.push({ active: false });
    this.live = [];
    this.texts = [];
    this.quality = 1;
  }

  spawn(o) {
    if (this.live.length >= this.max * this.quality) return null;
    let p = this.pool.pop();
    if (!p) return null;
    p.active = true;
    p.x = o.x; p.y = o.y;
    p.vx = o.vx || 0; p.vy = o.vy || 0;
    p.life = p.maxLife = o.life || 1;
    p.size = o.size || 4; p.size1 = o.size1 !== undefined ? o.size1 : p.size * 0.2;
    p.color = o.color || '#fff';
    p.g = o.g || 0; p.drag = o.drag !== undefined ? o.drag : 0.98;
    p.shape = o.shape || 0;
    p.rot = o.rot !== undefined ? o.rot : rand(0, TAU); p.vrot = o.vrot !== undefined ? o.vrot : rand(-6, 6);
    p.add = !!o.add;
    p.floor = o.floor || 0;
    this.live.push(p);
    return p;
  }

  burst(x, y, n, o) {
    n = Math.max(1, Math.round(n * this.quality));
    for (let i = 0; i < n; i++) {
      const a = o.angle !== undefined ? o.angle + rand(-o.spread, o.spread) : rand(0, TAU);
      const sp = rand(o.speed[0], o.speed[1]);
      this.spawn({
        x: x + rand(-(o.jitter || 0), o.jitter || 0), y: y + rand(-(o.jitter || 0), o.jitter || 0),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(o.life[0], o.life[1]), size: rand(o.size[0], o.size[1]), size1: o.size1,
        color: Array.isArray(o.color) ? o.color[Math.floor(Math.random() * o.color.length)] : o.color,
        g: o.g, drag: o.drag, shape: o.shape, add: o.add, floor: o.floor,
      });
    }
  }

  text(x, y, str, opts = {}) {
    this.texts.push({
      x, y, str, life: opts.life || 1.1, maxLife: opts.life || 1.1,
      size: opts.size || 28, color: opts.color || '#fff', stroke: opts.stroke || '#2a1a4a',
      vy: opts.vy !== undefined ? opts.vy : -60, big: !!opts.big, glow: opts.glow || null,
    });
    if (this.texts.length > 40) this.texts.shift();
  }

  update(dt) {
    const L = this.live;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt;
      if (p.life <= 0) { p.active = false; L[i] = L[L.length - 1]; L.pop(); this.pool.push(p); continue; }
      p.vy += p.g * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d; p.vy *= d;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += p.vrot * dt;
      if (p.floor && p.y > p.floor) { p.y = p.floor; p.vy *= -0.35; p.vx *= 0.7; p.vrot *= 0.6; }
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt; t.y += t.vy * dt; t.vy *= Math.pow(0.96, dt * 60);
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  }

  draw(ctx) {
    // normal blend first, additive second (fewer state changes)
    for (let pass = 0; pass < 2; pass++) {
      if (pass === 1) ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.live.length; i++) {
        const p = this.live[i];
        if (p.add !== (pass === 1)) continue;
        const k = p.life / p.maxLife;
        const s = p.size1 + (p.size - p.size1) * k;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.color;
        switch (p.shape) {
          case 0: ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.fill(); break;
          case 1:
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s * 0.8, 0); ctx.lineTo(0, s * 1.1); ctx.lineTo(-s * 0.7, -s * 0.2); ctx.closePath(); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s * 0.3, -s * 0.2); ctx.lineTo(-s * 0.4, -s * 0.2); ctx.fill();
            ctx.restore(); break;
          case 2:
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - s * 2); ctx.quadraticCurveTo(p.x, p.y, p.x + s * 2, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s * 2);
            ctx.quadraticCurveTo(p.x, p.y, p.x - s * 2, p.y); ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s * 2); ctx.fill(); break;
          case 3:
            ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, 10 * k);
            ctx.beginPath(); ctx.arc(p.x, p.y, p.size1 + (p.size - p.size1) * (1 - k), 0, TAU); ctx.stroke(); break;
          case 4:
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, s * 0.3);
            ctx.beginPath(); for (let j = 0; j < 3; j++) { ctx.rotate(Math.PI / 3); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); } ctx.stroke(); ctx.restore(); break;
          case 5:
            ctx.strokeStyle = p.color; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, s, 0, TAU); ctx.stroke();
            ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(p.x - s * 0.35, p.y - s * 0.35, s * 0.25, 0, TAU); ctx.fill(); break;
          case 6:
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
            ctx.fillRect(-s, -s, s * 2, s * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fillRect(-s, -s, s * 2, s * 0.6);
            ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.5; ctx.strokeRect(-s, -s, s * 2, s * 2);
            ctx.restore(); break;
        }
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  drawTexts(ctx) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    for (const t of this.texts) {
      const age = 1 - t.life / t.maxLife;
      const pop = age < 0.15 ? 0.5 + (age / 0.15) * 0.75 : age < 0.25 ? 1.25 - ((age - 0.15) / 0.1) * 0.25 : 1;
      ctx.globalAlpha = Math.min(1, t.life / (t.maxLife * 0.3));
      ctx.save();
      ctx.translate(t.x, t.y);
      ctx.scale(pop, pop);
      ctx.font = `${t.big ? '' : ''}${Math.round(t.size)}px "Lilita One", "Fredoka", sans-serif`;
      if (t.glow) { ctx.shadowColor = t.glow; ctx.shadowBlur = 18; }
      ctx.lineWidth = Math.max(4, t.size * 0.2);
      ctx.strokeStyle = t.stroke;
      ctx.strokeText(t.str, 0, 0);
      ctx.shadowBlur = 0;
      ctx.fillStyle = t.color;
      ctx.fillText(t.str, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const p of this.live) { p.active = false; this.pool.push(p); }
    this.live.length = 0;
    this.texts.length = 0;
  }
}
