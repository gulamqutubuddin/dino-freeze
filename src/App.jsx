/* =====================================================================
   App.jsx – Root Component / Screen Router
   Bridges React UI ↔ Canvas GameEngine ↔ localStorage save system
   ===================================================================== */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { loadSave, writeSave, applyRunStats, addCrystals, isAchDone, defaultSave } from './state/storage.js';
import { LEVELS, CANNONS, UPGRADES, ACHIEVEMENTS, DAILY, POWERUPS } from './game/data.js';
import { AudioManager } from './game/AudioManager.js';
import { GameEngine } from './game/GameEngine.js';
import MainMenu from './components/MainMenu.jsx';
import LevelSelect from './components/LevelSelect.jsx';
import Shop from './components/Shop.jsx';
import AchievementsScreen from './components/Achievements.jsx';
import Settings from './components/Settings.jsx';
import HUD from './components/HUD.jsx';
import PauseMenu from './components/PauseMenu.jsx';
import GameOver from './components/GameOver.jsx';
import MockAd from './components/MockAd.jsx';
import { AdService } from './ads/AdService.js';

export default function App() {
  const [screen, setScreen] = useState('menu');   // menu | levels | shop | achievements | settings | game | results
  const [save, setSave] = useState(() => loadSave());
  const [hudData, setHudData] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [paused, setPaused] = useState(false);
  const [showingAd, setShowingAd] = useState(false);
  const [adCallback, setAdCallback] = useState(null);
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const resultRef = useRef(null); // cache latest result for ad doubling

  // Persist + refresh React state
  const persist = useCallback((updater) => {
    setSave(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      writeSave(next);
      return next;
    });
  }, []);

  // Initialize AdService & subscribe to mock ad events and sound ducking
  useEffect(() => {
    AdService.init();
    const unsub = AdService.subscribe({
      onMock: ({ done }) => {
        setShowingAd(true);
        setAdCallback(() => (watched) => {
          setShowingAd(false);
          done(watched);
        });
      },
      onAdStart: () => AudioManager.duck(true),
      onAdEnd: () => AudioManager.duck(false),
    });
    return unsub;
  }, []);

  // Show banner on menus, hide during gameplay (COPPA compliant)
  useEffect(() => {
    if (screen === 'menu' || screen === 'levels' || screen === 'shop' || screen === 'achievements' || screen === 'settings') {
      AdService.showBanner();
    } else {
      AdService.hideBanner();
    }
  }, [screen]);

  // Audio unlock on first user gesture
  useEffect(() => {
    const unlock = () => { AudioManager.unlock(); window.removeEventListener('pointerdown', unlock); };
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  // Apply audio settings whenever they change
  useEffect(() => {
    AudioManager.setSound(save.settings?.sound !== false && save.settings?.sfx !== false);
    AudioManager.setMusic(save.settings?.music !== false);
  }, [save.settings]);

  // ---------- Start a level ----------
  const startLevel = useCallback((levelIdx, mode = 'level') => {
    const freshSave = loadSave();
    setSave(freshSave);
    setScreen('game');
    setPaused(false);
    setGameResult(null);
    setHudData(null);

    setTimeout(() => {
      const cvs = canvasRef.current;
      if (!cvs) return;

      const engine = new GameEngine(cvs, {
        mode,
        levelIndex: levelIdx,
        cannonId: freshSave.cannons.selected,
        upgrades: freshSave.upgrades,
        settings: freshSave.settings,
        showHints: !freshSave.seenTutorial,
        callbacks: {
          onHud: (hud) => setHudData(hud),
          onEvent: (kind, results) => {
            if (kind === 'complete' || kind === 'gameover') {
              const win = kind === 'complete';
              const r = { ...results, win, levelIdx };
              resultRef.current = r;

              // Natural break ad (AdMob interstitial / Web H5 / Mock)
              AdService.maybeShowInterstitial(win ? 'level_complete' : 'game_over');

              // Apply stats to save
              persist(prev => {
                const s = JSON.parse(JSON.stringify(prev)); // deep clone
                addCrystals(s, r.crystals || 0);
                const newAch = applyRunStats(s, r);

                if (win && mode === 'level') {
                  // Update level best
                  if (r.stars > s.levelStars[levelIdx]) s.levelStars[levelIdx] = r.stars;
                  if (r.score > s.levelBest[levelIdx]) s.levelBest[levelIdx] = r.score;
                  s.stats.levelsDone = s.levelStars.filter(st => st > 0).length;
                  if (r.stars >= 3) s.stats.best3Stars = Math.max(s.stats.best3Stars, 1);
                  // Unlock next level
                  if (levelIdx + 1 < LEVELS.length && s.unlocked <= levelIdx + 1) {
                    s.unlocked = levelIdx + 2;
                  }
                } else if (mode !== 'level') {
                  const key = mode; // 'dino' or 'dragon'
                  s.endlessBest[key] = Math.max(s.endlessBest[key] || 0, r.score);
                }

                // Mark tutorial seen
                if (!s.seenTutorial) s.seenTutorial = true;

                // Claim newly-completed achievements
                r.newAchievements = newAch.map(a => ({ name: a.name, icon: a.icon, reward: a.reward }));
                newAch.forEach(a => {
                  if (!s.claimed.includes(a.id)) {
                    s.claimed.push(a.id);
                    addCrystals(s, a.reward);
                  }
                });

                // Check daily challenge completion
                const tpl = DAILY.find(d => d.id === s.daily.id);
                if (tpl && !s.daily.claimed && s.daily.progress >= tpl.goal) {
                  s.daily.claimed = true;
                  addCrystals(s, tpl.reward);
                }

                return s;
              });

              setGameResult(r);
              setScreen('results');
            }
          },
        },
      });
      engineRef.current = engine;

      // Start music for this level
      const lvl = LEVELS[levelIdx];
      if (lvl) AudioManager.playMusic(lvl.music);
    }, 80);
  }, [persist]);

  // Cleanup engine on non-game screens
  useEffect(() => {
    if (screen !== 'game' && screen !== 'results') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    }
  }, [screen]);

  // Pause / resume
  const togglePause = useCallback(() => {
    setPaused(p => {
      const next = !p;
      if (engineRef.current) {
        if (next) engineRef.current.pause();
        else engineRef.current.resume();
      }
      return next;
    });
  }, []);

  // Super freeze
  const triggerSuper = useCallback(() => {
    if (engineRef.current) engineRef.current.triggerSuper();
  }, []);

  // ---------- Rewarded Ads (AdMob / Web H5 / Mock) ----------
  const triggerRewarded = useCallback(async (onRewardSuccess) => {
    AudioManager.duck(true);
    const earned = await AdService.showRewarded('reward');
    AudioManager.duck(false);
    if (earned && onRewardSuccess) {
      onRewardSuccess();
    }
  }, []);

  const onAdDone = useCallback((watched) => {
    setShowingAd(false);
    AudioManager.duck(false);
    if (adCallback) adCallback(watched);
    setAdCallback(null);
  }, [adCallback]);

  // Double crystals from result via rewarded ad
  const doubleReward = useCallback(() => {
    triggerRewarded(() => {
      const r = resultRef.current;
      if (r) {
        const bonus = r.crystals || 0;
        persist(prev => { const s = { ...prev }; addCrystals(s, bonus); return s; });
        setGameResult(old => ({ ...old, crystals: (old?.crystals || 0) + bonus, doubled: true }));
        resultRef.current = { ...r, crystals: (r.crystals || 0) + bonus, doubled: true };
      }
    });
  }, [persist, triggerRewarded]);

  // Revive via rewarded ad
  const revivePlayer = useCallback(() => {
    triggerRewarded(() => {
      if (engineRef.current) {
        engineRef.current.revive();
        setScreen('game');
        setGameResult(null);
        setPaused(false);
      }
    });
  }, [triggerRewarded]);

  // ---------- Shop actions ----------
  const buyCannon = useCallback((id) => {
    const def = CANNONS.find(c => c.id === id);
    if (!def) return;
    persist(prev => {
      if (prev.crystals < def.cost) return prev;
      const s = { ...prev, cannons: { ...prev.cannons, owned: [...prev.cannons.owned] } };
      if (s.cannons.owned.includes(id)) return prev;
      s.cannons.owned.push(id);
      s.crystals -= def.cost;
      return s;
    });
    AudioManager.purchase?.();
  }, [persist]);

  const selectCannon = useCallback((id) => {
    persist(prev => ({ ...prev, cannons: { ...prev.cannons, selected: id } }));
  }, [persist]);

  const buyUpgrade = useCallback((id) => {
    const def = UPGRADES.find(u => u.id === id);
    if (!def) return;
    persist(prev => {
      const lvl = prev.upgrades[id] || 0;
      if (lvl >= def.costs.length) return prev;
      const cost = def.costs[lvl];
      if (prev.crystals < cost) return prev;
      return {
        ...prev,
        crystals: prev.crystals - cost,
        upgrades: { ...prev.upgrades, [id]: lvl + 1 },
      };
    });
    AudioManager.purchase?.();
  }, [persist]);

  // ---------- Settings ----------
  const toggleSetting = useCallback((key) => {
    persist(prev => {
      const cur = prev.settings?.[key] ?? true;
      const nextVal = !cur;
      const updated = { ...prev.settings, [key]: nextVal };
      if (key === 'sound') updated.sfx = nextVal;
      if (key === 'sfx') updated.sound = nextVal;
      return { ...prev, settings: updated };
    });
  }, [persist]);

  const resetData = useCallback(() => {
    const fresh = defaultSave();
    setSave(fresh);
    writeSave(fresh);
    setScreen('menu');
  }, []);

  return (
    <div className="fill" style={{ background: '#0d0a1f' }}>
      {/* Game Canvas – always rendered, hidden when not playing */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
        style={{ display: screen === 'game' || screen === 'results' ? 'block' : 'none' }}
      />

      {/* ---- Screens ---- */}
      {screen === 'menu' && (
        <MainMenu
          save={save}
          onPlay={() => setScreen('levels')}
          onShop={() => setScreen('shop')}
          onAchievements={() => setScreen('achievements')}
          onSettings={() => setScreen('settings')}
        />
      )}

      {screen === 'levels' && (
        <LevelSelect
          save={save}
          onSelect={(idx) => startLevel(idx)}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'shop' && (
        <Shop
          save={save}
          onBuyCannon={buyCannon}
          onSelectCannon={selectCannon}
          onBuyUpgrade={buyUpgrade}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'achievements' && (
        <AchievementsScreen
          save={save}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'settings' && (
        <Settings
          settings={save.settings || {}}
          onToggle={toggleSetting}
          onReset={resetData}
          onBack={() => setScreen('menu')}
        />
      )}

      {screen === 'game' && hudData && (
        <HUD data={hudData} onPause={togglePause} onSuper={triggerSuper} />
      )}

      {screen === 'game' && paused && (
        <PauseMenu
          onResume={togglePause}
          onQuit={() => {
            if (engineRef.current) engineRef.current.destroy();
            engineRef.current = null;
            setPaused(false);
            AudioManager.stopMusic();
            setScreen('menu');
          }}
          settings={save.settings || {}}
          onToggle={toggleSetting}
        />
      )}

      {screen === 'results' && gameResult && (
        <GameOver
          result={gameResult}
          onRetry={() => startLevel(gameResult.levelIdx ?? 0)}
          onNext={() => {
            const next = (gameResult.levelIdx ?? 0) + 1;
            if (next < LEVELS.length) startLevel(next);
            else { AudioManager.stopMusic(); setScreen('menu'); }
          }}
          onMenu={() => { AudioManager.stopMusic(); setScreen('menu'); }}
          onDouble={doubleReward}
          onRevive={!gameResult.win && !gameResult.revived ? revivePlayer : null}
          showDoubleBtn={gameResult.win && !gameResult.doubled && (gameResult.crystals || 0) > 0}
        />
      )}

      {/* Mock ad overlay */}
      {showingAd && <MockAd onDone={onAdDone} />}
    </div>
  );
}
