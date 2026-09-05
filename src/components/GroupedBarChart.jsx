'use client';

import { INDICATORS } from '@/lib/instrument.js';
import { AlertTriangle, CheckCircle2, AlertOctagon, HelpCircle } from 'lucide-react';

export default function GroupedBarChart({ indicatorResults = {} }) {
  const indicatorsList = Object.entries(INDICATORS).map(([key, def]) => {
    const data = indicatorResults[key] || {
      skor_persen: 0,
      status: 'Kritis',
      fav_rate: 0,
      unfav_rate: 0
    };
    return {
      key,
      ...def,
      ...data
    };
  });

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>
            Chart 2: Capaian Indeks 7 Indikator Operasional Sikap Siswa
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Grouped Bar Chart — Persentase capaian indeks psikometri komposit terhadap ambang batas ketahanan ideologis.
          </p>
        </div>

        {/* Threshold Legends */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: '0.8rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--status-safe)' }}></span>
            <span>≥ 70% (Kuat)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#fbbf24' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--status-warning)' }}></span>
            <span>50% - 69.9% (Waspada)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f87171' }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, background: 'var(--status-critical)' }}></span>
            <span>&lt; 50% (Kritis)</span>
          </div>
        </div>
      </div>

      {/* Bars Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {indicatorsList.map((ind, idx) => {
          let barColor = 'var(--status-critical)';
          let badgeClass = 'badge-critical';
          let StatusIcon = AlertOctagon;

          if (ind.skor_persen >= 70.0) {
            barColor = 'var(--status-safe)';
            badgeClass = 'badge-safe';
            StatusIcon = CheckCircle2;
          } else if (ind.skor_persen >= 50.0) {
            barColor = 'var(--status-warning)';
            badgeClass = 'badge-warning';
            StatusIcon = AlertTriangle;
          }

          return (
            <div key={ind.key} style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '14px 18px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)'
                    }}>
                      #{idx + 1}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                      {ind.title}
                    </span>
                    <span className={`badge ${badgeClass}`}>
                      <StatusIcon size={12} />
                      {ind.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 3 }}>
                    {ind.description} (Item: {ind.items.join(', ')})
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: barColor, letterSpacing: '-0.02em' }}>
                    {ind.skor_persen}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Rasio Aman: <b style={{ color: '#34d399' }}>{ind.fav_rate}%</b> | Rentan: <b style={{ color: '#f87171' }}>{ind.unfav_rate}%</b>
                  </div>
                </div>
              </div>

              {/* Progress Track */}
              <div style={{
                height: 14,
                width: '100%',
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* 50% Threshold Guide Line */}
                <div style={{
                  position: 'absolute',
                  left: '50%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'rgba(255, 255, 255, 0.25)',
                  zIndex: 2
                }}></div>

                {/* 70% Threshold Guide Line */}
                <div style={{
                  position: 'absolute',
                  left: '70%',
                  top: 0,
                  bottom: 0,
                  width: 2,
                  background: 'rgba(255, 255, 255, 0.25)',
                  zIndex: 2
                }}></div>

                {/* Bar Fill */}
                <div style={{
                  width: `${Math.min(100, Math.max(0, ind.skor_persen))}%`,
                  height: '100%',
                  background: `linear-gradient(90deg, ${barColor} 0%, ${barColor} 100%)`,
                  borderRadius: 8,
                  transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: `0 0 12px ${barColor}`
                }}></div>
              </div>

              {/* Marker Labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                <span>0% (Sangat Kritis)</span>
                <span style={{ position: 'relative', left: '-5%' }}>50% (Batas Waspada)</span>
                <span style={{ position: 'relative', left: '5%' }}>70% (Batas Kuat)</span>
                <span>100%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
