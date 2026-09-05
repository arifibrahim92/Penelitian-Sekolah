import Link from 'next/link';
import { Shield, KeyRound, BarChart3, Users, CheckCircle2, ArrowRight, BookOpen, Layers } from 'lucide-react';
import { getDb } from '@/lib/db.js';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let project = null;
  let totalResponses = 0;
  let activeEnumerators = 0;
  let totalSchools = 0;

  try {
    const db = await getDb();
    const p = db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC').get('ACTIVE') || db.prepare('SELECT * FROM projects ORDER BY created_at DESC').get();
    if (p) {
      project = p;
      totalResponses = db.prepare('SELECT COUNT(*) as count FROM survey_responses WHERE project_id = ?').get(project.id)?.count || 0;
      activeEnumerators = db.prepare("SELECT COUNT(*) as count FROM enumerators WHERE project_id = ? AND status = 'ACTIVE'").get(project.id)?.count || 0;
      totalSchools = db.prepare('SELECT COUNT(DISTINCT school_name) as count FROM survey_responses WHERE project_id = ?').get(project.id)?.count || 0;
    }
  } catch (err) {
    console.warn('DB load warning on HomePage:', err?.message);
  }

  const percentTarget = project && project.target_sample ? Math.min(100, Number(((totalResponses / project.target_sample) * 100).toFixed(1))) : 0;

  return (
    <div className="animate-fade-in" style={{ padding: '20px 0 40px' }}>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', maxWidth: 880, margin: '0 auto 40px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(79, 70, 229, 0.12)',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          padding: '6px 16px',
          borderRadius: 30,
          marginBottom: 16
        }}>
          <Shield size={16} color="#818cf8" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.04em' }}>
            BADAN NASIONAL PENANGGULANGAN TERORISME (BNPT RI)
          </span>
        </div>

        <h1 style={{ fontSize: '2.4rem', lineHeight: 1.25, marginBottom: 16, fontWeight: 800 }}>
          Platform Survei Lapangan &amp; <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #06b6d4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Analytics Engine Psikometri Sekolah
          </span>
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Riset Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial pada Satuan Pendidikan Menengah Atas. Mengotomatiskan pengumpulan data terisolasi, standardisasi skoring inversi Likert, dan tabulasi silang analitik.
        </p>
      </div>

      {/* Live Project Overview Banner */}
      <div className="glass-card" style={{ maxWidth: 1000, margin: '0 auto 40px', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(30, 41, 67, 0.6) 100%)' }}>
        {project ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Wilayah Riset Terkini
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                  {project.project_name} ({project.province})
                </div>
              </div>
              <span className="badge badge-safe">
                <CheckCircle2 size={13} />
                STATUS: AKTIF BERJALAN
              </span>
            </div>

            {/* 4 Key Live Indicators */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Responden Masuk</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8' }}>{totalResponses}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Target: {project.target_sample} siswa</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ketercapaian Kuota</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{percentTarget}%</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Margin of Error: ~12%</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Enumerator Aktif</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a78bfa' }}>{activeEnumerators}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Akses via PIN 6-digit</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sekolah Terdata</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{totalSchools}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMK / SMA / MA</div>
              </div>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14
            }}>
              <Layers size={24} color="#818cf8" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 8, color: '#fff' }}>
              Belum Ada Riset yang Terdaftar
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 520, margin: '0 auto 18px', lineHeight: 1.6 }}>
              Seluruh proyek riset sebelumnya telah dibersihkan. Peneliti dapat masuk ke Portal Admin untuk mendaftarkan proyek riset baru, menentukan target kuota sampel, dan mendistribusikan PIN enumerator lapangan.
            </p>
            <Link href="/admin/login" className="btn btn-primary btn-sm">
              <span>Buka Portal Peneliti (Admin)</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Two Entry Portals */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: 28,
        maxWidth: 1000,
        margin: '0 auto'
      }}>
        {/* Portal 1: Enumerator Lapangan */}
        <div className="glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(6, 182, 212, 0.3)',
          boxShadow: '0 8px 30px rgba(6, 182, 212, 0.15)'
        }}>
          <div>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(6, 182, 212, 0.15)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <KeyRound size={26} color="#06b6d4" />
            </div>

            <h2 style={{ fontSize: '1.45rem', marginBottom: 10 }}>Portal Enumerator Lapangan</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Antarmuka survei kuesioner terisolasi. Surveyor dapat langsung masuk menggunakan <b>PIN 6-Digit</b> tanpa password rumit. Dilengkapi pendampingan pengisian kuesioner siswa secara offline/online cepat.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#06b6d4" /> Akses PIN 6-digit terisolasi &amp; aman
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#06b6d4" /> Form 24 butir Likert ramah smartphone
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#06b6d4" /> Tombol cepat "Input Responden Baru"
              </li>
            </ul>
          </div>

          <Link href="/survey/login" className="btn btn-accent btn-lg" style={{ width: '100%' }}>
            <span>Masuk Sebagai Surveyor (PIN)</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Portal 2: Peneliti / Admin Kontrol */}
        <div className="glass-card" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          border: '1px solid rgba(79, 70, 229, 0.3)',
          boxShadow: '0 8px 30px rgba(79, 70, 229, 0.15)'
        }}>
          <div>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'rgba(79, 70, 229, 0.15)',
              border: '1px solid rgba(79, 70, 229, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20
            }}>
              <Shield size={26} color="#818cf8" />
            </div>

            <h2 style={{ fontSize: '1.45rem', marginBottom: 10 }}>Dashboard Peneliti / Admin</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
              Pusat kendali riset nasional. Pantau kuota sampel per sekolah, kelola dan kunci PIN enumerator, jalankan mesin inversi psikometri, analisis grafik interaktif, dan ekspor data JSON PRD.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#818cf8" /> Manajemen Proyek, Enumerator &amp; PIN
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#818cf8" /> Inversi Likert Otomatis (7 Indikator &amp; 4 Dimensi)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle2 size={14} color="#818cf8" /> Ekspor JSON Skema PRD 7.1, CSV, &amp; Laporan
              </li>
            </ul>
          </div>

          <Link href="/admin/login" className="btn btn-primary btn-lg" style={{ width: '100%' }}>
            <span>Masuk Portal Peneliti (Admin)</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
