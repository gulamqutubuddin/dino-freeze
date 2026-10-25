// =====================================================================
//  GameEngine – real-time gameplay on a <canvas>.
//  React only receives throttled HUD snapshots + a few events, so the
//  60 FPS loop never triggers React re-renders.
// =====================================================================
import { clamp, lerp, rand, randInt, choice, TAU, dist2, easeOutBack, roundRect } from './utils.js';
import { LEVELS, ENEMY_TYPES, CANNONS, POWERUPS, DINO_TYPES, DRAGON_TYPES, DINO_BOSSES, DRAGON_BOSSES } from './data.js';
import { Background, HORIZON } from './Background.js';
import { ParticleSystem, P } from './ParticleSystem.js';
import { drawEnemy, HIT_SHAPE, WEAK_POINT } from './enemyArt.js';
import { drawCannon } from './cannonArt.js';
import { AudioManager } from './AudioManager.js';

const ICE_COLS = ['#e8fbff', '#bdeeff', '#8fdcff', '#ffffff', '#a8e6ff'];
const FROZEN_TIME = 0.55;
const MAX_DROPS = 320;
const ENDLESS_THEMES = { dino: [0, 3, 1], dragon: [2, 1, 4], attract: [0, 2, 4, 1, 3] };

export class GameEngine {
  constructor(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts;
    this.cb = opts.callbacks || {};
    this.mode = opts.mode || 'level'; // level | dino | dragon | attract
    this.attract = this.mode === 'attract';
    this.endless = this.mode !== 'level';
    this.levelIndex = opts.levelIndex || 0;
    this.themeIndex = this.endless ? ENDLESS_THEMES[this.mode][0] : this.levelIndex;
    this.level = LEVELS[this.themeIndex];
    this.cannon = CANNONS.find((c) => c.id === opts.cannonId) || CANNONS[0];
    const up = opts.upgrades || { power: 0, rate: 0, energy: 0 };
    this.powerMul = 1 + 0.2 * up.power;
    this.rateMul = 1 + 0.15 * up.rate;
    this.energyMul = 1 + 0.3 * up.energy;
    this.settings = { reducedMotion: false, aimLine: true, quality: 'auto', ...(opts.settings || {}) };

    this.bg = new Background(this.level.id);
    this.particles = new ParticleSystem(1500);
    this.enemies = [];
    this.drops = [];
    this.dropPool = [];
    for (let i = 0; i < MAX_DROPS; i++) this.dropPool.push({});
    this.powerups = [];
    this.snowballs = [];
    this.banners = [];
    this.active = {}; // timed power-ups: id -> seconds left

    this.time = 0;
    this.realTime = 0;
    this.timeScale = 1;
    this.slowT = 0; this.slowTarget = 1;
    this.shake = 0; this.flash = 0; this.flashCol = '255,255,255';
    this.splat = 0; this.cannonShake = 0;
    this.wind = 0; this.windT = 0;

    this.score = 0; this.shield = 100; this.superEnergy = this.attract ? 0 : 0;
    this.combo = 0; this.comboT = 0; this.maxCombo = 0;
    this.stats = { frozen: 0, shattered: 0, dinoFrozen: 0, dragonFrozen: 0, bosses: 0, supers: 0, powerups: 0, shots: 0, hits: 0 };
    this.crystalsRun = 0;
    this.revived = false;

    this.wave = 0; this.waveDef = null; this.spawned = 0; this.spawnT = 0;
    this.state = 'intro'; this.stateT = 2.2;
    this.boss = null;
    this.floaterT = rand(14, 22);
    this.super = null;
    this.hint = opts.showHints ? { text: 'HOLD to spray water! 💧', t: 0 } : null;

    this.aimX = 0; this.aimY = 0; this.firing = false; this.fireT = 0;
    this.angle = -Math.PI / 2; this.recoil = 0; this.heat = 0; this.reticleHit = 0;
    this.paused = false;
    this.hudT = 0;
    this.fpsSamples = []; this.lowQ = this.settings.quality === 'low';

    this.onResize = this.resize.bind(this);
    this.onDown = this.pointerDown.bind(this);
    this.onMove = this.pointerMove.bind(this);
    this.onUp = this.pointerUp.bind(this);
    this.onKey = this.keyDown.bind(this);
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    if (!this.attract) {
      canvas.addEventListener('pointerdown', this.onDown);
      window.addEventListener('pointermove', this.onMove);
      window.addEventListener('pointerup', this.onUp);
      window.addEventListener('pointercancel', this.onUp);
      window.addEventListener('keydown', this.onKey);
    }
    this.resize();
    this.aimX = this.W / 2; this.aimY = this.H * 0.45;
    if (!this.attract) this.banner(this.endless ? (this.mode === 'dino' ? 'DINO WORLD' : 'DRAGON WORLD') : this.level.name.toUpperCase(), 'GET READY!', 2.1, '#ffd84d');
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop.bind(this));
  }

  // ------------------------------------------------------------------ setup
  resize() {
    const c = this.canvas;
    const cssW = c.clientWidth || window.innerWidth, cssH = c.clientHeight || window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, this.lowQ ? 1 : 2);
    c.width = Math.round(cssW * dpr); c.height = Math.round(cssH * dpr);
    this.dpr = dpr;
    this.scale = Math.min(c.height / 720, c.width / 960);
    this.W = c.width / this.scale; this.H = c.height / this.scale;
    // ---- responsive creature sizing ----
    // In portrait the world is locked to 960 units wide, so creatures shrink a
    // lot on phones. Boost them based on aspect ratio and physical screen size.
    const aspect = this.H / this.W;
    let k = 1.2; // global base boost (creatures were a bit small everywhere)
    if (aspect > 1) k *= clamp(1 + (aspect - 1) * 0.4, 1, 1.45); // portrait phones / tablets
    if (Math.min(cssW, cssH) < 500) k *= 1.1; // small physical screens (landscape phones too)
    this.enemyScale = k;
    this.altScale = Math.max(1, k * 0.85); // keep flyers clear of the ground when bigger
    this.farScale = aspect > 1 ? 0.42 : 0.34; // far-away creatures not too tiny on mobile
    this.laneSpread = aspect > 1.3 ? 0.88 : 1; // keep big creatures inside narrow screens
    this.hy = this.H * HORIZON;
    this.nearY = this.H - 150;
    this.cx = this.W / 2; this.cy = this.H - 58;
    this.pivotY = this.cy - 50;
    this.particles.quality = this.lowQ ? 0.45 : 1;
    this.bg.resize(this.W, this.H, this.lowQ ? 0.5 : 1);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.destroyed = true;
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('orientationchange', this.onResize);
    this.canvas.removeEventListener('pointerdown', this.onDown);
    window.removeEventListener('pointermove', this.onMove);
    window.removeEventListener('pointerup', this.onUp);
    window.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('keydown', this.onKey);
  }

  setSettings(s) { this.settings = { ...this.settings, ...s }; }
  pause() { if (this.state === 'gameover') return; this.paused = true; this.firing = false; }
  resume() { this.paused = false; this.last = performance.now(); }

  // ------------------------------------------------------------------ input
  toWorld(e) {
    const r = this.canvas.getBoundingClientRect();
    return [((e.clientX - r.left) * this.dpr) / this.scale, ((e.clientY - r.top) * this.dpr) / this.scale];
  }
  pointerDown(e) {
    if (this.paused) return;
    e.preventDefault();
    AudioManager.unlock();
    [this.aimX, this.aimY] = this.toWorld(e);
    this.firing = true;
    try { this.canvas.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
  }
  pointerMove(e) {
    if (this.paused) return;
    [this.aimX, this.aimY] = this.toWorld(e);
  }
  pointerUp() { this.firing = false; }
  keyDown(e) {
    if (e.code === 'Space') { e.preventDefault(); this.triggerSuper(); }
  }

  sfx(name, ...a) { if (!this.attract && AudioManager[name]) AudioManager[name](...a); }

  // ------------------------------------------------------------------ loop
  loop(ts) {
    if (this.destroyed) return;
    this.raf = requestAnimationFrame(this.loop.bind(this));
    let dt = (ts - this.last) / 1000;
    this.last = ts;
    if (dt > 0.05) dt = 0.05;
    if (dt <= 0) return;
    if (this.paused) { if (!this.pausedDrawn) { this.render(0); this.pausedDrawn = true; } return; }
    this.pausedDrawn = false;
    this.autoQuality(dt);
    this.realTime += dt;
    // time-scale (slow-motion / hit-stop)
    if (this.slowT > 0) { this.slowT -= dt; this.timeScale = lerp(this.timeScale, this.slowTarget, 1 - Math.exp(-20 * dt)); }
    else this.timeScale = lerp(this.timeScale, 1, 1 - Math.exp(-8 * dt));
    const gdt = dt * this.timeScale;
    this.update(gdt, dt);
    this.render(dt);
  }

  autoQuality(dt) {
    if (this.settings.quality !== 'auto' || this.lowQ || this.realTime > 6 || this.realTime < 1) return;
    this.fpsSamples.push(dt);
    if (this.fpsSamples.length >= 120) {
      const avg = this.fpsSamples.reduce((a, b) => a + b, 0) / this.fpsSamples.length;
      if (avg > 1 / 42) { this.lowQ = true; this.resize(); }
      this.fpsSamples = [];
    }
  }

  slowMo(scale, dur) {
    if (this.settings.reducedMotion && scale < 0.5) scale = 0.5;
    this.slowTarget = scale; this.slowT = Math.max(this.slowT, dur);
  }
  addShake(v) { if (!this.settings.reducedMotion) this.shake = Math.min(30, this.shake + v); }
  addFlash(v, col = '255,255,255') { this.flash = Math.max(this.flash, this.settings.reducedMotion ? v * 0.3 : v); this.flashCol = col; }

  // ------------------------------------------------------------------ update
  update(dt, rdt) {
    this.time += dt;
    this.updateState(dt, rdt);
    this.updateCannon(dt, rdt);
    this.updateDrops(dt);
    this.updateEnemies(dt);
    this.updatePowerups(dt);
    this.updateSnowballs(dt);
    this.updateSuper(rdt);
    this.particles.update(dt);
    for (const k in this.active) { this.active[k] -= dt; if (this.active[k] <= 0) delete this.active[k]; }
    if (this.comboT > 0) { this.comboT -= dt; if (this.comboT <= 0) this.combo = 0; }
    this.shake *= Math.exp(-8 * rdt);
    this.flash = Math.max(0, this.flash - rdt * 2.2);
    this.splat = Math.max(0, this.splat - rdt);
    this.cannonShake = Math.max(0, this.cannonShake - rdt * 3);
    this.reticleHit = Math.max(0, this.reticleHit - rdt * 4);
    for (let i = this.banners.length - 1; i >= 0; i--) { this.banners[i].t += rdt; if (this.banners[i].t > this.banners[i].dur) this.banners.splice(i, 1); }
    if (this.windT > 0) { this.windT -= dt; if (this.windT <= 0) this.wind = 0; }
    if (this.hint) this.hint.t += rdt;
    this.hudT -= rdt;
    if (this.hudT <= 0 && !this.attract) { this.hudT = 0.1; this.emitHud(); }
  }

  updateState(dt, rdt) {
    if (this.state === 'intro') {
      this.stateT -= rdt;
      if (this.stateT <= 0) this.nextWave();
    } else if (this.state === 'playing') {
      this.updateSpawning(dt);
      const alive = this.enemies.some((e) => !e.dead && e.state !== 'flee');
      if (!this.boss && this.spawned >= this.waveDef.count && !alive) this.waveClear();
      if (!this.endless || this.attract) {
        this.floaterT -= dt;
        if (this.floaterT <= 0 && !this.attract) { this.floaterT = rand(16, 26); this.spawnFloater(); }
      } else {
        this.floaterT -= dt;
        if (this.floaterT <= 0) { this.floaterT = rand(16, 26); this.spawnFloater(); }
      }
    } else if (this.state === 'waveclear') {
      this.stateT -= rdt;
      if (this.stateT <= 0) this.nextWave();
    } else if (this.state === 'complete') {
      this.stateT -= rdt;
      if (this.stateT <= 0 && !this.completeSent) { this.completeSent = true; this.finish('complete'); }
    }
  }

  // ------------------------------------------------------------------ waves
  makeWave(n) {
    const li = this.levelIndex;
    if (!this.endless) {
      if (n === 5) return { boss: this.level.boss, count: 0 };
      return {
        count: 6 + n * 2 + li * 2,
        interval: Math.max(0.55, 1.7 - li * 0.12 - n * 0.1),
        speedMul: 1 + li * 0.1 + n * 0.05,
        pool: this.level.pool,
        swarm: n >= 2 ? 0.14 + li * 0.02 : 0,
        maxAlive: 6 + li + n,
      };
    }
    const kind = this.mode;
    if (n % 5 === 0) {
      const list = kind === 'dino' ? DINO_BOSSES : kind === 'dragon' ? DRAGON_BOSSES : [...DINO_BOSSES, ...DRAGON_BOSSES];
      return { boss: list[(n / 5 - 1) % list.length], count: 0, hpMul: 1 + n * 0.05 };
    }
    const types = kind === 'dino' ? DINO_TYPES : kind === 'dragon' ? DRAGON_TYPES : [...DINO_TYPES, ...DRAGON_TYPES];
    const unlocked = this.attract ? types.length : Math.min(types.length, 2 + Math.floor(n / 2));
    return {
      count: Math.min(30, 6 + n * 2),
      interval: this.attract ? 1.1 : Math.max(0.45, 1.6 - n * 0.06),
      speedMul: this.attract ? 1 : Math.min(1.8, 1 + n * 0.04),
      pool: types.slice(0, unlocked),
      swarm: n >= 3 ? 0.15 : 0,
      maxAlive: this.attract ? 7 : Math.min(16, 6 + n),
    };
  }

  nextWave() {
    this.wave++;
    if (this.attract && this.wave > 4) this.wave = 1;
    this.waveDef = this.makeWave(this.wave);
    this.spawned = 0;
    this.spawnT = 0.6;
    this.state = 'playing';
    if (this.waveDef.boss) {
      if (!this.attract) {
        this.banner('BOSS WAVE!', ENEMY_TYPES[this.waveDef.boss].name, 2.6, '#ff6b9d');
        this.addFlash(0.5, '255,120,180');
        this.sfx('bossAppear');
        if (this.cb.onEvent) this.cb.onEvent('boss');
      }
      setTimeout(() => { if (!this.destroyed) this.spawnBoss(this.waveDef.boss, this.waveDef.hpMul || 1); }, this.attract ? 0 : 1200);
    } else if (!this.attract) {
      const label = this.endless ? `WAVE ${String(this.wave).padStart(2, '0')}` : `WAVE ${String(this.wave).padStart(2, '0')}`;
      this.banner(label, this.endless ? '' : `of ${4} + BOSS`, 1.6, '#7fe0ff');
      this.sfx('wave');
    }
  }

  waveClear() {
    this.state = 'waveclear';
    this.stateT = 2.2;
    if (this.attract) return;
    const bonus = 200 * this.wave;
    this.score += bonus;
    this.crystalsRun += 5;
    this.banner('WAVE CLEAR!', `+${bonus}  💎+5`, 1.9, '#7cf29a');
    this.sfx('powerup');
    if (this.cb.onEvent) this.cb.onEvent('waveclear');
  }

  updateSpawning(dt) {
    const d = this.waveDef;
    if (d.boss || this.spawned >= d.count) return;
    this.spawnT -= dt;
    const alive = this.enemies.filter((e) => !e.dead && e.state !== 'flee').length;
    if (this.spawnT > 0 || alive >= d.maxAlive) return;
    this.spawnT = d.interval * rand(0.75, 1.25);
    if (Math.random() < d.swarm && d.count - this.spawned >= 3) {
      const isDragon = d.pool.some((t) => ENEMY_TYPES[t].kind === 'dragon') && (Math.random() < 0.5 || !d.pool.some((t) => ENEMY_TYPES[t].kind === 'dino'));
      const t = isDragon ? 'babyDragon' : 'babyRaptor';
      const n = Math.min(randInt(3, 5), d.count - this.spawned);
      const x0 = rand(-0.6, 0.6);
      for (let i = 0; i < n; i++) {
        const e = this.spawnEnemy(t, d.speedMul, x0 + (i - (n - 1) / 2) * 0.16, 'swarm');
        e.z = -i * 0.025; e.swarmX = x0; e.swarmOff = (i - (n - 1) / 2) * 0.16;
      }
      this.spawned += n;
    } else {
      // later in the wave, tougher creatures appear more often
      const prog = this.spawned / d.count;
      const idx = Math.min(d.pool.length - 1, Math.floor(Math.random() * (d.pool.length * (0.55 + prog * 0.6))));
      this.spawnEnemy(d.pool[idx], d.speedMul);
      this.spawned++;
    }
  }

  spawnEnemy(typeId, speedMul = 1, x = rand(-0.85, 0.85), forceMove) {
    const type = ENEMY_TYPES[typeId];
    const fly = type.kind === 'dragon';
    const e = {
      type, typeId, x, x0: x, tx: x, z: 0, alt: fly ? rand(130, 230) : 0, baseAlt: 0,
      move: forceMove || choice(type.moves), t: rand(0, 5), anim: rand(0, 6), ph: rand(0, TAU),
      hp: type.hp, freeze: 0, freezeFrac: 0, frozen: false, frozenT: 0, crack: 0, hitFlash: 0,
      lastHit: -9, firstHit: -1, milestone: 0, facing: Math.random() < 0.5 ? 1 : -1, hue: rand(0, 360),
      blinkT: rand(0, 50), state: 'normal', alpha: 0, speed: type.speed * speedMul, dodgeCd: rand(0.5, 1.5),
      hopT: rand(0, 1.6), diveT: rand(2, 4.5), diving: 0, dead: false, boss: false,
    };
    e.baseAlt = e.alt;
    this.enemies.push(e);
    return e;
  }

  spawnBoss(typeId, hpMul) {
    const e = this.spawnEnemy(typeId, 1, 0, 'boss');
    e.boss = true;
    e.hp = Math.round(e.type.hp * hpMul * (this.attract ? 0.25 : 1));
    e.alt = e.type.kind === 'dragon' ? 170 : 0;
    e.baseAlt = e.alt;
    e.phase = 1; e.attackT = 3; e.minionT = 6; e.windCd = 5; e.roarT = 2; e.weakCd = 0;
    this.boss = e;
    this.addShake(10);
  }

  spawnFloater() {
    const id = choice(Object.keys(POWERUPS));
    const fromLeft = Math.random() < 0.5;
    this.powerups.push({ id, x: fromLeft ? -40 : this.W + 40, y: rand(this.hy * 0.45, this.hy * 0.95), vx: (fromLeft ? 1 : -1) * rand(70, 110), vy: 0, t: 0, life: 30, floater: true, r: 30 });
  }

  // ------------------------------------------------------------------ cannon & drops
  updateCannon(dt, rdt) {
    if (this.attract) this.attractAI(rdt);
    const pivotX = this.cx;
    let target = Math.atan2(this.aimY - this.pivotY, this.aimX - pivotX);
    if (target > Math.PI / 2) target = -Math.PI + 0.12; // pointing down-left
    else if (target > 0) target = -0.12;
    target = clamp(target, -Math.PI + 0.12, -0.12);
    this.angle = lerp(this.angle, target, 1 - Math.exp(-28 * rdt));
    this.recoil *= Math.exp(-14 * rdt);
    const canFire = this.firing && (this.state === 'playing' || this.state === 'waveclear' || this.state === 'intro') && !this.paused;
    this.heat = clamp(this.heat + (canFire ? rdt * 3 : -rdt * 2), 0, 1);
    if (!canFire) return;
    this.fireT -= dt;
    let interval = 0.072 / this.rateMul;
    if (this.active.rapid) interval *= 0.5;
    while (this.fireT <= 0) {
      this.fireT += interval;
      this.fire(0);
      if (this.active.waterStorm) { this.fire(-0.13); this.fire(0.13); }
    }
  }

  fire(offset) {
    const p = this.dropPool.pop();
    if (!p) return;
    const a = this.angle + offset + rand(-0.025, 0.025);
    const len = 150 - this.recoil * 14;
    const sp = 1150;
    p.x = this.cx + Math.cos(this.angle) * len;
    p.y = this.pivotY + Math.sin(this.angle) * len;
    p.vx = Math.cos(a) * sp; p.vy = Math.sin(a) * sp;
    p.life = 1.2; p.r = rand(6, 9);
    p.col = this.cannon.rainbow ? `hsl(${(this.realTime * 300) % 360},95%,70%)` : choice(this.cannon.drop);
    p.power = this.powerMul * (this.active.waterStorm ? 1.15 : 1);
    p.hit = false;
    this.drops.push(p);
    this.stats.shots++;
    this.recoil = Math.min(1, this.recoil + 0.35);
    this.sfx('shoot', this.cannon.pitch);
    if (Math.random() < 0.5 * this.particles.quality) {
      this.particles.spawn({ x: p.x, y: p.y, vx: Math.cos(a + rand(-0.6, 0.6)) * rand(60, 180), vy: Math.sin(a + rand(-0.6, 0.6)) * rand(60, 180), life: 0.35, size: rand(2, 4), color: p.col, shape: this.cannon.shards ? P.FLAKE : P.CIRCLE, add: true });
    }
  }

  attractAI(rdt) {
    let best = null, bz = -1;
    for (const e of this.enemies) if (!e.dead && !e.frozen && e.state !== 'flee' && e.alpha > 0.5 && e.z > bz) { bz = e.z; best = e; }
    if (best) {
      const [hx, hy] = this.hitCenter(best);
      this.aimX = lerp(this.aimX, hx, 1 - Math.exp(-6 * rdt));
      this.aimY = lerp(this.aimY, hy, 1 - Math.exp(-6 * rdt));
      this.firing = best.z > 0.12;
    } else this.firing = false;
  }

  updateDrops(dt) {
    const D = this.drops;
    for (let i = D.length - 1; i >= 0; i--) {
      const d = D[i];
      d.vx += this.wind * dt;
      d.x += d.vx * dt; d.y += d.vy * dt;
      d.life -= dt;
      let remove = d.life <= 0 || d.y < -40 || d.x < -40 || d.x > this.W + 40 || d.y > this.H + 20;
      if (!remove) remove = this.collide(d);
      if (remove) { D[i] = D[D.length - 1]; D.pop(); this.dropPool.push(d); }
    }
  }

  hitCenter(e) {
    const hs = HIT_SHAPE[e.type.shape];
    return [e.sx, e.sy + hs.y * e.sc, hs.r * e.sc];
  }

  collide(d) {
    // power-ups first (shoot to collect)
    for (const p of this.powerups) {
      if (dist2(d.x, d.y, p.x, p.y) < (p.r + 10) ** 2) { this.collectPowerup(p); this.stats.hits++; return true; }
    }
    for (const s of this.snowballs) {
      if (dist2(d.x, d.y, s.x, s.y) < (s.r + 8) ** 2) {
        s.hp -= 1; this.stats.hits++;
        this.particles.burst(d.x, d.y, 4, { speed: [60, 160], life: [0.2, 0.4], size: [2, 4], color: '#ffffff' });
        if (s.hp <= 0) this.popSnowball(s);
        return true;
      }
    }
    // enemies (nearest first is not needed – stream is dense)
    for (const e of this.enemies) {
      if (e.dead || e.state === 'flee' || e.alpha < 0.4 || e.sc === undefined) continue;
      const hs = HIT_SHAPE[e.type.shape];
      const hx = e.sx, hy = e.sy + hs.y * e.sc, r = hs.r * e.sc;
      if (dist2(d.x, d.y, hx, hy) < (r + d.r) ** 2) {
        this.hitEnemy(e, d);
        return true;
      }
    }
    return false;
  }

  hitEnemy(e, d) {
    this.stats.hits++;
    this.reticleHit = 1;
    if (this.hint && this.hint.text.startsWith('HOLD')) this.hint = { text: 'Freeze them 100% to SHATTER! ❄', t: 0 };
    if (e.frozen) {
      this.particles.burst(d.x, d.y, 2, { speed: [40, 120], life: [0.2, 0.4], size: [1.5, 3], color: '#ffffff', shape: P.STAR, add: true });
      return;
    }
    let power = d.power;
    if (e.boss) {
      const [wx, wy, wr] = this.weakPoint(e);
      if (dist2(d.x, d.y, wx, wy) < (wr + 14) ** 2) {
        power *= 2.5;
        if (e.weakCd <= 0) { e.weakCd = 1.2; this.particles.text(wx, wy - 30, 'WEAK SPOT!', { size: 26, color: '#ffe066', vy: -80 }); }
      }
    }
    this.addFreeze(e, power);
    e.hitFlash = 1;
    this.score += 10 * this.mult() * (this.active.score2x ? 2 : 1);
    // splash
    const q = this.particles;
    q.burst(d.x, d.y, 3, { angle: Math.atan2(-d.vy, -d.vx), spread: 1.1, speed: [80, 240], life: [0.25, 0.5], size: [2, 4.5], color: d.col, g: 500, add: true });
    if (Math.random() < 0.35) q.spawn({ x: d.x, y: d.y, vx: rand(-30, 30), vy: rand(-60, -20), life: 0.6, size: rand(3, 6), color: 'rgba(255,255,255,0.8)', shape: P.BUBBLE });
    if (this.cannon.sparkle && Math.random() < 0.3) q.spawn({ x: d.x, y: d.y, vx: rand(-80, 80), vy: rand(-80, 20), life: 0.5, size: 3, color: '#fff3a0', shape: P.STAR, add: true });
    this.sfx('hit');
  }

  addFreeze(e, amount) {
    if (e.frozen || e.dead) return;
    e.freeze = Math.min(e.hp, e.freeze + amount);
    e.lastHit = this.time;
    if (e.firstHit < 0) e.firstHit = this.time;
    const f = e.freeze / e.hp;
    e.freezeFrac = f;
    const [hx, hy] = this.hitCenter(e);
    const m = this.mult() * (this.active.score2x ? 2 : 1);
    if (!e.boss && e.milestone < 1 && f >= 0.25) { e.milestone = 1; this.score += 25 * m; this.particles.text(hx, hy - 20, `+${25 * m}`, { size: 20, color: '#bdeeff' }); this.sfx('freezeTick', 0); }
    if (!e.boss && e.milestone < 2 && f >= 0.5) { e.milestone = 2; this.score += 50 * m; this.particles.text(hx, hy - 30, `+${50 * m}`, { size: 22, color: '#8fdcff' }); this.sfx('freezeTick', 1); }
    if (!e.boss && e.milestone < 3 && f >= 0.75) { e.milestone = 3; this.sfx('freezeTick', 2); }
    if (f >= 1) this.freezeFull(e, false);
  }

  freezeFull(e, bySuper) {
    if (e.frozen || e.dead) return;
    e.frozen = true;
    e.freeze = e.hp; e.freezeFrac = 1;
    e.frozenT = e.boss ? 1.6 : bySuper ? 99 : FROZEN_TIME;
    e.crack = 0;
    this.stats.frozen++;
    if (e.type.kind === 'dino') this.stats.dinoFrozen++; else this.stats.dragonFrozen++;
    const [hx, hy, r] = this.hitCenter(e);
    const m = this.mult() * (this.active.score2x ? 2 : 1);
    let pts = 100 * m;
    if (!bySuper && !e.boss && this.time - e.firstHit < 1.4) {
      pts += 100 * m;
      this.particles.text(hx, hy - r - 26, 'PERFECT FREEZE!', { size: 26, color: '#ffe066', glow: '#7fdcff', life: 1.3 });
    }
    this.score += pts;
    this.particles.text(hx, hy - r, `+${pts}`, { size: 28, color: '#e8fbff' });
    this.particles.burst(hx, hy, 14, { speed: [60, 200], life: [0.4, 0.8], size: [3, 7], color: ICE_COLS, shape: P.FLAKE, add: true });
    this.particles.spawn({ x: hx, y: hy, life: 0.45, size: r * 1.8, size1: r * 0.6, color: 'rgba(190,240,255,0.9)', shape: P.RING, vrot: 0, add: true });
    this.sfx('frozen');
    if (!this.attract) this.superEnergy = Math.min(100, this.superEnergy + 4 * this.energyMul * (e.boss ? 0 : 1));
    if (this.hint && this.hint.text.startsWith('Freeze')) { this.hint = { text: '💥 Combo freezes = more points!', t: 0, end: 3 }; }
  }

  mult() { const c = this.combo; return c >= 10 ? 5 : c >= 5 ? 3 : c >= 3 ? 2 : 1; }

  shatter(e, superBonus = 1) {
    if (e.dead) return;
    e.dead = true;
    const [hx, hy, r] = this.hitCenter(e);
    const big = e.boss;
    const sz = e.type.size;
    // combo
    this.combo++;
    this.comboT = 3.8;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    const m = this.mult();
    const pts = Math.round((e.type.score + 150) * m * (this.active.score2x ? 2 : 1) * superBonus);
    this.score += pts;
    this.stats.shattered++;
    this.crystalsRun += big ? 50 : 1;
    // text
    this.particles.text(hx, hy, `+${pts}`, { size: big ? 64 : 30 + Math.min(20, pts / 60), color: m > 1 ? '#ffd84d' : '#ffffff', glow: m > 2 ? '#ff6bd5' : null, life: big ? 2 : 1.2 });
    if (!this.attract && this.combo >= 3 && superBonus === 1) {
      const label = this.combo >= 20 ? 'MEGA COMBO!!' : this.combo >= 10 ? 'SUPER COMBO!' : `COMBO x${this.combo}`;
      if (this.combo === 3 || this.combo === 5 || this.combo >= 10 && (this.combo % 5 === 0) || this.combo === 20) {
        this.banner(label, `x${m} POINTS`, 1.1, this.combo >= 10 ? '#ff6bd5' : '#ffb84d', true);
        this.sfx('combo', this.combo);
      } else this.particles.text(hx, hy - r - 20, label, { size: 22, color: '#ffb84d', vy: -90 });
      if (this.combo % 5 === 0) this.crystalsRun += 5;
    }
    // particles
    const q = this.particles;
    const k = big ? 3 : Math.max(0.8, sz);
    q.burst(hx, hy, 16 * k, { speed: [150, 520 * (big ? 1.4 : 1)], life: [0.6, 1.3], size: [4 * k * 0.7, 10 * k * 0.7], color: ICE_COLS, shape: P.SHARD, g: 900, drag: 0.985, floor: e.gy + 6 });
    q.burst(hx, hy, 8 * k, { speed: [100, 380], life: [0.8, 1.5], size: [4, 8 * Math.min(2, k)], color: ['#d8f6ff', '#a8e6ff', '#ffffff'], shape: P.CUBE, g: 1000, drag: 0.99, floor: e.gy + 4 });
    q.burst(hx, hy, 14 * k, { speed: [40, 260], life: [0.6, 1.4], size: [3, 6], color: '#ffffff', shape: P.FLAKE, g: 60, drag: 0.95, add: true });
    q.burst(hx, hy, 14 * k, { speed: [80, 300], life: [0.4, 0.9], size: [2, 5], color: ['#fff6a0', '#bff6ff', '#ffc2f0'], shape: P.STAR, drag: 0.93, add: true });
    q.spawn({ x: hx, y: hy, life: 0.5, size: r * 2.6 * (big ? 2 : 1), size1: r * 0.4, color: 'rgba(220,250,255,0.95)', shape: P.RING, vrot: 0, add: true });
    // feel
    this.addShake(big ? 28 : 5 + sz * 3);
    if (superBonus === 1) this.slowMo(big ? 0.25 : 0.45, big ? 1.4 : 0.08);
    this.sfx('crack');
    this.sfx('shatter', big);
    if (!this.attract) this.superEnergy = Math.min(100, this.superEnergy + 5 * this.energyMul);
    // power-up drop
    if (!this.attract && !big && Math.random() < 0.09) this.powerups.push({ id: choice(Object.keys(POWERUPS)), x: hx, y: hy, vx: 0, vy: -30, t: 0, life: 8, r: 28 });
    if (big) this.bossDefeated(e, hx, hy);
  }

  bossDefeated(e, hx, hy) {
    this.boss = null;
    this.stats.bosses++;
    this.addFlash(1);
    this.sfx('bossDefeat');
    if (this.attract) { this.waveClear(); return; }
    this.banner('MEGA ICE SHATTER!', `BOSS +${e.type.score} 💎+50`, 2.6, '#7fdcff');
    this.score += e.type.score;
    for (let i = 0; i < 4; i++) setTimeout(() => {
      if (this.destroyed) return;
      this.particles.burst(rand(this.W * 0.2, this.W * 0.8), rand(this.H * 0.15, this.H * 0.5), 30, { speed: [100, 400], life: [0.8, 1.6], size: [3, 6], color: ['#ff6b9d', '#ffd84d', '#7fdcff', '#7cf29a', '#c48bff'], shape: P.STAR, g: 200, add: true });
      this.sfx('pop');
    }, 300 + i * 350);
    // remaining minions shatter too
    for (const m of this.enemies) if (!m.dead && m !== e && m.state !== 'flee') { this.freezeFull(m, true); m.frozenT = 0.3 + Math.random() * 0.5; }
    if (this.endless) { this.state = 'waveclear'; this.stateT = 3.2; this.switchTheme(); }
    else { this.state = 'complete'; this.stateT = 3.4; }
  }

  switchTheme() {
    const list = ENDLESS_THEMES[this.mode];
    const idx = (list.indexOf(this.themeIndex) + 1) % list.length;
    this.themeIndex = list[idx];
    this.level = LEVELS[this.themeIndex];
    setTimeout(() => {
      if (this.destroyed) return;
      this.bg = new Background(this.level.id); this.bg.resize(this.W, this.H, this.lowQ ? 0.5 : 1);
      this.addFlash(0.8);
      if (this.cb.onEvent) this.cb.onEvent('theme', this.themeIndex);
    }, 2400);
  }

  // ------------------------------------------------------------------ enemies
  project(e) {
    const z = clamp(e.z, 0, 1.05);
    const zz = z * z * 0.45 + z * 0.55;
    e.gy = this.hy + (this.nearY - this.hy) * zz;
    const far = this.farScale || 0.3;
    e.s = far + (1.1 - far) * zz;
    e.sx = this.cx + e.x * (this.W * 0.14 + this.W * 0.34 * zz) * (this.laneSpread || 1);
    e.sc = e.s * e.type.size * 0.85 * (this.enemyScale || 1);
    e.sy = e.gy - e.alt * e.s * (this.altScale || 1);
  }

  updateEnemies(dt) {
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.t += dt;
      e.blinkT += dt * 2.3;
      e.hitFlash = Math.max(0, e.hitFlash - dt * 6);
      if (e.weakCd > 0) e.weakCd -= dt;
      if (e.state !== 'flee') e.alpha = Math.min(1, e.alpha + dt * 2.5);
      if (e.frozen) {
        e.frozenT -= dt;
        const total = e.boss ? 1.6 : FROZEN_TIME;
        e.crack = clamp(1 - e.frozenT / total, 0, 1);
        if (e.frozenT <= 0) this.shatter(e, e.superShatter ? 2 : 1);
        this.project(e);
        continue;
      }
      // freeze slowly melts when not being hit
      if (this.time - e.lastHit > (e.boss ? 1.6 : 1.1) && e.freeze > 0) {
        const rate = e.boss ? 0.02 : e.type.warm ? 0.16 : 0.09;
        e.freeze = Math.max(0, e.freeze - e.hp * rate * dt);
        e.freezeFrac = e.freeze / e.hp;
        if (e.freezeFrac < 0.5 && e.milestone > 1) e.milestone = 1;
        if (e.freezeFrac < 0.25) e.milestone = 0;
      }
      const slow = 1 - 0.65 * e.freezeFrac;
      e.anim += dt * (e.type.kind === 'dragon' ? 6 : 8) * slow * (0.6 + e.speed * 6);
      const prevX = e.x;
      if (e.state === 'flee') {
        e.z -= dt * 0.5; e.alpha -= dt * 1.2; e.x += e.fleeDir * dt * 0.8;
        if (e.alt < 400 && e.type.kind === 'dragon') e.alt += dt * 200;
        if (e.alpha <= 0) e.dead = true;
        this.project(e);
        continue;
      }
      if (e.boss) { this.updateBoss(e, dt); this.project(e); continue; }
      const sp = e.speed * slow;
      switch (e.move) {
        case 'zigzag':
          e.z += sp * dt;
          e.x = e.x0 + Math.sin(e.t * 1.7 + e.ph) * 0.45;
          break;
        case 'jump': {
          e.hopT += dt * slow;
          const k = (e.hopT % 1.7) / 1.7;
          if (k < 0.32) { const j = k / 0.32; e.alt = Math.sin(j * Math.PI) * 70; e.z += sp * 2.6 * dt; }
          else { e.alt = 0; e.z += sp * 0.35 * dt; }
          e.x += (e.tx - e.x) * dt * 0.5;
          if (Math.random() < dt * 0.3) e.tx = clamp(e.x + rand(-0.4, 0.4), -0.9, 0.9);
          break;
        }
        case 'dodge': {
          e.z += sp * dt;
          e.dodgeCd -= dt;
          if (e.dodgeCd <= 0 && e.freezeFrac < 0.85) {
            const [hx, hy, r] = this.hitCenter(e);
            for (const d of this.drops) {
              if (d.vy < 0 && d.y > hy && d.y - hy < 220 && Math.abs(d.x - hx) < r * 1.4) {
                e.tx = clamp(e.x + (d.x < hx ? 0.45 : -0.45), -0.95, 0.95);
                e.dodgeCd = rand(1.4, 2.4);
                e.alt = 0; e.hopT = 0;
                break;
              }
            }
          }
          e.x += (e.tx - e.x) * dt * 3.5;
          break;
        }
        case 'fly':
          e.z += sp * 0.85 * dt;
          e.x = e.x0 + Math.sin(e.t * 1.1 + e.ph) * 0.5;
          e.alt = e.baseAlt + Math.sin(e.t * 2 + e.ph) * 30;
          break;
        case 'dive':
          e.z += sp * 0.75 * dt;
          e.x = e.x0 + Math.sin(e.t * 1.3 + e.ph) * 0.4;
          e.diveT -= dt;
          if (e.diveT <= 0 && e.diving <= 0) { e.diving = 1.6; e.diveT = rand(3.5, 5.5); }
          if (e.diving > 0) {
            e.diving -= dt;
            const k = 1 - e.diving / 1.6;
            e.alt = e.baseAlt * (1 - Math.sin(k * Math.PI) * 0.85);
            e.z += sp * 2.2 * Math.sin(k * Math.PI) * dt;
          } else e.alt = e.baseAlt + Math.sin(e.t * 2 + e.ph) * 25;
          break;
        case 'swarm':
          e.z += sp * dt;
          e.swarmX = e.swarmX + Math.sin(e.t * 1.2) * dt * 0.25;
          e.x = e.swarmX + e.swarmOff + Math.sin(e.t * 3 + e.swarmOff * 10) * 0.03;
          if (e.type.kind === 'dragon') e.alt = 170 + Math.sin(e.t * 2.5 + e.swarmOff * 8) * 20;
          break;
        default: // walk
          e.z += sp * dt;
          e.x += (e.tx - e.x) * dt * 0.6;
          if (Math.random() < dt * 0.4) e.tx = clamp(e.x + rand(-0.35, 0.35), -0.9, 0.9);
      }
      e.x = clamp(e.x, -1.05, 1.05);
      const dx = e.x - prevX;
      if (Math.abs(dx) > 0.0015) e.facing = dx > 0 ? 1 : -1;
      this.project(e);
      if (e.z >= 1) this.bump(e);
    }
    // remove dead
    if (this.enemies.some((e) => e.dead)) this.enemies = this.enemies.filter((e) => !e.dead);
  }

  bump(e) {
    e.state = 'flee';
    e.fleeDir = e.x < 0 ? -1 : 1;
    if (this.attract) return;
    if (this.active.shield) {
      this.particles.text(e.sx, e.sy - 120, 'BLOCKED!', { size: 30, color: '#7cf29a' });
      this.sfx('pop');
      return;
    }
    const dmg = e.type.size >= 1.3 ? 18 : e.type.size >= 1.1 ? 14 : 10;
    this.shield = Math.max(0, this.shield - dmg);
    this.combo = 0; this.comboT = 0;
    this.cannonShake = 1;
    this.addShake(12);
    this.addFlash(0.25, '255,190,120');
    this.particles.text(this.cx + rand(-60, 60), this.cy - 150, choice(['BONK!', 'BOING!', 'OOPS!', 'BUMP!']), { size: 40, color: '#ffb84d', vy: -50 });
    this.particles.burst(this.cx, this.cy - 40, 14, { speed: [100, 300], life: [0.4, 0.8], size: [3, 6], color: ['#ffd84d', '#ffffff'], shape: P.STAR, add: true });
    this.sfx('bump');
    if (this.shield <= 0) this.gameOver();
  }

  // ------------------------------------------------------------------ boss
  weakPoint(e) {
    const w = WEAK_POINT[e.type.shape];
    return [e.sx + w[0] * e.sc * e.facing, e.sy + w[1] * e.sc, 13 * e.sc];
  }

  updateBoss(e, dt) {
    const f = e.freezeFrac;
    const ph = f < 0.4 ? 1 : f < 0.75 ? 2 : 3;
    if (ph > e.phase) {
      e.phase = ph;
      if (!this.attract) {
        this.banner(ph === 2 ? 'BOSS IS GETTING CHILLY!' : 'ALMOST FROZEN!', ph === 2 ? 'Watch out for helpers!' : 'Brrr… keep going!', 1.6, '#ff9ad5', true);
        this.sfx('roar');
      }
      this.addShake(8);
    }
    const spd = [0, 0.5, 0.7, 0.9][e.phase];
    // approach then patrol
    const targetZ = 0.36 + Math.sin(e.t * 0.35) * 0.06;
    e.z += (targetZ - e.z) * dt * 0.8;
    const prevX = e.x;
    e.x = Math.sin(e.t * spd) * 0.62;
    if (e.type.kind === 'dragon') e.alt = e.baseAlt + Math.sin(e.t * 1.4) * 40;
    else { const k = (e.t % 3.2) / 3.2; e.alt = k < 0.2 ? Math.sin((k / 0.2) * Math.PI) * 50 : 0; if (k >= 0.2 && e.lastStomp !== Math.floor(e.t / 3.2)) { e.lastStomp = Math.floor(e.t / 3.2); this.addShake(5); } }
    if (Math.abs(e.x - prevX) > 0.0005) e.facing = e.x > prevX ? 1 : -1;
    e.anim += dt * 5;
    if (e.frozen || e.alpha < 1) return;
    // attacks (all harmless & playful)
    e.attackT -= dt;
    if (e.attackT <= 0) {
      e.attackT = [0, 3.2, 2.5, 2.0][e.phase] * rand(0.85, 1.15);
      this.throwSnowball(e);
    }
    if (e.phase >= 2) {
      e.minionT -= dt;
      if (e.minionT <= 0) {
        e.minionT = 7;
        const t = e.type.kind === 'dragon' ? 'babyDragon' : 'babyRaptor';
        for (let i = 0; i < 2; i++) { const m = this.spawnEnemy(t, 1.1, clamp(e.x + (i ? 0.25 : -0.25), -0.9, 0.9)); m.z = e.z; }
        this.sfx('roar');
      }
    }
    if (e.phase >= 3) {
      e.windCd -= dt;
      if (e.windCd <= 0) {
        e.windCd = 6.5;
        this.wind = (Math.random() < 0.5 ? -1 : 1) * 380;
        this.windT = 2.4;
        if (!this.attract) this.particles.text(this.W / 2, this.hy + 40, '💨 WINDY! 💨', { size: 30, color: '#ffffff', vy: -20, life: 1.6 });
        this.sfx('whoosh');
      }
    }
  }

  throwSnowball(e) {
    const [hx, hy] = this.hitCenter(e);
    const tx = this.cx + rand(-120, 120), ty = this.cy - 60;
    const T = 1.9;
    this.snowballs.push({ x: hx, y: hy, sx: hx, sy: hy, tx, ty, t: 0, T, r: 12, hp: 2, rot: 0 });
    this.sfx('whoosh');
  }

  updateSnowballs(dt) {
    for (let i = this.snowballs.length - 1; i >= 0; i--) {
      const s = this.snowballs[i];
      s.t += dt;
      const k = s.t / s.T;
      s.x = lerp(s.sx, s.tx, k);
      s.y = lerp(s.sy, s.ty, k) - Math.sin(k * Math.PI) * 120;
      s.r = 12 + k * 26;
      s.rot += dt * 5;
      if (k >= 1) {
        this.snowballs.splice(i, 1);
        if (this.attract) continue;
        this.particles.burst(s.x, s.y, 20, { speed: [80, 300], life: [0.4, 0.8], size: [3, 7], color: '#ffffff', g: 600 });
        if (this.active.shield) { this.particles.text(s.x, s.y - 40, 'BLOCKED!', { size: 26, color: '#7cf29a' }); continue; }
        this.shield = Math.max(0, this.shield - 6);
        this.splat = 1.8;
        this.cannonShake = 0.6;
        this.sfx('splat');
        this.particles.text(s.x, s.y - 50, 'SPLAT!', { size: 34, color: '#ffffff', vy: -40 });
        if (this.shield <= 0) this.gameOver();
      }
    }
  }

  popSnowball(s) {
    const i = this.snowballs.indexOf(s);
    if (i >= 0) this.snowballs.splice(i, 1);
    this.score += 25;
    this.particles.burst(s.x, s.y, 16, { speed: [80, 260], life: [0.3, 0.7], size: [2, 5], color: ['#ffffff', '#d8f6ff'], shape: P.FLAKE, add: true });
    this.particles.text(s.x, s.y - 20, '+25', { size: 22, color: '#ffffff' });
    this.sfx('pop');
  }

  // ------------------------------------------------------------------ power-ups
  updatePowerups(dt) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.t += dt; p.life -= dt;
      if (p.floater) { p.x += p.vx * dt; p.y += Math.sin(p.t * 2) * 20 * dt; if (p.x < -80 || p.x > this.W + 80) p.life = 0; }
      else { p.y += p.vy * dt; p.vy *= Math.pow(0.97, dt * 60); p.y += Math.sin(p.t * 3) * 10 * dt; }
      if (p.life <= 0) this.powerups.splice(i, 1);
    }
  }

  collectPowerup(p) {
    const i = this.powerups.indexOf(p);
    if (i >= 0) this.powerups.splice(i, 1);
    const def = POWERUPS[p.id];
    this.stats.powerups++;
    this.sfx('powerup');
    this.particles.burst(p.x, p.y, 24, { speed: [80, 320], life: [0.4, 0.9], size: [3, 6], color: [def.color, '#ffffff'], shape: P.STAR, add: true });
    this.particles.spawn({ x: p.x, y: p.y, life: 0.5, size: 90, size1: 10, color: def.color, shape: P.RING, vrot: 0, add: true });
    this.particles.text(p.x, p.y - 40, `${def.icon} ${def.name}`, { size: 30, color: def.color, life: 1.5, vy: -50 });
    switch (p.id) {
      case 'megaFreeze':
        for (const e of this.enemies) if (!e.dead && e.state !== 'flee') this.addFreeze(e, e.hp * (e.boss ? 0.15 : 0.55));
        this.addFlash(0.4, '180,240,255');
        break;
      case 'shield':
        this.shield = Math.min(100, this.shield + 20);
        this.active.shield = def.duration;
        break;
      case 'crystal':
        this.crystalsRun += 25;
        this.score += 500;
        this.sfx('coin');
        break;
      case 'iceBomb': {
        this.particles.spawn({ x: p.x, y: p.y, life: 0.7, size: 300, size1: 20, color: 'rgba(170,240,255,1)', shape: P.RING, vrot: 0, add: true });
        this.addShake(10);
        for (const e of this.enemies) {
          if (e.dead || e.state === 'flee') continue;
          const [hx, hy] = this.hitCenter(e);
          if (dist2(hx, hy, p.x, p.y) < 300 * 300) e.boss ? this.addFreeze(e, e.hp * 0.2) : this.freezeFull(e, false);
        }
        break;
      }
      default:
        this.active[p.id] = def.duration;
    }
  }

  // ------------------------------------------------------------------ super freeze
  triggerSuper() {
    if (this.attract || this.paused || this.superEnergy < 100 || this.super || this.state === 'gameover' || this.state === 'complete') return false;
    this.superEnergy = 0;
    this.stats.supers++;
    this.super = { t: 0, r: 0, shattered: false };
    this.slowMo(0.25, 1.6);
    this.addFlash(0.9, '200,245,255');
    this.addShake(14);
    this.sfx('superFreeze');
    this.banner('SUPER FREEZE!', '❄ ❄ ❄', 1.8, '#9ff0ff', true);
    return true;
  }

  updateSuper(rdt) {
    const s = this.super;
    if (!s) return;
    s.t += rdt;
    s.r = Math.min(this.W * 1.2, s.t * this.W * 1.1);
    for (const e of this.enemies) {
      if (e.dead || e.frozen || e.state === 'flee' || e.sx === undefined) continue;
      const [hx, hy] = this.hitCenter(e);
      if (Math.hypot(hx - this.cx, hy - this.pivotY) < s.r) {
        if (e.boss) { if (!e.superHit) { e.superHit = true; this.addFreeze(e, e.hp * 0.35); } }
        else { this.freezeFull(e, true); e.superShatter = true; }
      }
    }
    if (this.snowballs.length && s.t > 0.3) { this.snowballs.slice().forEach((b) => this.popSnowball(b)); }
    if (s.t > 1.6 && !s.shattered) {
      s.shattered = true;
      let n = 0;
      for (const e of this.enemies) if (e.superShatter && !e.dead) { e.frozenT = 0.02 + n * 0.06; n++; }
      this.addShake(20);
      this.addFlash(0.6);
    }
    if (s.t > 2.2) { this.super = null; for (const e of this.enemies) e.superHit = false; }
  }

  // ------------------------------------------------------------------ end states
  gameOver() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.firing = false;
    this.slowMo(0.3, 1);
    this.sfx('gameOver');
    setTimeout(() => { if (!this.destroyed) { this.finish('gameover'); this.paused = true; } }, 1100);
  }

  revive() {
    this.revived = true;
    this.shield = 100;
    this.state = this.boss || (this.waveDef && this.spawned < this.waveDef.count) ? 'playing' : 'playing';
    this.snowballs = [];
    this.active.shield = 4;
    for (const e of this.enemies) if (!e.dead && !e.boss && e.state !== 'flee') { this.freezeFull(e, true); e.frozenT = 0.4 + Math.random() * 0.4; }
    this.addFlash(0.8, '180,255,200');
    this.banner('SECOND CHANCE!', 'Shield restored 🛡', 1.8, '#7cf29a');
    this.paused = false;
    this.last = performance.now();
  }

  results() {
    const acc = this.stats.shots ? Math.round((this.stats.hits / this.stats.shots) * 100) : 0;
    const stars = this.shield >= 70 ? 3 : this.shield >= 35 ? 2 : 1;
    return {
      mode: this.mode, levelIndex: this.levelIndex, score: Math.floor(this.score), wave: this.wave,
      frozen: this.stats.frozen, shattered: this.stats.shattered, dinoFrozen: this.stats.dinoFrozen, dragonFrozen: this.stats.dragonFrozen,
      maxCombo: this.maxCombo, accuracy: acc, bosses: this.stats.bosses, supers: this.stats.supers, powerups: this.stats.powerups,
      crystals: this.crystalsRun, shield: Math.round(this.shield), stars, revived: this.revived,
    };
  }

  finish(kind) {
    if (this.cb.onEvent) this.cb.onEvent(kind, this.results());
  }

  emitHud() {
    if (!this.cb.onHud) return;
    const b = this.boss;
    this.cb.onHud({
      score: Math.floor(this.score), wave: this.wave, waveTotal: this.endless ? 0 : 5, isBoss: !!b,
      shield: this.shield, superEnergy: this.superEnergy, combo: this.combo, mult: this.mult(), comboT: this.comboT,
      active: Object.keys(this.active).map((k) => ({ id: k, icon: POWERUPS[k].icon, left: this.active[k], dur: POWERUPS[k].duration })),
      bossFreeze: b ? b.freezeFrac : null, bossName: b ? b.type.name : '', bossPhase: b ? b.phase : 0,
      crystals: this.crystalsRun, levelName: this.endless ? (this.mode === 'dino' ? 'Dino World' : 'Dragon World') : this.level.name,
    });
  }

  banner(text, sub, dur, color, small = false) {
    if (small) this.banners = this.banners.filter((b) => !b.small);
    this.banners.push({ text, sub, dur, color, t: 0, small });
  }

  // ------------------------------------------------------------------ render
  render(dt) {
    const ctx = this.ctx;
    const t = this.realTime;
    ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    ctx.save();
    if (this.shake > 0.3) ctx.translate(rand(-this.shake, this.shake), rand(-this.shake, this.shake));
    const par = ((this.aimX - this.W / 2) / this.W) * 70;
    this.bg.drawBack(ctx, par, t, dt);

    // enemies far -> near
    const list = this.enemies.filter((e) => e.sx !== undefined).sort((a, b) => a.z - b.z);
    for (const e of list) this.drawEnemyFull(ctx, e, t);

    this.drawPowerups(ctx, t);
    this.drawSnowballs(ctx);
    this.drawDrops(ctx);
    this.particles.draw(ctx);
    // cannon
    const cs = this.cannonShake > 0 ? Math.sin(t * 60) * 8 * this.cannonShake : 0;
    if (this.active.shield) this.drawBubble(ctx, t);
    drawCannon(ctx, this.cx + cs, this.cy, this.cannon, { angle: this.angle, recoil: this.recoil, firing: this.firing, heat: this.heat, t }, this.W < 1000 ? 0.9 : 1);
    if (!this.attract) this.drawAim(ctx, t);
    this.bg.drawAmbient(ctx, dt, t, this.settings.reducedMotion);
    if (this.super) this.drawSuperWave(ctx);
    if (this.wind) this.drawWind(ctx, t);
    this.particles.drawTexts(ctx);
    ctx.restore();

    this.drawBanners(ctx);
    if (this.hint && !this.attract) this.drawHint(ctx);
    if (this.splat > 0) this.drawSplat(ctx);
    if (!this.attract && this.shield < 30 && this.state !== 'gameover') {
      const a = 0.18 + 0.12 * Math.sin(t * 5);
      const g = ctx.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.4, this.W / 2, this.H / 2, this.W * 0.7);
      g.addColorStop(0, 'rgba(255,140,90,0)'); g.addColorStop(1, `rgba(255,140,90,${a})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, this.W, this.H);
    }
    if (this.flash > 0) { ctx.fillStyle = `rgba(${this.flashCol},${Math.min(0.85, this.flash)})`; ctx.fillRect(0, 0, this.W, this.H); }
  }

  drawEnemyFull(ctx, e, t) {
    const sc = e.sc;
    // shadow
    ctx.save();
    const alt = e.alt;
    ctx.globalAlpha = e.alpha * clamp(0.35 - alt / 900, 0.1, 0.35);
    ctx.fillStyle = '#1a1035';
    ctx.beginPath(); ctx.ellipse(e.sx, e.gy, 55 * sc * (1 - alt / 800), 12 * sc, 0, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = e.alpha;
    ctx.translate(e.sx, e.sy);
    const squash = e.hitFlash > 0 ? 1 + e.hitFlash * 0.06 : 1;
    ctx.scale(sc * e.facing * squash, sc / squash);
    drawEnemy(ctx, e, t);
    ctx.restore();
    // boss weak point gem
    if (e.boss && !e.frozen) {
      const [wx, wy, wr] = this.weakPoint(e);
      const pulse = 1 + Math.sin(t * 6) * 0.15;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(wx, wy, 0, wx, wy, wr * 2.2 * pulse);
      g.addColorStop(0, 'rgba(255,255,200,0.95)'); g.addColorStop(0.4, 'rgba(255,215,90,0.6)'); g.addColorStop(1, 'rgba(255,200,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(wx, wy, wr * 2.2 * pulse, 0, TAU); ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#fff6c0'; ctx.strokeStyle = '#ff9f1a'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(wx, wy - wr); ctx.lineTo(wx + wr * 0.8, wy); ctx.lineTo(wx, wy + wr); ctx.lineTo(wx - wr * 0.8, wy); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    // small freeze meter above normal enemies
    if (!e.boss && e.freezeFrac > 0 && !e.frozen && e.state !== 'flee') {
      const [hx, hy, r] = this.hitCenter(e);
      const w = Math.max(40, r * 1.3), y = hy - r - 16;
      ctx.fillStyle = 'rgba(20,20,60,0.55)'; roundRect(ctx, hx - w / 2 - 2, y - 2, w + 4, 10, 5); ctx.fill();
      const g = ctx.createLinearGradient(hx - w / 2, 0, hx + w / 2, 0);
      g.addColorStop(0, '#9be7ff'); g.addColorStop(1, '#ffffff');
      ctx.fillStyle = g; roundRect(ctx, hx - w / 2, y, w * e.freezeFrac, 6, 3); ctx.fill();
      ctx.font = '14px "Fredoka", sans-serif'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8fbff'; ctx.fillText('❄', hx - w / 2 - 4, y + 3);
    }
  }

  drawDrops(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const d of this.drops) {
      ctx.strokeStyle = d.col;
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = d.r * 2.4;
      ctx.beginPath(); ctx.moveTo(d.x - d.vx * 0.035, d.y - d.vy * 0.035); ctx.lineTo(d.x, d.y); ctx.stroke();
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = d.r * 1.1;
      ctx.beginPath(); ctx.moveTo(d.x - d.vx * 0.018, d.y - d.vy * 0.018); ctx.lineTo(d.x, d.y); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    for (const d of this.drops) { ctx.beginPath(); ctx.arc(d.x, d.y, d.r * 0.35, 0, TAU); ctx.fill(); }
    ctx.restore();
  }

  drawPowerups(ctx, t) {
    for (const p of this.powerups) {
      const def = POWERUPS[p.id];
      const blink = p.life < 2 && Math.sin(t * 20) > 0;
      if (blink) continue;
      const bob = Math.sin(p.t * 3) * 4;
      const x = p.x, y = p.y + bob;
      ctx.save();
      if (p.floater) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y + p.r); ctx.quadraticCurveTo(x + 8, y + p.r + 20, x, y + p.r + 40); ctx.stroke(); }
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 4, x, y, p.r * 1.8);
      g.addColorStop(0, def.color); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 0.6; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, p.r * 1.8, 0, TAU); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      const g2 = ctx.createRadialGradient(x - 8, y - 10, 2, x, y, p.r);
      g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.35, def.color); g2.addColorStop(1, '#2a1a6a');
      ctx.fillStyle = g2; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, TAU); ctx.fill(); ctx.stroke();
      // rotating sparkle ring
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.arc(x, y, p.r + 8, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `${Math.round(p.r * 1.0)}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(def.icon, x, y + 2);
      ctx.restore();
    }
  }

  drawSnowballs(ctx) {
    for (const s of this.snowballs) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath(); ctx.ellipse(s.x, lerp(s.sy, s.ty, s.t / s.T) + s.r, s.r, s.r * 0.3, 0, 0, TAU); ctx.fill();
      ctx.translate(s.x, s.y); ctx.rotate(s.rot);
      const g = ctx.createRadialGradient(-s.r * 0.3, -s.r * 0.3, 2, 0, 0, s.r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#bcdcf5');
      ctx.fillStyle = g; ctx.strokeStyle = '#7fb3e0'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(0, 0, s.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(150,190,230,0.6)';
      ctx.beginPath(); ctx.arc(s.r * 0.3, s.r * 0.2, s.r * 0.2, 0, TAU); ctx.arc(-s.r * 0.25, s.r * 0.4, s.r * 0.12, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  drawBubble(ctx, t) {
    const left = this.active.shield;
    if (left < 1.5 && Math.sin(t * 25) > 0) return;
    ctx.save();
    const r = 150 + Math.sin(t * 4) * 4;
    const g = ctx.createRadialGradient(this.cx, this.cy - 40, r * 0.6, this.cx, this.cy - 40, r);
    g.addColorStop(0, 'rgba(124,242,154,0)'); g.addColorStop(0.85, 'rgba(124,242,154,0.25)'); g.addColorStop(1, 'rgba(200,255,220,0.7)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(this.cx, this.cy - 40, r, Math.PI, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(220,255,230,0.8)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.cx, this.cy - 40, r, Math.PI * 1.1, Math.PI * 1.3); ctx.stroke();
    ctx.restore();
  }

  drawAim(ctx, t) {
    const len = 150 - this.recoil * 14;
    const nx = this.cx + Math.cos(this.angle) * len, ny = this.pivotY + Math.sin(this.angle) * len;
    // aim point along barrel direction at the cursor distance
    const dist = Math.max(80, Math.hypot(this.aimX - nx, this.aimY - ny));
    const rx = nx + Math.cos(this.angle) * dist, ry = ny + Math.sin(this.angle) * dist;
    // is reticle over a creature?
    let over = false;
    for (const e of this.enemies) {
      if (e.dead || e.state === 'flee' || e.sx === undefined) continue;
      const [hx, hy, r] = this.hitCenter(e);
      if (dist2(rx, ry, hx, hy) < r * r) { over = true; break; }
    }
    if (this.settings.aimLine) {
      ctx.save();
      ctx.strokeStyle = over ? 'rgba(255,230,120,0.55)' : 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 3; ctx.setLineDash([4, 12]); ctx.lineDashOffset = -t * 60;
      ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(rx, ry); ctx.stroke();
      ctx.restore();
    }
    const pulse = 1 + this.reticleHit * 0.25;
    const R = (over ? 26 : 22) * pulse;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(t * 1.5);
    ctx.strokeStyle = over ? '#ffe066' : '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = over ? '#ffb000' : '#5fd8ff'; ctx.shadowBlur = 12;
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, 0, R, i * Math.PI / 2 + 0.25, i * Math.PI / 2 + Math.PI / 2 - 0.25); ctx.stroke(); }
    ctx.rotate(-t * 1.5);
    ctx.beginPath(); ctx.moveTo(-R * 0.45, 0); ctx.lineTo(R * 0.45, 0); ctx.moveTo(0, -R * 0.45); ctx.lineTo(0, R * 0.45); ctx.stroke();
    ctx.restore();
  }

  drawSuperWave(ctx) {
    const s = this.super;
    if (s.r >= this.W * 1.2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(this.cx, this.pivotY, Math.max(0, s.r - 90), this.cx, this.pivotY, s.r);
    g.addColorStop(0, 'rgba(160,240,255,0)'); g.addColorStop(0.8, 'rgba(180,245,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0.9)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(this.cx, this.pivotY, s.r, 0, TAU); ctx.fill();
    ctx.restore();
    // frosty edge vignette
    ctx.save();
    const v = ctx.createRadialGradient(this.W / 2, this.H / 2, this.H * 0.3, this.W / 2, this.H / 2, this.W * 0.7);
    v.addColorStop(0, 'rgba(200,240,255,0)'); v.addColorStop(1, `rgba(200,240,255,${0.45 * Math.max(0, 1 - s.t / 2.2)})`);
    ctx.fillStyle = v; ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  }

  drawWind(ctx, t) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    const dir = Math.sign(this.wind);
    for (let i = 0; i < 10; i++) {
      const y = this.hy * 0.3 + i * 50;
      const x = ((t * 700 * dir + i * 230) % (this.W + 300) + this.W + 300) % (this.W + 300) - 150;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 40 * dir, y - 10, x + 90 * dir, y); ctx.stroke();
    }
    ctx.restore();
  }

  drawSplat(ctx) {
    const a = Math.min(1, this.splat);
    ctx.save();
    ctx.globalAlpha = a * 0.92;
    ctx.fillStyle = '#ffffff';
    const blobs = [[0.12, 0.25, 110], [0.85, 0.3, 130], [0.3, 0.75, 90], [0.7, 0.8, 100]];
    for (const [bx, by, r] of blobs) {
      const x = bx * this.W, y = by * this.H;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const ang = (i / 12) * TAU, rr = r * (0.75 + 0.25 * Math.sin(i * 2.7)); ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr); }
      ctx.fill();
      ctx.fillStyle = 'rgba(200,230,255,0.8)';
      ctx.beginPath(); ctx.arc(x + r * 0.2, y + r * 0.1, r * 0.3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ffffff';
    }
    ctx.restore();
  }

  drawBanners(ctx) {
    for (const b of this.banners) {
      const k = b.t / b.dur;
      const inK = Math.min(1, b.t / 0.35);
      const sc = easeOutBack(inK) * (k > 0.85 ? 1 - (k - 0.85) / 0.15 : 1);
      if (sc <= 0) continue;
      const y = b.small ? this.H * 0.3 : this.H * 0.36;
      ctx.save();
      ctx.translate(this.W / 2, y);
      ctx.scale(sc, sc);
      const size = b.small ? 46 : 72;
      ctx.font = `${size}px "Lilita One", "Fredoka", sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(b.text).width + 80;
      // ribbon
      if (!b.small) {
        const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
        g.addColorStop(0, 'rgba(40,20,100,0)'); g.addColorStop(0.15, 'rgba(40,20,100,0.75)'); g.addColorStop(0.85, 'rgba(40,20,100,0.75)'); g.addColorStop(1, 'rgba(40,20,100,0)');
        ctx.fillStyle = g; ctx.fillRect(-w / 2 - 60, -size * 0.75, w + 120, size * (b.sub ? 2.1 : 1.5));
      }
      ctx.lineJoin = 'round';
      ctx.lineWidth = size * 0.22; ctx.strokeStyle = '#2a1060';
      ctx.strokeText(b.text, 0, 0);
      const tg = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
      tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.55, b.color); tg.addColorStop(1, b.color);
      ctx.fillStyle = tg;
      ctx.shadowColor = b.color; ctx.shadowBlur = 25;
      ctx.fillText(b.text, 0, 0);
      ctx.shadowBlur = 0;
      if (b.sub) {
        ctx.font = `${Math.round(size * 0.42)}px "Fredoka", sans-serif`;
        ctx.lineWidth = 6; ctx.strokeText(b.sub, 0, size * 0.78);
        ctx.fillStyle = '#ffffff'; ctx.fillText(b.sub, 0, size * 0.78);
      }
      ctx.restore();
    }
  }

  drawHint(ctx) {
    const h = this.hint;
    if (h.end && h.t > h.end) { this.hint = null; return; }
    const a = Math.min(1, h.t * 3) * (0.75 + 0.25 * Math.sin(h.t * 5));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.font = '30px "Lilita One", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(h.text).width + 50;
    ctx.fillStyle = 'rgba(30,15,80,0.7)';
    roundRect(ctx, this.W / 2 - w / 2, this.H * 0.6 - 26, w, 52, 26); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillText(h.text, this.W / 2, this.H * 0.6 + 2);
    ctx.restore();
  }
}
