/* =====================================================================
   MockAd.jsx – Simulated rewarded video ad for web testing
   ===================================================================== */
import React, { useState, useEffect } from 'react';

const AD_DURATION = 5; // seconds (short for testing; real ads are 15-30s)

export default function MockAd({ onDone }) {
  const [seconds, setSeconds] = useState(AD_DURATION);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return (
    <div className="mock-ad">
      <div className="ad-box">
        <div style={{ fontSize: 48 }}>📺</div>
        <div style={{ fontFamily: 'var(--font-title)', fontSize: 22, color: '#fff' }}>
          Rewarded Video Ad
        </div>
        <div className="ad-label">(Simulated – replace with real AdMob SDK)</div>
        {seconds > 0 ? (
          <div className="ad-timer">{seconds}s</div>
        ) : (
          <div style={{ color: 'var(--c-green)', fontFamily: 'var(--font-title)', fontSize: 18 }}>
            ✅ Ad Complete!
          </div>
        )}
      </div>

      {seconds <= 0 ? (
        <button className="btn btn-gold" onClick={() => onDone(true)}>
          🎁 Claim Reward!
        </button>
      ) : (
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => onDone(false)}
        >
          ✕ Skip (No Reward)
        </button>
      )}
    </div>
  );
}
