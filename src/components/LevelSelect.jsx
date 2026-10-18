/* =====================================================================
   LevelSelect.jsx – World / Level selection grid
   ===================================================================== */
import React from 'react';
import { LEVELS } from '../game/data.js';

export default function LevelSelect({ save, onSelect, onBack }) {
  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-title">Select World</div>
        <div className="panel-sub">Conquer each world to unlock the next!</div>

        <div className="level-grid">
          {LEVELS.map((lvl, idx) => {
            const unlocked = idx < (save.unlocked || 1);
            const stars = save.levelStars?.[idx] || 0;
            const best = save.levelBest?.[idx] || 0;

            return (
              <div
                key={idx}
                className={`level-card ${unlocked ? '' : 'locked'}`}
                style={{ '--from': lvl.card[0], '--to': lvl.card[1] }}
                onClick={() => unlocked && onSelect(idx)}
              >
                <div className="card-icon">{unlocked ? lvl.icon : '🔒'}</div>
                <div className="card-name">{lvl.name}</div>
                {unlocked && (
                  <>
                    <div className="card-stars">{'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}</div>
                    {best > 0 && <div className="card-best">Best: {best.toLocaleString()}</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center' }}>
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
