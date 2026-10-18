/* =====================================================================
   GameOver.jsx – Results screen (Win / Lose)
   ===================================================================== */
import React from 'react';

export default function GameOver({ result, onRetry, onNext, onMenu, onDouble, onRevive, showDoubleBtn }) {
  const {
    win = false, score = 0, frozen = 0, time = 0,
    stars = 0, crystals = 0, newAchievements = [],
  } = result || {};

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return (
    <div className="overlay">
      <div className="panel results">
        {/* Title */}
        <div className={`results-title ${win ? 'win' : 'lose'}`}>
          {win ? '🎉 VICTORY! 🎉' : '💥 Try Again!'}
        </div>

        {/* Stars */}
        {win && (
          <div className="results-stars">
            {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
          </div>
        )}

        {/* Stats grid */}
        <dl className="results-grid">
          <dt>Score</dt>
          <dd>{score.toLocaleString()}</dd>
          <dt>Frozen</dt>
          <dd>{frozen} 🦖</dd>
          <dt>Time</dt>
          <dd>{minutes}:{seconds.toString().padStart(2, '0')}</dd>
        </dl>

        {/* Crystal reward */}
        <div className="results-crystals">💎 +{crystals} Crystals</div>

        {/* New achievements */}
        {newAchievements.length > 0 && (
          <div className="results-new">
            {newAchievements.map((ach, i) => (
              <span key={i} className="ach-tag">
                {ach.icon || '🏆'} {ach.name || (typeof ach === 'string' ? ach : 'Unlocked!')}
              </span>
            ))}
          </div>
        )}

        {/* Revive Button on Defeat (Rewarded Ad) */}
        {!win && onRevive && (
          <button
            className="btn btn-gold"
            style={{ marginBottom: 14, width: '100%', fontSize: 16 }}
            onClick={onRevive}
          >
            💖 Watch Ad to Revive!
          </button>
        )}

        {/* Buttons */}
        <div className="results-btns">
          <button className="btn btn-primary" onClick={onRetry}>
            🔄 Retry
          </button>
          {win && (
            <button className="btn btn-gold" onClick={onNext}>
              ➡️ Next
            </button>
          )}
          <button className="btn btn-ghost" onClick={onMenu}>
            🏠 Menu
          </button>
        </div>

        {/* Double reward ad button */}
        {showDoubleBtn && crystals > 0 && (
          <button
            className="btn btn-pink"
            style={{ marginTop: 14, width: '100%' }}
            onClick={onDouble}
          >
            📺 Watch Ad → Double Crystals!
          </button>
        )}
      </div>
    </div>
  );
}
