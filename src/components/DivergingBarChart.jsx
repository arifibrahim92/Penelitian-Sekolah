'use client';

import { useState } from 'react';
import { QUESTIONS, DIMENSIONS } from '@/lib/instrument.js';

export default function DivergingBarChart({ itemStats = {} }) {
  const [selectedDimension, setSelectedDimension] = useState('all');

  const filteredQuestions = QUESTIONS.filter(q => {
    if (selectedDimension === 'all') return true;
    return q.dimensionId === selectedDimension;
  });

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>
            Chart 1: Distribusi Respons Item Kuesioner (Q1 – Q24)
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Diverging 100% Stacked Horizontal Bar — Menampilkan sebaran pilihan responden untuk setiap butir instrumen.
          </p>
        </div>

        {/* Dimension Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedDimension('all')}
            className={`btn btn-sm ${selectedDimension === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Semua ({QUESTIONS.length})
          </button>
          {Object.entries(DIMENSIONS).map(([key, def]) => (
            <button
              key={key}
              onClick={() => setSelectedDimension(key)}
              className={`btn btn-sm ${selectedDimension === key ? 'btn-primary' : 'btn-secondary'}`}
            >
              {def.title} ({def.items.length})
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16, flexWrap: 'wrap', fontSize: '0.82rem', fontWeight: 600 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--likert-sts)' }}></span>
          <span>Sangat Tidak Setuju (STS)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--likert-ts)' }}></span>
          <span>Tidak Setuju (TS)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--likert-s)' }}></span>
          <span>Setuju (S)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--likert-ss)' }}></span>
          <span>Sangat Setuju (SS)</span>
        </div>
      </div>

      {/* Chart Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredQuestions.map(q => {
          const stats = itemStats[q.code] || {
            percentages: { STS: 0, TS: 0, S: 0, SS: 0 },
            counts: { STS: 0, TS: 0, S: 0, SS: 0 },
            safeRate: 0,
            vulnerableRate: 0,
            meanScore: 0
          };

          const isFavorable = q.valence === 'FAVORABLE';

          return (
            <div key={q.code} style={{
              background: 'rgba(15, 23, 42, 0.45)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px 14px'
            }}>
              {/* Question Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontWeight: 800,
                    fontSize: '0.88rem',
                    color: '#fff',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '2px 8px',
                    borderRadius: 4
                  }}>
                    {q.code}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: isFavorable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: isFavorable ? '#34d399' : '#fbbf24',
                    border: `1px solid ${isFavorable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
                  }}>
                    {isFavorable ? 'Favorable (+)' : 'Unfavorable (-)'}
                  </span>
                  <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {q.text}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, fontSize: '0.8rem' }}>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Aman: {stats.safeRate}%</span>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>Rentan: {stats.vulnerableRate}%</span>
                  <span style={{ color: 'var(--text-muted)' }}>Rata-rata: {stats.meanScore}</span>
                </div>
              </div>

              {/* 100% Stacked Bar */}
              <div style={{
                display: 'flex',
                height: 22,
                borderRadius: 6,
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.05)',
                position: 'relative'
              }}>
                {/* STS */}
                {stats.percentages.STS > 0 && (
                  <div
                    title={`STS: ${stats.percentages.STS}% (${stats.counts.STS} siswa)`}
                    style={{
                      width: `${stats.percentages.STS}%`,
                      background: 'var(--likert-sts)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#fff',
                      transition: 'width 0.4s ease'
                    }}
                  >
                    {stats.percentages.STS >= 6 ? `${stats.percentages.STS}%` : ''}
                  </div>
                )}
                {/* TS */}
                {stats.percentages.TS > 0 && (
                  <div
                    title={`TS: ${stats.percentages.TS}% (${stats.counts.TS} siswa)`}
                    style={{
                      width: `${stats.percentages.TS}%`,
                      background: 'var(--likert-ts)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#000',
                      transition: 'width 0.4s ease'
                    }}
                  >
                    {stats.percentages.TS >= 6 ? `${stats.percentages.TS}%` : ''}
                  </div>
                )}
                {/* S */}
                {stats.percentages.S > 0 && (
                  <div
                    title={`S: ${stats.percentages.S}% (${stats.counts.S} siswa)`}
                    style={{
                      width: `${stats.percentages.S}%`,
                      background: 'var(--likert-s)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#fff',
                      transition: 'width 0.4s ease'
                    }}
                  >
                    {stats.percentages.S >= 6 ? `${stats.percentages.S}%` : ''}
                  </div>
                )}
                {/* SS */}
                {stats.percentages.SS > 0 && (
                  <div
                    title={`SS: ${stats.percentages.SS}% (${stats.counts.SS} siswa)`}
                    style={{
                      width: `${stats.percentages.SS}%`,
                      background: 'var(--likert-ss)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      color: '#fff',
                      transition: 'width 0.4s ease'
                    }}
                  >
                    {stats.percentages.SS >= 6 ? `${stats.percentages.SS}%` : ''}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
