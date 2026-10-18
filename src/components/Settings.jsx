/* =====================================================================
   Settings.jsx – Audio toggles + data management
   ===================================================================== */
import React, { useState } from 'react';

export default function Settings({ settings, onToggle, onReset, onBack }) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="overlay">
      <div className="panel" style={{ maxWidth: 400 }}>
        <div className="panel-title">⚙️ Settings</div>

        <div className="settings-row">
          <label>🎵 Music</label>
          <button
            className={`toggle ${(settings.music ?? true) ? 'on' : ''}`}
            onClick={() => onToggle('music')}
          />
        </div>

        <div className="settings-row">
          <label>🔊 Sound Effects</label>
          <button
            className={`toggle ${(settings.sfx ?? true) ? 'on' : ''}`}
            onClick={() => onToggle('sfx')}
          />
        </div>

        <div className="settings-row">
          <label>📳 Vibration</label>
          <button
            className={`toggle ${(settings.vibration ?? true) ? 'on' : ''}`}
            onClick={() => onToggle('vibration')}
          />
        </div>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          {!confirmReset ? (
            <button
              className="btn btn-sm btn-ghost"
              style={{ color: 'var(--c-red)' }}
              onClick={() => setConfirmReset(true)}
            >
              🗑️ Reset All Data
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button className="btn btn-sm btn-ghost" style={{ color: 'var(--c-red)' }} onClick={onReset}>
                Yes, Reset
              </button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmReset(false)}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--c-muted)' }}>
          Dino Freeze Blast v1.0 • Made with ❄️
        </div>
      </div>
    </div>
  );
}
