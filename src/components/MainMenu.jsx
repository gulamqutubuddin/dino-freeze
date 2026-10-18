/* =====================================================================
   MainMenu.jsx – Title screen with animated star-field background
   ===================================================================== */
import React, { useEffect, useRef } from 'react';
import { DAILY } from '../game/data.js';

export default function MainMenu({ save, onPlay, onShop, onAchievements, onSettings }) {
  const canvasRef = useRef(null);

  // Animated star-field background
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    let raf;

    const resize = () => { cvs.width = window.innerWidth; cvs.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * cvs.width,
      y: Math.random() * cvs.height,
      r: Math.random() * 2 + 0.5,
      speed: Math.random() * 0.4 + 0.1,
      twinkle: Math.random() * Math.PI * 2,
    }));

    const draw = (t) => {
      ctx.clearRect(0, 0, cvs.width, cvs.height);
      const g = ctx.createLinearGradient(0, 0, 0, cvs.height);
      g.addColorStop(0, '#0d0a1f');
      g.addColorStop(0.5, '#1a1040');
      g.addColorStop(1, '#0d0a1f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      stars.forEach(s => {
        s.y += s.speed;
        if (s.y > cvs.height + 4) { s.y = -4; s.x = Math.random() * cvs.width; }
        const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 0.001 + s.twinkle));
        ctx.globalAlpha = a;
        ctx.fillStyle = '#9ff0ff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Daily challenge
  const daily = save.daily;
  const tpl = daily ? DAILY.find(d => d.id === daily.id) : null;
  const dailyProgress = daily ? daily.progress : 0;
  const dailyGoal = tpl ? tpl.goal : 1;
  const dailyClaimed = daily?.claimed;

  return (
    <>
      <canvas ref={canvasRef} className="fill" style={{ zIndex: 0 }} />
      <div className="main-menu">
        <div className="menu-logo">
          <div className="line1">Dino Freeze</div>
          <div className="line2">❄️ BLAST ❄️</div>
        </div>
        <div className="menu-sub">Freeze the Dinos! Save the Day! 🦖💨</div>

        {/* Daily Challenge Banner */}
        {tpl && !dailyClaimed && (
          <div className="daily-banner" style={{ width: 'min(340px, 85vw)' }}>
            <div className="daily-title">🎯 Daily Challenge</div>
            <div className="daily-text">{tpl.text}</div>
            <div className="daily-bar">
              <div
                className="daily-bar-fill"
                style={{ width: `${Math.min(100, (dailyProgress / dailyGoal) * 100)}%` }}
              />
            </div>
            <div style={{ fontSize: 12, color: 'rgba(200,200,240,0.55)', marginTop: 4 }}>
              {dailyProgress}/{dailyGoal} • Reward: 💎 {tpl.reward}
            </div>
          </div>
        )}

        {tpl && dailyClaimed && (
          <div className="daily-banner" style={{ width: 'min(340px, 85vw)', opacity: 0.7 }}>
            <div className="daily-title">✅ Daily Challenge Complete!</div>
            <div className="daily-text">{tpl.text}</div>
          </div>
        )}

        <div className="menu-buttons">
          <button className="btn btn-primary btn-lg" onClick={onPlay}>
            <span className="icon">▶️</span> PLAY
          </button>
          <button className="btn btn-gold" onClick={onShop}>
            <span className="icon">🛒</span> Shop
            <span style={{ fontSize: 14, opacity: 0.8 }}>💎 {save.crystals || 0}</span>
          </button>
          <button className="btn btn-ghost" onClick={onAchievements}>
            <span className="icon">🏆</span> Achievements
          </button>
        </div>

        <div className="menu-bottom">
          <button className="btn btn-round btn-ghost btn-sm" onClick={onSettings} aria-label="Settings">
            ⚙️
          </button>
        </div>
      </div>
    </>
  );
}
