'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3, Users, Database, Download, AlertTriangle,
  CheckCircle2, AlertOctagon, TrendingUp, Shield, Clock,
  Smartphone, ArrowRight, RefreshCw, PlusCircle, FolderPlus, Layers
} from 'lucide-react';
import { useActiveProject } from '@/lib/projectContext.js';

export default function AdminDashboard() {
  const { projectId, activeProject } = useActiveProject();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async () => {
    try {
      const targetId = projectId || 'PRJ-2026-JB-001';
      const res = await fetch(`/api/analytics?projectId=${targetId}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching dashboard analytics:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [projectId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        Memuat data eksekutif riset...
      </div>
    );
  }

  const { project, analytics } = data || {};
  const total = analytics?.totalResponden || 0;
  const target = project?.target_sample || 400;
  const percentAchieved = Math.min(100, Number(((total / target) * 100).toFixed(1)));
  const dim = analytics?.dimensionResults || {};
  const ind = analytics?.indicatorResults || {};

  // Cari indikator kritis / waspada untuk early warning
  const criticalIndicators = Object.values(ind).filter(i => i.skor_persen < 50.0);
  const warningIndicators = Object.values(ind).filter(i => i.skor_persen >= 50.0 && i.skor_persen < 70.0);

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-safe">PROYEK AKTIF</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {project?.id}</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Dashboard Kontrol &amp; Live Monitoring Riset
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Wilayah Analisis: <b>{project?.province}</b> | Satuan Pendidikan Menengah
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Memperbarui...' : 'Segarkan Data'}</span>
          </button>
          <Link href="/admin/projects" className="btn btn-secondary btn-sm">
            <FolderPlus size={14} />
            <span>Multi-Penelitian</span>
          </Link>
          <Link href="/admin/enumerators" className="btn btn-primary btn-sm">
            <Users size={14} />
            <span>Kelola Enumerator &amp; PIN</span>
          </Link>
          <Link href="/admin/export" className="btn btn-secondary btn-sm">
            <Download size={14} />
            <span>Ekspor Data</span>
          </Link>
        </div>
      </div>

      {/* Target Progress Card */}
      <div className="glass-card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 67, 0.7) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              PROGRESS TARGET KUOTA RESPONDEN SISWA
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {total} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/ {target} Responden Valid Terkumpul</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: percentAchieved >= 100 ? '#34d399' : '#38bdf8' }}>
              {percentAchieved}%
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Margin of Error: ±{analytics?.marginOfError}%
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: 14,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: 8,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${percentAchieved}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
            borderRadius: 8,
            transition: 'width 0.6s ease'
          }}></div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 28
      }}>
        {/* Card 1 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Rasio Sikap Aman
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--status-safe-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="var(--status-safe)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-safe)' }}>
            {analytics?.overallSafeRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Favorable Response Rate
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Rasio Sikap Rentan
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--status-critical-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="var(--status-critical)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--status-critical)' }}>
            {analytics?.overallVulnerableRate}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Unfavorable / Kerentanan Opini
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Peringatan Dini
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--status-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertOctagon size={18} color="var(--status-warning)" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: criticalIndicators.length > 0 ? '#f87171' : '#fbbf24' }}>
            {criticalIndicators.length} Kritis / {warningIndicators.length} Waspada
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Dari 7 Indikator Operasional
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Akses &amp; Surveyor
            </span>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#06b6d4" />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>
            {analytics?.structuredJson?.metadata_riset?.jumlah_enumerator_aktif || 0} Aktif
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Otentikasi PIN 6-digit terisolasi
          </div>
        </div>
      </div>

      {/* Early Warning Widget (jika ada indikator kritis) */}
      {criticalIndicators.length > 0 && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '18px 22px',
          marginBottom: 28,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 16
        }}>
          <AlertOctagon size={24} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: '#fca5a5', marginBottom: 4 }}>
              Peringatan Dini Analitik: Terdapat Indikator Berada di Bawah Ambang Aman (&lt;50%)
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 10 }}>
              Indikator berikut memerlukan perhatian khusus dalam kurikulum pencegahan intoleransi dan literasi digital sekolah:
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {criticalIndicators.map(ci => (
                <span key={ci.id} className="badge badge-critical">
                  {ci.title} ({ci.skor_persen}%)
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4 Dimensi Sikap Overview */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 16 }}>
        Capaian 4 Dimensi Sikap Siswa
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18,
        marginBottom: 32
      }}>
        {Object.entries(dim).map(([key, d]) => {
          let color = 'var(--status-critical)';
          let badgeClass = 'badge-critical';
          if (d.skor_indeks_dimensi_persen >= 70.0) {
            color = 'var(--status-safe)';
            badgeClass = 'badge-safe';
          } else if (d.skor_indeks_dimensi_persen >= 50.0) {
            color = 'var(--status-warning)';
            badgeClass = 'badge-warning';
          }

          return (
            <div key={key} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{d.title}</h3>
                  <span className={`badge ${badgeClass}`}>{d.status}</span>
                </div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                  {d.description}
                </p>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Skor Indeks:</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{d.skor_indeks_dimensi_persen}%</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    width: `${d.skor_indeks_dimensi_persen}%`,
                    height: '100%',
                    background: color,
                    borderRadius: 4
                  }}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Navigation Cards */}
      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 16 }}>
        Modul Sistem &amp; Manajemen Lapangan
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 18
      }}>
        <Link href="/admin/enumerators" className="glass-card" style={{ display: 'block', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Users size={22} color="#818cf8" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Manajemen Enumerator &amp; PIN</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Daftarkan surveyor, terbitkan PIN unik 6-digit, kelola penugasan sekolah, serta kunci atau cabut akses PIN sewaktu-waktu.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#818cf8', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>Buka Modul Surveyor</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        <Link href="/admin/responses" className="glass-card" style={{ display: 'block', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Database size={22} color="#06b6d4" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Data Mentah Responden Siswa</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Jelajahi, cari, dan filter seluruh kuesioner terinput. Dukungan impor berkas Excel massal serta ekspor tabel ke CSV.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#06b6d4', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>Buka Data Explorer</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        <Link href="/admin/analytics" className="glass-card" style={{ display: 'block', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <BarChart3 size={22} color="#10b981" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Visual Analytics &amp; Tabulasi Silang</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Grafik Diverging Bar 100% (Q1–Q24), Grouped Bar Indikator Sikap, Faceted Bar Medsos, dan 4 matriks tabulasi silang.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>Buka Grafik &amp; Analitik</span>
            <ArrowRight size={14} />
          </div>
        </Link>

        <Link href="/admin/export" className="glass-card" style={{ display: 'block', transition: 'transform 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <Download size={22} color="#f59e0b" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pusat Ekspor &amp; Laporan Eksekutif</h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 14 }}>
            Unduh output terstruktur JSON resmi sesuai skema PRD 7.1, CSV berskor, dan cetak Laporan Riset Eksekutif BNPT.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b', fontSize: '0.85rem', fontWeight: 700 }}>
            <span>Buka Pusat Ekspor</span>
            <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  );
}
