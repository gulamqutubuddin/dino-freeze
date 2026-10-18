// ---------------- Static game data: levels, enemies, cannons, power-ups, achievements ----------------

export const LEVELS = [
  {
    id: 'valley', name: 'Dino Valley', icon: '🌴', desc: 'Sunny jungle full of playful dinos',
    pool: ['babyRaptor', 'babyRaptor', 'raptor', 'trike', 'stego', 'babyDragon'],
    boss: 'megaDino', ambient: 'leaves', card: ['#5ee27a', '#1f9d55'],
    music: { root: 60, tempo: 116, scale: 'major', lead: 'square', seed: 11 },
  },
  {
    id: 'frozen', name: 'Frozen Mountain', icon: '❄️', desc: 'Snowy peaks and slippery glaciers',
    pool: ['babyRaptor', 'raptor', 'ankylo', 'iceDragon', 'stego', 'babyDragon'],
    boss: 'megaIceDragon', ambient: 'snow', card: ['#9fe3ff', '#3a7bd5'],
    music: { root: 62, tempo: 108, scale: 'pent', lead: 'triangle', seed: 23 },
  },
  {
    id: 'kingdom', name: 'Dragon Kingdom', icon: '🏰', desc: 'Floating castles in a candy sky',
    pool: ['babyDragon', 'flyDragon', 'rainbowDragon', 'raptor', 'flyDragon', 'trike'],
    boss: 'kingDragon', ambient: 'sparkle', card: ['#ff9ad5', '#8b5cf6'],
    music: { root: 65, tempo: 124, scale: 'major', lead: 'square', seed: 37 },
  },
  {
    id: 'lava', name: 'Lava Island', icon: '🌋', desc: 'Warm, bubbly volcano beach',
    pool: ['fireDragon', 'trike', 'ankylo', 'trex', 'raptor', 'babyRaptor'],
    boss: 'lavaTrex', ambient: 'embers', card: ['#ffb347', '#ff5e62'],
    music: { root: 57, tempo: 132, scale: 'mixo', lead: 'sawtooth', seed: 41 },
  },
  {
    id: 'cave', name: 'Crystal Cave', icon: '💎', desc: 'Glowing gems and magic sparkles',
    pool: ['crystalDragon', 'stego', 'trex', 'rainbowDragon', 'raptor', 'flyDragon'],
    boss: 'crystalBoss', ambient: 'crystals', card: ['#a78bfa', '#22d3ee'],
    music: { root: 63, tempo: 120, scale: 'pent', lead: 'triangle', seed: 53 },
  },
];

