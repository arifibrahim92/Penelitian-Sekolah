'use client';

import { useState, useEffect } from 'react';
import {
  Download, Copy, Check, FileCode, FileSpreadsheet, Printer,
  Shield, CheckCircle2, AlertOctagon, Bookmark, FileText, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { useActiveProject } from '@/lib/projectContext.js';

export default function ExportHubPage() {
  const { projectId, activeProject } = useActiveProject();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'csv' | 'report'

  useEffect(() => {
    setLoading(true);
    const targetId = projectId || 'PRJ-2026-JB-001';
    fetch(`/api/analytics?projectId=${targetId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [projectId]);

  const handleCopyJson = () => {
    if (!data?.analytics?.structuredJson) return;
    navigator.clipboard.writeText(JSON.stringify(data.analytics.structuredJson, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        Menyiapkan dokumen ekspor dan laporan...
      </div>
    );
  }

  const { project, analytics } = data || {};
  const jsonOutput = analytics?.structuredJson || {};
  const dim = analytics?.dimensionResults || {};
  const ind = analytics?.indicatorResults || {};

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 80 }}>
      {/* Page Header (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-safe">{activeProject?.project_name || 'Riset Aktif'}</span>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>ID: {projectId}</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Pusat Ekspor Terstruktur &amp; Laporan Riset Eksekutif
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Unduh seluruh berkas data riset dalam skema JSON baku PRD 7.1, CSV mentah/berskor, atau cetak laporan resmi.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm">
            <Printer size={14} />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Tabs (Hidden on Print) */}
      <div className="no-print" style={{
        display: 'flex',
        gap: 10,
        marginBottom: 24,
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: 12
      }}>
        <button
          onClick={() => setActiveTab('json')}
          className={`btn ${activeTab === 'json' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileCode size={16} />
          <span>Output JSON Baku (PRD 7.1)</span>
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`btn ${activeTab === 'csv' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileSpreadsheet size={16} />
          <span>Ekspor CSV (Mentah &amp; Berskor)</span>
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`btn ${activeTab === 'report' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Bookmark size={16} />
          <span>Laporan Riset Eksekutif BNPT</span>
        </button>
        <button
          onClick={() => setActiveTab('draft')}
          className={`btn ${activeTab === 'draft' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={16} />
          <span>Draft Instrumen Kuesioner</span>
        </button>
      </div>

      {/* TAB 1: JSON OUTPUT (PRD 7.1) */}
      {activeTab === 'json' && (
        <div className="no-print glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 4 }}>
                Skema JSON Baku (PRD Section 7.1)
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Format terstruktur untuk integrasi API downstream, visualizer eksternal, atau arsip data riset nasional.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleCopyJson} className="btn btn-secondary btn-sm">
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
              </button>
              <a href={`/api/export?format=json&projectId=${projectId || 'PRJ-2026-JB-001'}`} download className="btn btn-accent btn-sm">
                <Download size={14} />
                <span>Unduh Berkas JSON</span>
              </a>
            </div>
          </div>

          <pre style={{
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            padding: '20px',
            fontSize: '0.84rem',
            fontFamily: 'monospace',
            color: '#a5f3fc',
            maxHeight: 560,
            overflowY: 'auto',
            lineHeight: 1.5
          }}>
            {JSON.stringify(jsonOutput, null, 2)}
          </pre>
        </div>
      )}

      {/* TAB 2: CSV EXPORTS */}
      {activeTab === 'csv' && (
        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <FileSpreadsheet size={24} color="#06b6d4" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CSV Data Mentah Responden</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Berisi identitas profil siswa (gender, agama, kelas, sekolah), perilaku bermedia sosial, serta seluruh jawaban asli Q1–Q24 dalam huruf alfabet (SS, S, TS, STS).
            </p>
            <a href={`/api/export?format=csv_raw&projectId=${projectId || 'PRJ-2026-JB-001'}`} download className="btn btn-secondary btn-lg" style={{ width: '100%' }}>
              <Download size={18} />
              <span>Unduh CSV Data Mentah</span>
            </a>
          </div>

          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <FileSpreadsheet size={24} color="#10b981" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CSV Data Berskor (Inversi)</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Berisi nilai numerik terstandarisasi (1–4) setelah penerapan aturan pembalikan (*inversion*) butir unfavorable, dilengkapi total akumulasi dan rata-rata skor per siswa.
            </p>
            <a href={`/api/export?format=csv_scored&projectId=${projectId || 'PRJ-2026-JB-001'}`} download className="btn btn-accent btn-lg" style={{ width: '100%' }}>
              <Download size={18} />
              <span>Unduh CSV Data Berskor</span>
            </a>
          </div>
        </div>
      )}

      {/* TAB 4: DRAFT INSTRUMEN KUESIONER */}
      {activeTab === 'draft' && (
        <div className="no-print">
          <div className="glass-card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>
                  Draft Instrumen Kuesioner Survei Respon Siswa
                </h3>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Unduh berkas draft lembar kuesioner instrumen penelitian lapangan dalam berbagai format (Word, Teks, Siap Cetak PDF, atau JSON).
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Card Word */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileText size={20} color="#60a5fa" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Format Microsoft Word (.docx)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Dokumen Resmi BNPT RI</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                    Naskah resmi instrumen survei BNPT RI lengkap dengan latar belakang riset, kisi-kisi alat ukur, indikator, dan lembar kuesioner siap edit.
                  </p>
                </div>
                <a
                  href="/api/instrument/download?format=docx"
                  download
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%', background: '#2563eb' }}
                >
                  <Download size={14} />
                  <span>Unduh Dokumen Word (.docx)</span>
                </a>
              </div>

              {/* Card Print PDF */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Printer size={20} color="#34d399" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Lembar Siap Cetak (A4 PDF)</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kop Resmi &amp; Kotak Centang</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                    Tampilan lembar kuesioner formal A4 dengan kop BNPT RI, tabel 24 butir Likert, kolom profil siswa, dan kolom tanda tangan pengesahan.
                  </p>
                </div>
                <Link
                  href="/survey/draft"
                  className="btn btn-accent btn-sm"
                  style={{ width: '100%' }}
                >
                  <ExternalLink size={14} />
                  <span>Buka Lembar Siap Cetak</span>
                </Link>
              </div>

              {/* Card TXT */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: 'rgba(6, 182, 212, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FileCode size={20} color="#22d3ee" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>Format Teks / JSON</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Arsip Teks &amp; Data Struktur</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                    Naskah kuesioner dalam format teks murni (.txt) atau skema struktur JSON berisi seluruh daftar 24 butir dan taksonomi dimensi.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href="/api/instrument/download?format=txt"
                    download
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Download size={13} />
                    <span>TXT</span>
                  </a>
                  <a
                    href="/api/instrument/download?format=json"
                    download
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                  >
                    <Download size={13} />
                    <span>JSON</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3 / PRINT VIEW: EXECUTIVE REPORT */}
      {(activeTab === 'report' || typeof window !== 'undefined') && (
        <div className={activeTab !== 'report' ? 'only-print' : ''} style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '40px 48px',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
          maxWidth: 960,
          margin: '0 auto'
        }}>
          {/* Official Research Header */}
          <div style={{
            borderBottom: '3px double #0f172a',
            paddingBottom: 20,
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 20
          }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              background: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Shield size={32} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.08em', color: '#4338ca' }}>
                BADAN NASIONAL PENANGGULANGAN TERORISME REPUBLIK INDONESIA (BNPT RI)
              </div>
              <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
                LAPORAN EKSEKUTIF HASIL SURVEI RESPON SISWA TERHADAP NARASI RADIKAL TERORISME DI MEDIA SOSIAL
              </h2>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Satuan Pendidikan Menengah Atas (SMA / SMK / MA) • Tahun Anggaran 2024 / 2026
              </div>
            </div>
          </div>

          {/* Metadata Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            fontSize: '0.85rem'
          }}>
            <div><b>Wilayah Analisis:</b> {project?.province}</div>
            <div><b>Total Sampel Valid:</b> {analytics?.totalResponden} Siswa</div>
            <div><b>Target Sampel:</b> {project?.target_sample} Siswa</div>
            <div><b>Margin of Error:</b> ±{analytics?.marginOfError}%</div>
            <div><b>Jumlah Enumerator:</b> {jsonOutput?.metadata_riset?.jumlah_enumerator_aktif || 1} Aktif</div>
            <div><b>Waktu Pemrosesan:</b> {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</div>
          </div>

          {/* Section 1: Ringkasan Eksekutif */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12 }}>
              1. Ringkasan Eksekutif &amp; Temuan Kunci
            </h3>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#334155', textAlign: 'justify' }}>
              Berdasarkan pengukuran kuantitatif terhadap <b>{analytics?.totalResponden} responden</b> siswa di satuan pendidikan menengah di wilayah {project?.province}, diperoleh gambaran bahwa rasio respon aman terhadap narasi toleransi dan kebangsaan berada pada angka <b>{analytics?.overallSafeRate}%</b>, sementara potensi kerentanan terhadap paparan narasi ekstremis terdeteksi sebesar <b>{analytics?.overallVulnerableRate}%</b>.
            </p>
          </div>

          {/* Section 2: Capaian 4 Dimensi */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 14 }}>
              2. Indeks Capaian 4 Dimensi Sikap Siswa
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: 16 }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Dimensi Sikap</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Total Butir</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Skor Indeks (%)</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Status Psikometri</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(dim).map(([k, d]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px', fontWeight: 600 }}>{d.title}</td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{d.items.length} Butir</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 800, color: d.skor_indeks_dimensi_persen >= 70 ? '#059669' : '#d97706' }}>
                      {d.skor_indeks_dimensi_persen}%
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        background: d.skor_indeks_dimensi_persen >= 70 ? '#d1fae5' : '#fef3c7',
                        color: d.skor_indeks_dimensi_persen >= 70 ? '#065f46' : '#92400e'
                      }}>
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 3: 7 Indikator Operasional */}
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 14 }}>
              3. Kinerja 7 Indikator Operasional Perilaku &amp; Opini Siswa
            </h3>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Indikator Operasional</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Capaian (%)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Rasio Aman</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Rasio Rentan</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ind).map(([k, i]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 600 }}>{i.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Item: {i.items.join(', ')}</div>
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 800 }}>
                      {i.skor_persen}%
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', fontWeight: 700 }}>
                      {i.status}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#059669', fontWeight: 600 }}>
                      {i.fav_rate}%
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', color: '#dc2626', fontWeight: 600 }}>
                      {i.unfav_rate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 4: Rekomendasi Kebijakan BNPT */}
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', borderBottom: '1px solid #e2e8f0', paddingBottom: 6, marginBottom: 12 }}>
              4. Rekomendasi Kebijakan Pencegahan
            </h3>
            <ol style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, paddingLeft: 20 }}>
              <li style={{ marginBottom: 6 }}>
                <b>Penguatan Kurikulum Verifikasi Digital:</b> Melatih siswa untuk melakukan perbandingan fakta lintas-sumber sebelum menyebarkan konten keagamaan viral.
              </li>
              <li style={{ marginBottom: 6 }}>
                <b>Program Sekolah Damai BNPT:</b> Menyelenggarakan dialog antar-iman interaktif guna menekan polarisasi di kolom komentar media sosial.
              </li>
              <li>
                <b>Pemantauan Kanal Rentan:</b> Memfokuskan kontra-narasi pada platform media sosial yang paling banyak diakses siswa dengan konten video pendek.
              </li>
            </ol>
          </div>

          {/* Signatures */}
          <div style={{ marginTop: 40, display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div>Mengetahui,</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>Direktorat Pencegahan BNPT RI</div>
              <div style={{ height: 60 }}></div>
              <div style={{ fontWeight: 700 }}>( .................................................... )</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div>Kota Bandung, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>Ketua Tim Peneliti Lapangan</div>
              <div style={{ height: 60 }}></div>
              <div style={{ fontWeight: 700 }}>Dr. Haris Fatwa, M.Si</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
