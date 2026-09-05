'use client';

import { DIMENSIONS } from '@/lib/instrument.js';

export default function FacetedComparativeBar({ responses = [], platformDistribution = {} }) {
  // Hitung agregasi dimensi per platform
  const platforms = ['Instagram', 'TikTok', 'YouTube', 'X', 'Facebook'];

  const statsByPlatform = {};
  for (const plat of platforms) {
    statsByPlatform[plat] = {
      total: 0,
      dimensions: {
        literasi_digital: { actual: 0, max: 0, percent: 0 },
        toleransi: { actual: 0, max: 0, percent: 0 },
        anti_kekerasan: { actual: 0, max: 0, percent: 0 },
        anti_radikal_terorisme: { actual: 0, max: 0, percent: 0 }
      }
    };
  }

  for (const r of responses) {
    const plat = (r.favorite_social_media || '').trim();
    const targetPlat = platforms.find(p => p.toLowerCase() === plat.toLowerCase()) || 'Lainnya';
    if (!statsByPlatform[targetPlat]) continue;

    statsByPlatform[targetPlat].total++;
    const scored = typeof r.scored_responses === 'string' ? JSON.parse(r.scored_responses) : (r.scored_responses || {});

    for (const [dimKey, dimDef] of Object.entries(DIMENSIONS)) {
      for (const code of dimDef.items) {
        statsByPlatform[targetPlat].dimensions[dimKey].actual += (scored[code] || 0);
        statsByPlatform[targetPlat].dimensions[dimKey].max += 4;
      }
    }
  }

  // Hitung persentase
  for (const plat of platforms) {
    const pData = statsByPlatform[plat];
    for (const dimKey of Object.keys(DIMENSIONS)) {
      const d = pData.dimensions[dimKey];
      d.percent = d.max > 0 ? Number(((d.actual / d.max) * 100).toFixed(2)) : 0;
    }
  }

  return (
    <div className="glass-card" style={{ marginBottom: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: 4 }}>
          Chart 3: Faceted Comparative Bar (Platform Medsos vs 4 Dimensi)
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Komparasi tingkat ketahanan ideologis dan toleransi siswa berdasarkan kanal media sosial utama yang sering mereka akses.
        </p>
      </div>

      {/* Grid of Platform Subplots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16
      }}>
        {platforms.map(plat => {
          const pData = statsByPlatform[plat];
          return (
            <div key={plat} style={{
              background: 'rgba(15, 23, 42, 0.55)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '16px'
            }}>
              {/* Platform Title */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
                  {plat}
                </span>
                <span style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--text-secondary)'
                }}>
                  {pData.total} Siswa
                </span>
              </div>

              {pData.total === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Belum ada responden
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {Object.entries(DIMENSIONS).map(([dimKey, dimDef]) => {
                    const score = pData.dimensions[dimKey].percent;
                    let color = 'var(--status-critical)';
                    if (score >= 70.0) color = 'var(--status-safe)';
                    else if (score >= 50.0) color = 'var(--status-warning)';

                    return (
                      <div key={dimKey}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-secondary)' }}>{dimDef.title}</span>
                          <span style={{ fontWeight: 700, color }}>{score}%</span>
                        </div>
                        <div style={{
                          height: 8,
                          width: '100%',
                          background: 'rgba(255, 255, 255, 0.06)',
                          borderRadius: 4,
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(100, Math.max(0, score))}%`,
                            height: '100%',
                            background: color,
                            borderRadius: 4,
                            transition: 'width 0.4s ease'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