// shape: art used by renderer.  hp = freeze needed (in "water hits").  speed = depth per second.
export const ENEMY_TYPES = {
  babyRaptor: { name: 'Baby Raptor', kind: 'dino', shape: 'raptor', size: 0.75, hp: 7, speed: 0.07, score: 100,
    colors: { body: '#7ed957', belly: '#e9ffb8', accent: '#3fae49', spot: '#5cc04a' }, moves: ['walk', 'jump'] },
  raptor: { name: 'Speedy Raptor', kind: 'dino', shape: 'raptor', size: 0.95, hp: 10, speed: 0.1, score: 150,
    colors: { body: '#ff9f43', belly: '#ffe0b3', accent: '#e8710a', spot: '#ffbe76' }, moves: ['zigzag', 'dodge'] },
  trike: { name: 'Triceratops', kind: 'dino', shape: 'trike', size: 1.2, hp: 18, speed: 0.05, score: 250,
    colors: { body: '#4fc3f7', belly: '#d6f4ff', accent: '#ffb74d', spot: '#29a8e0' }, moves: ['walk'] },
  stego: { name: 'Stegosaurus', kind: 'dino', shape: 'stego', size: 1.25, hp: 20, speed: 0.048, score: 250,
    colors: { body: '#ba68c8', belly: '#f3d9ff', accent: '#ff7eb6', spot: '#a04fb3' }, moves: ['walk', 'zigzag'] },
  ankylo: { name: 'Ankylosaurus', kind: 'dino', shape: 'ankylo', size: 1.15, hp: 24, speed: 0.045, score: 300,
    colors: { body: '#c0a080', belly: '#fff1dc', accent: '#8d6e63', spot: '#a1887f' }, moves: ['walk'] },
  trex: { name: 'T-Rex', kind: 'dino', shape: 'trex', size: 1.45, hp: 32, speed: 0.055, score: 400,
    colors: { body: '#ef5350', belly: '#ffd6d6', accent: '#c62828', spot: '#ff8a80' }, moves: ['walk', 'jump'] },

  babyDragon: { name: 'Baby Dragon', kind: 'dragon', shape: 'dragon', size: 0.75, hp: 7, speed: 0.06, score: 120,
    colors: { body: '#ff8ac6', belly: '#ffe3f1', accent: '#ffd36e', wing: '#b388ff' }, moves: ['fly'] },
  flyDragon: { name: 'Flying Dragon', kind: 'dragon', shape: 'dragon', size: 1.0, hp: 11, speed: 0.07, score: 180,
    colors: { body: '#26c6da', belly: '#d9fbff', accent: '#ffca28', wing: '#7e57c2' }, moves: ['fly', 'dive'] },
  iceDragon: { name: 'Ice Dragon', kind: 'dragon', shape: 'dragon', size: 1.0, hp: 10, speed: 0.07, score: 180,
    colors: { body: '#e3f2fd', belly: '#ffffff', accent: '#64b5f6', wing: '#90caf9' }, moves: ['fly', 'dive'] },
  rainbowDragon: { name: 'Rainbow Dragon', kind: 'dragon', shape: 'dragon', size: 1.0, hp: 13, speed: 0.075, score: 220, rainbow: true,
    colors: { body: '#ff6b9d', belly: '#fff3c4', accent: '#7cf3a0', wing: '#6ec6ff' }, moves: ['dive', 'fly'] },
  fireDragon: { name: 'Fire Dragon', kind: 'dragon', shape: 'dragon', size: 1.1, hp: 16, speed: 0.07, score: 260, warm: true,
    colors: { body: '#ff7043', belly: '#ffe082', accent: '#ffd54f', wing: '#ffab40' }, moves: ['fly', 'dive'] },
  crystalDragon: { name: 'Crystal Dragon', kind: 'dragon', shape: 'dragon', size: 1.1, hp: 16, speed: 0.075, score: 280,
    colors: { body: '#b39ddb', belly: '#ede7f6', accent: '#4dd0e1', wing: '#80deea' }, moves: ['dive', 'fly'] },

  // ---- Bosses ----
  megaDino: { name: 'MEGA DINO', kind: 'dino', shape: 'trex', size: 3.0, hp: 260, speed: 0, score: 1000, boss: true,
    colors: { body: '#66bb6a', belly: '#e8ffd6', accent: '#2e7d32', spot: '#a5d6a7' }, moves: ['boss'] },
  megaIceDragon: { name: 'MEGA ICE DRAGON', kind: 'dragon', shape: 'dragon', size: 2.8, hp: 300, speed: 0, score: 1200, boss: true,
    colors: { body: '#81d4fa', belly: '#ffffff', accent: '#e1f5fe', wing: '#4fc3f7' }, moves: ['boss'] },
  kingDragon: { name: 'RAINBOW KING', kind: 'dragon', shape: 'dragon', size: 2.9, hp: 340, speed: 0, score: 1400, boss: true, rainbow: true,
    colors: { body: '#f06292', belly: '#fff9c4', accent: '#ffd54f', wing: '#ba68c8' }, moves: ['boss'] },
  lavaTrex: { name: 'LAVA T-REX', kind: 'dino', shape: 'trex', size: 3.1, hp: 380, speed: 0, score: 1600, boss: true, warm: true,
    colors: { body: '#ff7043', belly: '#ffe0b2', accent: '#bf360c', spot: '#ffab91' }, moves: ['boss'] },
  crystalBoss: { name: 'CRYSTAL EMPRESS', kind: 'dragon', shape: 'dragon', size: 3.0, hp: 420, speed: 0, score: 2000, boss: true,
    colors: { body: '#9575cd', belly: '#f3e5f5', accent: '#4dd0e1', wing: '#ce93d8' }, moves: ['boss'] },
};

export const DINO_TYPES = Object.keys(ENEMY_TYPES).filter((k) => ENEMY_TYPES[k].kind === 'dino' && !ENEMY_TYPES[k].boss);
export const DRAGON_TYPES = Object.keys(ENEMY_TYPES).filter((k) => ENEMY_TYPES[k].kind === 'dragon' && !ENEMY_TYPES[k].boss);
export const DINO_BOSSES = ['megaDino', 'lavaTrex'];
export const DRAGON_BOSSES = ['megaIceDragon', 'kingDragon', 'crystalBoss'];

