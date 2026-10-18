/* =====================================================================
   Achievements.jsx – Badge gallery
   ===================================================================== */
import React from 'react';
import { ACHIEVEMENTS } from '../game/data.js';
import { isAchDone } from '../state/storage.js';

export default function Achievements({ save, onBack }) {
  const claimed = save.claimed || [];

  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-title">🏆 Achievements</div>
        <div className="panel-sub">
          {claimed.length}/{ACHIEVEMENTS.length} unlocked
        </div>

        <div className="ach-list">
          {ACHIEVEMENTS.map(a => {
            const done = isAchDone(save, a);
            const isClaimed = claimed.includes(a.id);
            const progress = save.stats?.[a.stat] || 0;
            return (
              <div key={a.id} className={`ach-item ${done ? 'done' : ''}`}>
                <div className="ach-icon">{done ? a.icon : '🔒'}</div>
                <div className="ach-info">
                  <div className="ach-name">{a.name}</div>
                  <div className="ach-desc">{a.desc}</div>
                  {!done && (
                    <div className="ach-progress">
                      {progress}/{a.goal}
                    </div>
                  )}
                </div>
                <div className="ach-reward">💎 {a.reward}</div>
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
