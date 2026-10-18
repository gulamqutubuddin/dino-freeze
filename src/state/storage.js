// ---------------- localStorage save system ----------------
import { ACHIEVEMENTS, DAILY, LEVELS } from '../game/data.js';

const KEY = 'dinoFreezeBlast_save_v1';

const today = () => new Date().toISOString().slice(0, 10);

export function defaultSave() {
  return {
    unlocked: 1,
    levelStars: LEVELS.map(() => 0),
    levelBest: LEVELS.map(() => 0),
    highScore: 0,
    endlessBest: { dino: 0, dragon: 0 },
    crystals: 0,
    cannons: { owned: ['water'], selected: 'water' },
    upgrades: { power: 0, rate: 0, energy: 0 },
    stats: { totalFrozen: 0, dinoFrozen: 0, dragonFrozen: 0, maxCombo: 0, bosses: 0, crystalsEarned: 0, supers: 0, best3Stars: 0, levelsDone: 0, powerups: 0, games: 0 },
    claimed: [],
    daily: null,
    settings: { sound: true, music: true, reducedMotion: false, aimLine: true, quality: 'auto' },
    seenTutorial: false,
  };
}

export function loadSave() {
  const d = defaultSave();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return ensureDaily(d);
    const s = JSON.parse(raw);
    // merge so new fields from updates are always present
    return ensureDaily({
      ...d, ...s,
      cannons: { ...d.cannons, ...(s.cannons || {}) },
      upgrades: { ...d.upgrades, ...(s.upgrades || {}) },
      stats: { ...d.stats, ...(s.stats || {}) },
      settings: { ...d.settings, ...(s.settings || {}) },
      endlessBest: { ...d.endlessBest, ...(s.endlessBest || {}) },
    });
  } catch (e) {
    return ensureDaily(d);
  }
}

export function writeSave(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode / full */ }
}

export function ensureDaily(s) {
  const t = today();
  if (!s.daily || s.daily.date !== t) {
    const dayNum = Math.floor(Date.now() / 86400000);
    const tpl = DAILY[dayNum % DAILY.length];
    s.daily = { date: t, id: tpl.id, progress: 0, claimed: false };
  }
  return s;
}

/** Apply run stats to the save. Returns list of newly-completed achievement objects. */
export function applyRunStats(s, run) {
  const before = new Set(ACHIEVEMENTS.filter((a) => isAchDone(s, a)).map((a) => a.id));
  const st = s.stats;
  st.totalFrozen += run.frozen;
  st.dinoFrozen += run.dinoFrozen;
  st.dragonFrozen += run.dragonFrozen;
  st.maxCombo = Math.max(st.maxCombo, run.maxCombo);
  st.bosses += run.bosses;
  st.supers += run.supers;
  st.powerups += run.powerups;
  st.games += 1;
  // daily challenge
  const tpl = DAILY.find((d) => d.id === s.daily.id);
  if (tpl && !s.daily.claimed) {
    const v = run[tpl.stat] || 0;
    s.daily.progress = tpl.max ? Math.max(s.daily.progress, v) : s.daily.progress + v;
  }
  return ACHIEVEMENTS.filter((a) => !before.has(a.id) && isAchDone(s, a));
}

export function addCrystals(s, n) {
  s.crystals += n;
  s.stats.crystalsEarned += n;
}

export const isAchDone = (s, a) => (s.stats[a.stat] || 0) >= a.goal;
