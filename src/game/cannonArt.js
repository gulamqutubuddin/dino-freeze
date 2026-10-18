// ---------------- The Water/Ice Cannon (vector art) ----------------
import { mix, TAU, roundRect, rgba } from './utils.js';

/**
 * @param st {angle, recoil(0..1), firing(bool), heat(0..1), t, hue}
 */
export function drawCannon(ctx, x, y, cannon, st, scale = 1) {
  const main = cannon.rainbow ? `hsl(${(st.t * 80) % 360},85%,62%)` : cannon.main;
  const glow = cannon.rainbow ? `hsl(${(st.t * 80 + 60) % 360},95%,75%)` : cannon.glow;
  const dark = cannon.rainbow ? '#5a2a7a' : mix(cannon.main, '#1a1040', 0.55);
  const light = cannon.rainbow ? '#ffd6f0' : mix(cannon.main, '#ffffff', 0.55);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // ground shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 26, 120, 22, 0, 0, TAU); ctx.fill();

  // hoses (behind)
  ctx.lineCap = 'round';
  ctx.strokeStyle = dark; ctx.lineWidth = 14;
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-95, -40, -40, -52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(70, 0); ctx.quadraticCurveTo(95, -40, 40, -52); ctx.stroke();
  ctx.strokeStyle = light; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-70, 0); ctx.quadraticCurveTo(-95, -40, -40, -52); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(70, 0); ctx.quadraticCurveTo(95, -40, 40, -52); ctx.stroke();

  // ---- barrel (rotates) ----
  const a = st.angle;
  const rec = st.recoil * 14;
  ctx.save();
  ctx.translate(0, -50);
  ctx.rotate(a);
  ctx.translate(-rec, 0);
  // barrel body
  const bg = ctx.createLinearGradient(0, -26, 0, 26);
  bg.addColorStop(0, light); bg.addColorStop(0.35, main); bg.addColorStop(1, dark);
  ctx.fillStyle = bg; ctx.strokeStyle = '#1d1440'; ctx.lineWidth = 4;
  roundRect(ctx, 0, -24, 128, 48, 20); ctx.fill(); ctx.stroke();
  // glass tube with glowing liquid
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 22, -18, 78, 14, 7); ctx.fill();
  const lvl = 0.6 + 0.4 * Math.sin(st.t * 3);
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.75 + st.heat * 0.25;
  roundRect(ctx, 24, -16, 74 * lvl, 10, 5); ctx.fill();
  ctx.globalAlpha = 1;
  // bubbles in tube
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 4; i++) { const bx = 26 + ((st.t * 60 + i * 19) % 70); ctx.beginPath(); ctx.arc(bx, -11 + Math.sin(st.t * 5 + i) * 2, 1.8, 0, TAU); ctx.fill(); }
  // bands
  ctx.fillStyle = dark;
  [12, 104].forEach((bx) => { roundRect(ctx, bx, -27, 10, 54, 4); ctx.fill(); });
  ctx.fillStyle = '#ffd84d';
  [16, 108].forEach((bx) => { ctx.beginPath(); ctx.arc(bx + 1, 18, 2.5, 0, TAU); ctx.fill(); });
  // nozzle
  ctx.fillStyle = light; ctx.strokeStyle = '#1d1440';
  roundRect(ctx, 122, -30, 26, 60, 12); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#123'; ctx.beginPath(); ctx.ellipse(148, 0, 6, 16, 0, 0, TAU); ctx.fill();
  // muzzle glow
  const mg = 0.35 + st.heat * 0.65 + (st.firing ? 0.2 * Math.sin(st.t * 40) : 0);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const rg = ctx.createRadialGradient(150, 0, 2, 150, 0, 46);
  rg.addColorStop(0, rgbaStr(glow, 0.9 * mg)); rg.addColorStop(1, rgbaStr(glow, 0));
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(150, 0, 46, 0, TAU); ctx.fill();
  ctx.restore();
  // gloss stripe
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(ctx, 8, -22, 112, 6, 3); ctx.fill();
  ctx.restore();

  // ---- base ----
  const g = ctx.createLinearGradient(0, -60, 0, 30);
  g.addColorStop(0, light); g.addColorStop(0.45, main); g.addColorStop(1, dark);
  ctx.fillStyle = g; ctx.strokeStyle = '#1d1440'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-105, 24); ctx.lineTo(-80, -20); ctx.quadraticCurveTo(0, -40, 80, -20); ctx.lineTo(105, 24);
  ctx.quadraticCurveTo(0, 40, -105, 24); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // rivets & stripe
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 26, 14 + Math.abs(i) * -1.2, 3, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffd84d';
  roundRect(ctx, -60, -8, 120, 8, 4); ctx.fill();
  // dome
  const dg = ctx.createRadialGradient(-14, -76, 4, 0, -54, 50);
  dg.addColorStop(0, '#ffffff'); dg.addColorStop(0.3, light); dg.addColorStop(1, main);
  ctx.fillStyle = dg;
  ctx.beginPath(); ctx.arc(0, -46, 44, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke();
  // glass window w/ swirling liquid
  ctx.save();
  ctx.beginPath(); ctx.arc(0, -50, 24, 0, TAU); ctx.clip();
  ctx.fillStyle = '#103050'; ctx.fillRect(-26, -76, 52, 52);
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.moveTo(-26, -46);
  for (let i = 0; i <= 52; i += 4) ctx.lineTo(-26 + i, -50 + Math.sin(st.t * 4 + i * 0.25) * 4);
  ctx.lineTo(26, -24); ctx.lineTo(-26, -24); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-8, -60, 9, 5, -0.6, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#1d1440'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, -50, 24, 0, TAU); ctx.stroke();
  // star emblem
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Lilita One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('❄', 0, -50);

  ctx.restore();
}

function rgbaStr(col, a) {
  if (col[0] === '#') return rgba(col, a);
  // hsl(...) -> hsla
  return col.replace('hsl(', 'hsla(').replace(')', `,${a})`);
}
