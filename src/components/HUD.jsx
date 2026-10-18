/* =====================================================================
   HUD.jsx – In-game heads-up display
   Matches the shape emitted by GameEngine.emitHud()
   ===================================================================== */
import React from 'react';

export default function HUD({ data, onPause, onSuper }) {
  if (!data) return null;

  const {
    score = 0, combo = 0, mult = 1, comboT = 0,
    shield = 100, superEnergy = 0,
    wave = 1, waveTotal = 5,
    crystals = 0, active = [],
    isBoss = false, bossName = '', bossFreeze = null,
    levelName = '',
  } = data;

  const superReady = superEnergy >= 100;

  return (
    <div className="hud">
      {/* Top bar */}
      <div className="hud-top">
        {/* Left: Score */}
        <div className="hud-score">
          {score.toLocaleString()}
          <small>SCORE</small>
        </div>

        {/* Center: Wave */}
        <div className="hud-wave">
          Wave {wave}{waveTotal > 0 ? `/${waveTotal}` : ''}
          <span className="level-name">{levelName}</span>
        </div>

        {/* Right: Shield + Super */}
        <div className="hud-right">
          <div className="hud-bar">
            <div className="hud-bar-fill shield-fill" style={{ width: `${Math.max(0, shield)}%` }} />
            <span className="hud-bar-label">🛡️</span>
          </div>
          <div className="hud-bar">
            <div className={`hud-bar-fill super-fill ${superReady ? 'ready' : ''}`} style={{ width: `${superEnergy}%` }} />
            <span className="hud-bar-label">❄️</span>
          </div>
        </div>
      </div>

      {/* Crystal counter */}
      <div className="hud-crystals">💎 {crystals}</div>

      {/* Boss health bar */}
      {isBoss && bossFreeze !== null && (
        <div className="hud-boss">
          <div className="hud-boss-name">{bossName}</div>
          <div className="boss-bar">
            <div className="boss-bar-fill boss-fill" style={{ width: `${Math.max(0, (1 - bossFreeze) * 100)}%` }} />
          </div>
        </div>
      )}

      {/* Combo display */}
      {combo >= 3 && comboT > 0 && (
        <div className="hud-combo" key={combo}>
          {combo}x COMBO!
          <span className="mult">×{mult.toFixed(1)} score</span>
        </div>
      )}

      {/* Active power-ups */}
      {active.length > 0 && (
        <div className="hud-active">
          {active.map((p, i) => (
            <div key={i} className="hud-active-item">
              <span>{p.icon}</span>
              {p.dur && (
                <div className="hud-active-bar">
                  <div className="hud-active-bar-fill" style={{ width: `${(p.left / p.dur) * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bottom-right buttons */}
      <div className="hud-btns">
        <button className="btn btn-round btn-ghost btn-sm" onClick={onPause} aria-label="Pause">
          ⏸️
        </button>
        <button
          className={`super-btn ${superReady ? 'ready' : ''}`}
          onClick={onSuper}
          aria-label="Super Freeze"
        >
          ❄️
        </button>
      </div>
    </div>
  );
}
