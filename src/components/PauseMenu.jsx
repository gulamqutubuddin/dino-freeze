/* =====================================================================
   PauseMenu.jsx – In-game pause overlay
   ===================================================================== */
import React from 'react';

export default function PauseMenu({ onResume, onQuit, settings, onToggle }) {
  return (
    <div className="overlay">
      <div className="panel" style={{ maxWidth: 380 }}>
        <div className="panel-title">⏸️ Paused</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
          <div className="settings-row">
            <label>🎵 Music</label>
            <button
              className={`toggle ${(settings.music ?? true) ? 'on' : ''}`}
              onClick={() => onToggle('music')}
            />
          </div>
          <div className="settings-row">
            <label>🔊 SFX</label>
            <button
              className={`toggle ${(settings.sfx ?? true) ? 'on' : ''}`}
              onClick={() => onToggle('sfx')}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button className="btn btn-primary" onClick={onResume}>
            ▶️ Resume
          </button>
          <button className="btn btn-ghost" onClick={onQuit}>
            🚪 Quit to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
