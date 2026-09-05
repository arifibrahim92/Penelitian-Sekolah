'use client';

import { useState, useEffect } from 'react';
import DivergingBarChart from '@/components/DivergingBarChart';
import GroupedBarChart from '@/components/GroupedBarChart';
import FacetedComparativeBar from '@/components/FacetedComparativeBar';
import { BarChart3, Download, RefreshCw, CheckCircle2, Layers, Grid, Sliders, Smartphone } from 'lucide-react';
import { DIMENSIONS, INDICATORS } from '@/lib/instrument.js';
import { useActiveProject } from '@/lib/projectContext.js';

export default function AnalyticsPage() {
  const { projectId, activeProject } = useActiveProject();
  const [data, setData] = useState(null);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('charts'); // 'charts' | 'crosstab'

  const loadData = async () => {
    setLoading(true);
    try {
      const targetId = projectId || 'PRJ-2026-JB-001';
      const [anRes, respRes] = await Promise.all([
        fetch(`/api/analytics?projectId=${targetId}`),
        fetch(`/api/survey/responses?projectId=${targetId}&limit=500`)
      ]);
      const anData = await anRes.json();
      const respData = await respRes.json();

      if (anData.success) {
        setData(anData);
      }
      if (respData.success) {
        setResponses(respData.responses || []);
      }
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        Menjalankan kalkulasi skoring psikometri dan tabulasi silang...
      </div>
    );
  }

  const { project, analytics } = data || {};
  const ct = analytics?.crossTabulations || {};

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-safe">{activeProject?.project_name || 'Riset Aktif'}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ID: {projectId}</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Mesin Analitik &amp; Visualisasi Psikometri
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Hasil agregasi 7 indikator, 4 dimensi, pembalikan butir (*inversion*), dan 4 matriks tabulasi silang.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            <span>Kalkulasi Ulang</span>
          </button>
          <a href="/api/export?format=json" download className="btn btn-accent btn-sm">
            <Download size={14} />
            <span>Unduh JSON PRD</span>
          </a>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        gap: 10,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 12
      }}>
        <button
          onClick={() => setActiveTab('charts')}
          className={`btn ${activeTab === 'charts' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <BarChart3 size={16} />
          <span>Blueprint Visualisasi Grafik (PRD 7.2)</span>
        </button>
        <button
          onClick={() => setActiveTab('crosstab')}
          className={`btn ${activeTab === 'crosstab' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Grid size={16} />
          <span>Matriks Tabulasi Silang (PRD Bagian 6)</span>
        </button>
      </div>

      {activeTab === 'charts' && (
        <div>
          {/* Chart 1: Diverging 100% Stacked Bar (Q1 - Q24) */}
          <DivergingBarChart itemStats={analytics?.itemStats || {}} />

          {/* Chart 2: Grouped Bar Chart Indikator Kinerja Sikap (7 Indikator) */}
          <GroupedBarChart indicatorResults={analytics?.indicatorResults || {}} />

          {/* Chart 3: Faceted Comparative Bar (Platform vs Dimensi) */}
          <FacetedComparativeBar
            responses={responses}
            platformDistribution={analytics?.platformDistribution || {}}
          />
        </div>
      )}

      {activeTab === 'crosstab' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Matriks 1: Gender vs 4 Dimensi */}
          <div className="glass-card">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>
                Matriks 1: Analisis Silang Gender vs 4 Dimensi Sikap
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Variabel Independen: Jenis Kelamin (Laki-Laki, Perempuan) | Variabel Dependen: 4 Dimensi Sikap (%)
              </p>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Jenis Kelamin</th>
                    <th>Literasi Digital (%)</th>
                    <th>Toleransi (%)</th>
                    <th>Anti Kekerasan (%)</th>
                    <th>Anti Radikal Terorisme (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {['perempuan', 'laki_laki'].map(gKey => {
                    const row = ct.genderVsDimensions?.[gKey] || {};
                    const label = gKey === 'perempuan' ? 'Perempuan' : 'Laki-Laki';
                    return (
                      <tr key={gKey}>
                        <td style={{ fontWeight: 800, color: '#fff' }}>{label}</td>
                        <td style={{ fontWeight: 700, color: row.literasi_digital >= 70 ? '#34d399' : '#fbbf24' }}>
                          {row.literasi_digital || 0}%
                        </td>
                        <td style={{ fontWeight: 700, color: row.toleransi >= 70 ? '#34d399' : '#fbbf24' }}>
                          {row.toleransi || 0}%
                        </td>
                        <td style={{ fontWeight: 700, color: row.anti_kekerasan >= 70 ? '#34d399' : '#fbbf24' }}>
                          {row.anti_kekerasan || 0}%
                        </td>
                        <td style={{ fontWeight: 700, color: row.anti_radikal_terorisme >= 70 ? '#34d399' : '#fbbf24' }}>
                          {row.anti_radikal_terorisme || row.anti_radikal || 0}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriks 2: Platform Medsos vs 7 Indikator */}
          <div className="glass-card">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>
                Matriks 2: Platform Medsos Pilihan vs 7 Indikator Perilaku
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Persentase capaian sikap positif (%) per kanal platform media sosial yang digunakan siswa.
              </p>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Platform Medsos</th>
                    <th>Total Pengguna</th>
                    <th>1a. Bandingkan Sumber</th>
                    <th>1b. Kritisi Konten</th>
                    <th>2a. Terima Perbedaan</th>
                    <th>2b. Bebas Opini</th>
                    <th>2c. Kecam Ujaran</th>
                    <th>3a. Tolak Kekerasan</th>
                    <th>4a. Tolak Radikalisme</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ct.platformVsIndicators || {}).map(([plat, pData]) => {
                    const inds = pData.indicators || {};
                    return (
                      <tr key={plat}>
                        <td style={{ fontWeight: 800, color: '#38bdf8' }}>{plat}</td>
                        <td>{pData.total} siswa</td>
                        <td>{inds.a_membandingkan_sumber || 0}%</td>
                        <td>{inds.b_mengkritisi_konten || 0}%</td>
                        <td>{inds.a_menerima_perbedaan || 0}%</td>
                        <td>{inds.b_tidak_memaksakan_opini || 0}%</td>
                        <td>{inds.c_mengecam_ujaran_kebencian || 0}%</td>
                        <td style={{ fontWeight: 700, color: (inds.a_menolak_kekerasan || 0) >= 70 ? '#34d399' : '#fbbf24' }}>
                          {inds.a_menolak_kekerasan || 0}%
                        </td>
                        <td style={{ fontWeight: 700, color: (inds.a_menolak_ideologi_radikal || 0) >= 70 ? '#34d399' : '#fbbf24' }}>
                          {inds.a_menolak_ideologi_radikal || 0}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriks 3: Durasi Medsos vs Dimensi Kerentanan */}
          <div className="glass-card">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>
                Matriks 3: Durasi Bermedia Sosial vs Kerentanan Ideologis
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Korelasi antara intensitas waktu paparan media digital harian dengan sikap Anti-Kekerasan dan Anti-Radikal Terorisme.
              </p>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kelompok Durasi Harian</th>
                    <th>Jumlah Responden</th>
                    <th>Indeks Anti-Kekerasan (%)</th>
                    <th>Indeks Anti-Radikal Terorisme (%)</th>
                    <th>Status Kerentanan</th>
                  </tr>
                </thead>
                <tbody>
                  {['0-2 jam', '3-5 jam', '6-8 jam', '>8 jam'].map(dur => {
                    const row = ct.durationVsVulnerability?.[dur] || { total: 0, anti_kekerasan_persen: 0, anti_radikal_persen: 0 };
                    const avg = ((row.anti_kekerasan_persen + row.anti_radikal_persen) / 2).toFixed(1);
                    return (
                      <tr key={dur}>
                        <td style={{ fontWeight: 800, color: '#fff' }}>{dur}</td>
                        <td>{row.total} siswa</td>
                        <td style={{ fontWeight: 700, color: row.anti_kekerasan_persen >= 70 ? '#34d399' : '#fbbf24' }}>
                          {row.anti_kekerasan_persen}%
                        </td>
                        <td style={{ fontWeight: 700, color: row.anti_radikal_persen >= 70 ? '#34d399' : '#fbbf24' }}>
                          {row.anti_radikal_persen}%
                        </td>
                        <td>
                          {row.total === 0 ? (
                            <span style={{ color: 'var(--text-muted)' }}>-</span>
                          ) : Number(avg) >= 70 ? (
                            <span className="badge badge-safe">Resilien</span>
                          ) : (
                            <span className="badge badge-warning">Rentan Terpapar</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Matriks 4: Konten vs Platform */}
          <div className="glass-card">
            <div style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>
                Matriks 4: Preferensi Kategori Konten vs Platform Media Sosial
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Distribusi frekuensi topik yang paling banyak dikonsumsi oleh siswa pada masing-masing media sosial.
              </p>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Topik Konten</th>
                    <th>Instagram</th>
                    <th>TikTok</th>
                    <th>YouTube</th>
                    <th>X (Twitter)</th>
                    <th>Lainnya</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(ct.contentVsPlatform || {}).slice(0, 10).map(([topic, pCounts]) => (
                    <tr key={topic}>
                      <td style={{ fontWeight: 700, color: '#fff' }}>{topic}</td>
                      <td>{pCounts['Instagram'] || 0}</td>
                      <td>{pCounts['TikTok'] || 0}</td>
                      <td>{pCounts['YouTube'] || 0}</td>
                      <td>{pCounts['X'] || 0}</td>
                      <td>{pCounts['Lainnya'] || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