export const CANNONS = [
  { id: 'water', name: 'Water Cannon', cost: 0, main: '#2f8cff', glow: '#5fd8ff', drop: ['#5fd8ff', '#b3f0ff'], pitch: 1, desc: 'Classic splashy stream' },
  { id: 'ice', name: 'Ice Cannon', cost: 300, main: '#7fd3ff', glow: '#e0fbff', drop: ['#e6fbff', '#9be7ff'], pitch: 1.25, desc: 'Sparkly snowflake shots', shards: true },
  { id: 'rainbow', name: 'Rainbow Cannon', cost: 600, main: '#ff5fa2', glow: '#ffe066', drop: null, pitch: 1.1, desc: 'Every color of the rainbow!', rainbow: true },
  { id: 'crystal', name: 'Crystal Cannon', cost: 900, main: '#9b5cff', glow: '#e3c8ff', drop: ['#d7b4ff', '#8ef6ff'], pitch: 1.4, desc: 'Magic gem energy', shards: true },
  { id: 'dragon', name: 'Dragon Cannon', cost: 1400, main: '#1fbf75', glow: '#c6ff7a', drop: ['#b6ff6e', '#ffe36e'], pitch: 0.85, desc: 'Golden dragon-power spray', sparkle: true },
];

export const UPGRADES = [
  { id: 'power', name: 'Freeze Power', icon: '❄️', desc: '+20% freeze per hit', costs: [150, 350, 700] },
  { id: 'rate', name: 'Spray Speed', icon: '💧', desc: 'Faster water stream', costs: [150, 350, 700] },
  { id: 'energy', name: 'Super Charge', icon: '⚡', desc: 'Super Freeze charges faster', costs: [120, 300, 600] },
];

export const POWERUPS = {
  megaFreeze: { icon: '❄️', name: 'MEGA FREEZE', color: '#7fdcff' },
  waterStorm: { icon: '🌊', name: 'WATER STORM', color: '#3fa9ff', duration: 7 },
  rapid: { icon: '⚡', name: 'RAPID FREEZE', color: '#ffd84d', duration: 8 },
  shield: { icon: '🛡️', name: 'SHIELD', color: '#7cf29a', duration: 8 },
  score2x: { icon: '⭐', name: '2X SCORE', color: '#ffb84d', duration: 10 },
  crystal: { icon: '💎', name: 'CRYSTAL BONUS', color: '#c48bff' },
  iceBomb: { icon: '💣', name: 'ICE BOMB', color: '#9ff0ff' },
};

export const ACHIEVEMENTS = [
  { id: 'first', icon: '🧊', name: 'First Freeze!', desc: 'Freeze your first creature', stat: 'totalFrozen', goal: 1, reward: 20 },
  { id: 'dino50', icon: '🦖', name: 'Dino Chiller', desc: 'Freeze 50 Dinosaurs', stat: 'dinoFrozen', goal: 50, reward: 100 },
  { id: 'dragon20', icon: '🐉', name: 'Dragon Cooler', desc: 'Freeze 20 Dragons', stat: 'dragonFrozen', goal: 20, reward: 100 },
  { id: 'combo10', icon: '🔥', name: 'Combo Star', desc: 'Reach Combo x10', stat: 'maxCombo', goal: 10, reward: 150 },
  { id: 'boss3', icon: '🏆', name: 'Boss Buster', desc: 'Defeat 3 Bosses', stat: 'bosses', goal: 3, reward: 200 },
  { id: 'crys500', icon: '💎', name: 'Gem Collector', desc: 'Collect 500 Crystals', stat: 'crystalsEarned', goal: 500, reward: 150 },
  { id: 'super5', icon: '🌀', name: 'Super Freezer', desc: 'Use Super Freeze 5 times', stat: 'supers', goal: 5, reward: 100 },
  { id: 'freeze500', icon: '❄️', name: 'Ice Legend', desc: 'Freeze 500 creatures', stat: 'totalFrozen', goal: 500, reward: 300 },
  { id: 'stars3', icon: '⭐', name: 'Perfect Run', desc: 'Get 3 stars on any level', stat: 'best3Stars', goal: 1, reward: 100 },
  { id: 'allLevels', icon: '👑', name: 'World Champion', desc: 'Complete all 5 worlds', stat: 'levelsDone', goal: 5, reward: 500 },
];

// Daily challenge templates (one picked per calendar day)
export const DAILY = [
  { id: 'd_dino', text: 'Freeze 30 dinosaurs', stat: 'dinoFrozen', goal: 30, reward: 60 },
  { id: 'd_dragon', text: 'Freeze 20 dragons', stat: 'dragonFrozen', goal: 20, reward: 60 },
  { id: 'd_combo', text: 'Reach a x8 combo', stat: 'maxCombo', goal: 8, reward: 60, max: true },
  { id: 'd_power', text: 'Collect 5 power-ups', stat: 'powerups', goal: 5, reward: 60 },
  { id: 'd_super', text: 'Use Super Freeze 2 times', stat: 'supers', goal: 2, reward: 60 },
];
