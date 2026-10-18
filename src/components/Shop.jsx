/* =====================================================================
   Shop.jsx – Cannon gallery + Upgrades
   ===================================================================== */
import React, { useState } from 'react';
import { CANNONS, UPGRADES } from '../game/data.js';

export default function Shop({ save, onBuyCannon, onSelectCannon, onBuyUpgrade, onBack }) {
  const [tab, setTab] = useState('cannons');
  const owned = save.cannons?.owned || ['water'];
  const selected = save.cannons?.selected || 'water';
  const crystals = save.crystals || 0;

  return (
    <div className="overlay">
      <div className="panel">
        <div className="panel-title">🛒 Shop</div>
        <div className="panel-sub">💎 {crystals} Crystals</div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
          <button
            className={`btn btn-sm ${tab === 'cannons' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('cannons')}
          >
            💧 Cannons
          </button>
          <button
            className={`btn btn-sm ${tab === 'upgrades' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setTab('upgrades')}
          >
            ⬆️ Upgrades
          </button>
        </div>

        {/* Cannons Tab */}
        {tab === 'cannons' && (
          <div className="shop-section">
            {CANNONS.map(c => {
              const isOwned = owned.includes(c.id);
              const isSelected = selected === c.id;
              const canBuy = !isOwned && crystals >= c.cost;
              return (
                <div
                  key={c.id}
                  className={`shop-item ${isOwned ? 'owned' : ''} ${isSelected ? 'selected' : ''}`}
                >
                  <div className="item-icon" style={{ fontSize: 28, width: 40, textAlign: 'center' }}>💧</div>
                  <div className="item-info">
                    <div className="item-name">{c.name}</div>
                    <div className="item-desc">{c.desc}</div>
                  </div>
                  {isSelected ? (
                    <span style={{ color: 'var(--c-green)', fontFamily: 'var(--font-title)', fontSize: 14 }}>EQUIPPED</span>
                  ) : isOwned ? (
                    <button className="btn btn-sm btn-ghost" onClick={() => onSelectCannon(c.id)}>
                      Equip
                    </button>
                  ) : (
                    <button
                      className="btn btn-sm btn-gold"
                      disabled={!canBuy}
                      onClick={() => onBuyCannon(c.id)}
                    >
                      💎 {c.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upgrades Tab */}
        {tab === 'upgrades' && (
          <div className="shop-section">
            {UPGRADES.map(u => {
              const lvl = save.upgrades?.[u.id] || 0;
              const maxed = lvl >= u.costs.length;
              const cost = maxed ? 0 : u.costs[lvl];
              const canBuy = !maxed && crystals >= cost;
              return (
                <div key={u.id} className="shop-item">
                  <div className="item-icon">{u.icon}</div>
                  <div className="item-info">
                    <div className="item-name">{u.name} {maxed ? '(MAX)' : `Lv.${lvl}/${u.costs.length}`}</div>
                    <div className="item-desc">{u.desc}</div>
                  </div>
                  {maxed ? (
                    <span style={{ color: 'var(--c-gold)', fontFamily: 'var(--font-title)', fontSize: 14 }}>MAX</span>
                  ) : (
                    <button
                      className="btn btn-sm btn-gold"
                      disabled={!canBuy}
                      onClick={() => onBuyUpgrade(u.id)}
                    >
                      💎 {cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}
