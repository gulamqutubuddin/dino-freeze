# 🦖❄️ Dino Freeze Blast

> **A colorful, non-violent 2D/2.5D arcade water & ice cannon game built for kids and families.**  
> Freeze playful dinosaurs and flying dragons with a magical stream of ice-cold water, trigger epic combos, and shatter frozen statues in 5 enchanting worlds!

[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-4.5.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-5.7.0-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![HTML5 Canvas](https://img.shields.io/badge/Canvas-2D%20Rendering-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-FF6F00?logo=soundcharts&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Gameplay Mechanics](#-gameplay-mechanics)
- [Worlds & Bosses](#-worlds--bosses)
- [Cannons, Upgrades & Power-Ups](#-cannons-upgrades--power-Ups)
- [Controls](#-controls)
- [Tech Stack](#-tech-stack)
- [Project Architecture](#-project-architecture)
- [Getting Started](#-getting-started)
- [Deployment](#-deployment)
  - [Vercel (Web - Recommended)](#vercel-web---recommended)
  - [Netlify (Alternative)](#netlify-alternative)
  - [Single HTML Bundle](#single-html-bundle)
  - [Android App (Capacitor)](#android-app-capacitor)
- [Monetization & AdMob (COPPA Compliant)](#-monetization--admob-coppa-compliant)
- [Contributing & License](#-contributing--license)

---

## 🌟 Overview

Inspired by the thrill of Timezone-style family water-shooting arcade machines, **Dino Freeze Blast** replaces violent elimination mechanics with a satisfying, wholesome freeze-and-shatter loop:

$$\text{Water Stream} \longrightarrow \text{Chilled} \longrightarrow \text{Full Freeze (Ice Statue)} \longrightarrow \text{Shatter!} \longrightarrow \text{Sparkles \& Rewards}$$

### 🚀 Highlights
- **100% Procedural Graphics**: Dinosaurs, dragons, cannons, particles, and parallax backgrounds are rendered directly using HTML5 Canvas 2D math and bezier curves—**zero heavy sprite downloads**, fast startup, and silky-smooth 60 FPS performance.
- **Procedural Chiptune Audio**: Built-in sound synthesizer using the native browser **Web Audio API**—procedurally generates scales, tunes, splashes, freeze chimes, and shatter booms without loading external MP3s.
- **Family-Friendly & COPPA Compliant**: Cute, non-scary cartoon designs where creatures playfully bump the cannon rather than attacking aggressively.
- **Cross-Platform**: Plays seamlessly in any modern desktop or mobile browser, and ready to export as a native Android APK/AAB via **Capacitor**.

---

## ✨ Key Features

- **5 Themed Worlds**: From lush jungles and glaciers to candy sky kingdoms and sparkling crystal caverns.
- **Multiple Game Modes**:
  - 🗺️ **Campaign Mode**: 5 handcrafted progressive levels culminating in epic boss encounters.
  - 🦖 **Endless Dino World**: Continuous waves of running and jumping dinosaurs.
  - 🐉 **Endless Dragon World**: High-flying aerial waves with diving and swooping dragons.
  - 🕹️ **Attract Mode**: Animated arcade demo that plays directly on the main menu.
- **12+ Distinct Creatures**: 6 Dinosaurs + 6 Dragons with custom animations, movement patterns (zigzag, jump, dive, swarm), and hit reactions.
- **5 Multi-Phase Bosses**: Mega Dino, Mega Ice Dragon, Rainbow King, Lava T-Rex, and Crystal Empress.
- **Super Freeze Blast**: Charge your ultimate meter to unleash an arena-wide slow-motion freeze wave that shatters every enemy on screen.
- **Progression & Economy**: Collect crystals during runs, unlock and upgrade cannons, earn star ratings (1–3 stars), and finish **Daily Quests**.
- **10 In-Game Achievements**: Unlocks with crystal bonuses and persistent local storage tracking.

---

## 🎮 Gameplay Mechanics

### The Freeze Loop
1. **Target & Spray**: Aim your cannon at oncoming dinos or flying dragons.
2. **Chill (0% – 99%)**: Enemies turn progressively frosty, covered with growing crystal overlays and slowed down.
3. **Ice Statue (100%)**: The creature completely freezes into a glossy, translucent ice sculpture.
4. **Shatter Moment**: After a brief suspenseful delay, the ice statue cracks with a loud crunch, exploding into shimmering ice cubes, crystal shards, and floating score points!

### Combo Multiplier System
Freezing creatures consecutively without missing builds your **Combo Multiplier** (`x2`, `x3`, `x5`, `x10`). Higher combos reward bonus crystals and trigger screen-wide sparkle effects!

### Shield & Cannon Health
The cannon has an energy shield at the bottom of the screen. If an enemy reaches the cannon, it gives a harmless, playful nudge, lowering shield power. Keep your shield charged with power-up pickups!

---

## 🌴 Worlds & Bosses

| World | Theme | Ambient FX | Boss | Special Features |
| :--- | :--- | :--- | :--- | :--- |
| **🌴 Dino Valley** | Sunny prehistoric jungle | Falling leaves | **Mega Dino** | Rapid raptors, triceratops, jumping dinos |
| **❄️ Frozen Mountain** | Snowy peaks & glaciers | Falling snow | **Mega Ice Dragon** | Slippery movement, ice dragons, snowball toss |
| **🏰 Dragon Kingdom** | Floating candy sky castles | Magic sparkles | **Rainbow King** | Diving aerial swoops, colorful dragon swarms |
| **🌋 Lava Island** | Warm bubbly volcano beach | Floating embers | **Lava T-Rex** | Armored ankylosaurs, fast zig-zagging runners |
| **💎 Crystal Cave** | Glowing underground caverns | Magic crystals | **Crystal Empress** | High-energy projectiles, crystal shield phases |

---

## 🔫 Cannons, Upgrades & Power-Ups

### 🛒 Unlockable Cannons
| Cannon | Cost | Description | Special Attribute |
| :--- | :---: | :--- | :--- |
| **💧 Water Cannon** | Free | Classic splashy water stream | Reliable starter blaster |
| **❄️ Ice Cannon** | 300 💎 | Sparkly snowflake shots | Emits ice crystal shards |
| **🌈 Rainbow Cannon** | 600 💎 | Vibrant multi-colored stream | Prismatic visual stream |
| **💎 Crystal Cannon** | 900 💎 | Pure magic gem energy | High-pitch crystalline frequency |
| **🐉 Dragon Cannon** | 1400 💎 | Golden dragon-power spray | Dragon sparkle trail & high impact |

### ⚡ Permanent Upgrades
- **Freeze Power (+20%/lvl)**: Freezes enemies with fewer hits.
- **Spray Speed (+15%/lvl)**: Increases rate of fire and stream density.
- **Super Charge (+30%/lvl)**: Fills the Super Freeze meter faster.

### 🎁 Floating Power-Ups
- **❄️ Mega Freeze**: Instantly adds freeze percentage to all nearby targets.
- **🌊 Water Storm**: Unleashes a massive pressurized hydro-stream.
- **⚡ Rapid Freeze**: Hyper-fast projectile spray.
- **🛡️ Shield**: Restores and fortifies cannon defense.
- **⭐ 2X Score**: Doubles all points and crystals collected.
- **💎 Crystal Bonus**: Instant stash of spending crystals.
- **💣 Ice Bomb**: AoE explosive frost wave that freezes groups.

---

## 🕹️ Controls

| Action | Desktop (Mouse / Keyboard) | Mobile / Tablet (Touchscreen) |
| :--- | :--- | :--- |
| **Aim Cannon** | Move Mouse Cursor | Drag / Touch anywhere on screen |
| **Spray Stream** | Click & Hold Left Mouse Button / `Spacebar` | Touch & Hold on the screen |
| **Release Stream** | Release Mouse Button / `Spacebar` | Release Touch |
| **Super Freeze** | Click the animated **❄️ SUPER** button | Tap the animated **❄️ SUPER** button |
| **Pause Game** | Click **⏸ Pause** button or press `Esc` / `P` | Tap **⏸ Pause** button |

---

## 💻 Tech Stack

- **Core Framework**: [React 18](https://react.dev/) (UI overlays, menus, HUD, modal management)
- **Bundler & Tooling**: [Vite](https://vitejs.dev/)
- **Graphics Engine**: HTML5 Canvas 2D with a decoupled 60 FPS tick loop (`GameEngine.js`)
- **Particle System**: Object-pooled particle engine handling up to 1,500 simultaneous drops, crystals, and splats
- **Audio Architecture**: Custom procedural [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) synthesizer (`AudioManager.js`)
- **Mobile Engine**: [Capacitor 5](https://capacitorjs.com/) for native Android compilation
- **Web Hosting**: Optimized for [Vercel](https://vercel.com/) (`vercel.json` SPA routing) & [Netlify](https://www.netlify.com/) (`netlify.toml`)
- **Monetization SDK**: `@capacitor-community/admob` with Google H5 Games Ads web fallback

---

## 📁 Project Architecture

```plaintext
dino-freeze/
├── ADMOB_GUIDE.md           # Step-by-step AdMob setup & Android build guide
├── capacitor.config.json    # Capacitor native app configuration
├── index.html               # Main HTML entry point (fonts, meta tags)
├── vercel.json              # Vercel deployment config, SPA rewrites & asset caching
├── netlify.toml             # Netlify deployment configuration & cache headers
├── package.json             # Project dependencies and npm scripts
├── vite.config.js           # Standard multi-file production bundler
├── vite.single.config.js    # Single-file HTML bundler configuration
└── src/
    ├── App.jsx              # Main React controller & screen router
    ├── index.css            # Arcade styling, animations & responsive layout
    ├── main.jsx             # React DOM root entry
    ├── ads/
    │   ├── adConfig.js      # AdMob IDs & COPPA child-safety config
    │   └── AdService.js     # Unified ad bridge (Native AdMob ↔ Web H5 ↔ Mock)
    ├── components/
    │   ├── Achievements.jsx # Achievements screen & rewards
    │   ├── GameOver.jsx     # Victory/Defeat screen with stats & revival
    │   ├── HUD.jsx          # Real-time arcade HUD (Score, Wave, Super meter)
    │   ├── LevelSelect.jsx  # World selection carousel with star ratings
    │   ├── MainMenu.jsx     # Title screen, mode selectors, attract loop
    │   ├── MockAd.jsx       # 5-second interactive test ad modal for browser
    │   ├── PauseMenu.jsx    # In-game pause modal & quick restart
    │   ├── Settings.jsx     # Sound, Music, Reduced Motion & Aim Line toggles
    │   └── Shop.jsx         # Cannon arsenal & upgrade store
    ├── game/
    │   ├── AudioManager.js  # Procedural chiptune synth & SFX engine
    │   ├── Background.js    # Multi-layer parallax background rendering
    │   ├── cannonArt.js     # Procedural cannon rendering, recoil, and glow
    │   ├── data.js          # Definitions for levels, enemies, cannons, and quests
    │   ├── enemyArt.js      # Procedural dinosaur & dragon models, freeze states
    │   ├── GameEngine.js    # Core 60 FPS game loop, collision detection, physics
    │   ├── ParticleSystem.js# High-performance object-pooled particle manager
    │   └── utils.js         # Math helpers (lerp, clamp, RNG, ease curves)
    └── state/
        └── storage.js       # localStorage persistent save & achievement tracking
```

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- `npm` (bundled with Node.js)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/gulamqutubuddin/dino-freeze.git
   cd dino-freeze
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 🚀 Deployment

### Vercel (Web - Recommended)
This game is fully configured and optimized for **[Vercel](https://vercel.com/)** with automated SPA rewrites and immutable asset caching via [vercel.json](vercel.json):

1. **Deploy with Git (Fastest)**:
   - Push your code to GitHub.
   - Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **"Add New Project"**.
   - Select and import your `dino-freeze` repository.
   - Vercel automatically detects the Vite configuration:
     - **Framework Preset**: `Vite`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`
   - Click **Deploy**!
2. **Deploy via Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

### Netlify (Alternative)
The repository also includes [netlify.toml](netlify.toml) if you wish to deploy on [Netlify](https://www.netlify.com/):
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### Single HTML Bundle
If you want to bundle the entire game into a single standalone HTML file (for offline sharing or embed widgets):
```bash
npm run build:single
```
The resulting single file will be generated in `dist/index.html`.

### Android App (Capacitor)
You can package the game into a native Android APK or Play Store Bundle (.aab):

1. Build the production web distribution:
   ```bash
   npm run build
   ```

2. Add Android platform (first time only):
   ```bash
   npx cap add android
   ```

3. Sync assets and plugins to Android:
   ```bash
   npm run cap:sync
   ```

4. Open in Android Studio:
   ```bash
   npx cap open android
   ```
   From Android Studio, connect your phone or emulator and click **Run**, or select **Build > Generate Signed Bundle / APK**.

---

## 📱 Monetization & AdMob (COPPA Compliant)

Dino Freeze Blast includes a complete, production-ready ad architecture supporting **Banners**, **Interstitials**, and **Rewarded Videos**:

- **Native Mobile**: Uses `@capacitor-community/admob` for native Google AdMob.
- **Web Browser**: Falls back to Google H5 Games Ads or a built-in 5-second interactive test modal.
- **Child-Safe Policies**: Fully configured for Google Families Policy & COPPA:
  - `childDirected: true`
  - `maxAdContentRating: 'General'`
  - `nonPersonalizedAds: true`
  - Banner ads automatically hide during active gameplay to avoid accidental taps.

For detailed instructions on setting up your real AdMob unit IDs, refer to the included guide:  
👉 **[ADMOB_GUIDE.md](ADMOB_GUIDE.md)**

---

## 📄 License & Credits

- **Code & Design**: Antigravity & [Gulam Qutubuddin](https://github.com/gulamqutubuddin)
- **Fonts**: [Lilita One](https://fonts.google.com/specimen/Lilita+One) & [Fredoka](https://fonts.google.com/specimen/Fredoka) via Google Fonts.
- **License**: Released under the [MIT License](LICENSE). Feel free to use, modify, and build upon this game!
