'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderPlus, Layers, CheckCircle2, AlertCircle, Clock,
  Users, Database, ArrowRight, Plus, RefreshCw, X, Edit3, Shield
} from 'lucide-react';
import { useActiveProject } from '@/lib/projectContext.js';

export default function ProjectsManagementPage() {
  const { projectId, switchProject, projects, loadingProjects, refreshProjects } = useActiveProject();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Form State
  const [projectName, setProjectName] = useState('');
  const [province, setProvince] = useState('Jawa Barat');
  const [targetSample, setTargetSample] = useState(400);
  const [status, setStatus] = useState('ACTIVE');

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setErrorMessage('Judul penelitian wajib diisi');
      return;
    }

    setCreating(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_name: projectName.trim(),
          province: province.trim(),
          target_sample: parseInt(targetSample, 10),
          status
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal membuat proyek baru');
        setCreating(false);
        return;
      }

      setSuccessMessage(`Proyek "${data.project.project_name}" berhasil dibuat!`);
      setShowCreateModal(false);
      setProjectName('');
      setTargetSample(400);

      // Refresh list & automatically switch to newly created project
      await refreshProjects();
      if (data.project?.id) {
        switchProject(data.project.id);
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setErrorMessage('Terjadi kesalahan koneksi saat membuat proyek');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (proj) => {
    const newStatus = proj.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    const confirmMsg = proj.status === 'ACTIVE'
      ? `Apakah Anda ingin menutup status proyek "${proj.project_name}"?`
      : `Apakah Anda ingin mengaktifkan kembali proyek "${proj.project_name}"?`;
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: proj.id,
          status: newStatus
        })
      });
      if (res.ok) {
        refreshProjects();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 60 }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span className="badge badge-safe">MULTI-PENELITIAN</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total: {projects.length} Riset Terdaftar
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>
            Pusat Manajemen Proyek Riset Sekolah
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Kelola multi-penelitian, pantau kemajuan target sampel per wilayah, dan alihkan fokus kerja analisis.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={refreshProjects} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            <span>Segarkan</span>
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>+ Buat Penelitian Baru</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          color: '#34d399'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Projects Grid */}
      {loadingProjects ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Memuat daftar proyek riset...
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '56px 20px', maxWidth: 600, margin: '0 auto' }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
          }}>
            <Layers size={28} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Belum Ada Riset yang Terdaftar</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Seluruh data penelitian sebelumnya telah dibersihkan. Klik tombol di bawah untuk mendaftarkan proyek penelitian baru.
          </p>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>+ Buat Penelitian Baru</span>
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 20
        }}>
          {projects.map((proj) => {
            const isCurrent = proj.id === projectId;
            const total = proj.total_responses || 0;
            const target = proj.target_sample || 400;
            const percent = Math.min(100, Number(((total / target) * 100).toFixed(1)));
            const isClosed = proj.status === 'CLOSED';

            return (
              <div
                key={proj.id}
                className="glass-card"
                style={{
                  position: 'relative',
                  border: isCurrent ? '2px solid var(--primary-color)' : '1px solid var(--border-subtle)',
                  background: isCurrent ? 'rgba(30, 41, 67, 0.7)' : 'rgba(15, 23, 42, 0.65)',
                  boxShadow: isCurrent ? '0 0 25px rgba(79, 70, 229, 0.25)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  {/* Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`badge ${proj.status === 'ACTIVE' ? 'badge-safe' : 'badge-warning'}`}>
                        {proj.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {proj.id}
                      </span>
                    </div>

                    {isCurrent ? (
                      <span style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        background: 'rgba(79, 70, 229, 0.15)',
                        padding: '4px 10px',
                        borderRadius: 12,
                        border: '1px solid rgba(79, 70, 229, 0.3)'
                      }}>
                        <CheckCircle2 size={13} />
                        AKTIF DIPILIH
                      </span>
                    ) : (
                      <button
                        onClick={() => switchProject(proj.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                      >
                        Pilih Riset Ini
                      </button>
                    )}
                  </div>

                  {/* Project Title */}
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 6, lineHeight: 1.3 }}>
                    {proj.project_name}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Wilayah Analisis: <b style={{ color: '#fff' }}>{proj.province}</b>
                  </div>

                  {/* Target Progress Bar */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Ketercapaian Kuota</span>
                      <span style={{ fontWeight: 700, color: percent >= 100 ? '#34d399' : 'var(--primary-color)' }}>
                        {total} / {target} Responden ({percent}%)
                      </span>
                    </div>
                    <div style={{
                      height: 8,
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderRadius: 4,
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${percent}%`,
                        height: '100%',
                        background: percent >= 100 ? 'var(--status-safe)' : 'linear-gradient(90deg, #4f46e5 0%, #06b6d4 100%)',
                        borderRadius: 4,
                        transition: 'width 0.4s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* Quick Metrics */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 16
                  }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Enumerator Aktif</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{proj.active_enumerators || 0} Petugas</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Sekolah Terjangkau</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{proj.total_schools || 0} Sekolah</div>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                  gap: 8
                }}>
                  <button
                    onClick={() => handleToggleStatus(proj)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isClosed ? '#34d399' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Clock size={12} />
                    <span>{isClosed ? 'Buka Kembali' : 'Tutup Riset'}</span>
                  </button>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link
                      href="/admin/dashboard"
                      onClick={() => switchProject(proj.id)}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.78rem', padding: '5px 10px' }}
                    >
                      <span>Buka Dashboard</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Buat Penelitian Baru */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <div className="glass-card animate-scale-in" style={{
            maxWidth: 520,
            width: '100%',
            background: '#0f172a',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: 'rgba(79, 70, 229, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <FolderPlus size={20} color="#818cf8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Buat Proyek Riset Baru</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Daftarkan judul penelitian dan target sampel sekolah
                  </p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary btn-sm" style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 14px',
                marginBottom: 16,
                color: '#f87171',
                fontSize: '0.85rem'
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateProject}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                  Judul Proyek Penelitian *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Survei Respon Siswa terhadap Narasi Radikal Terorisme"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Wilayah / Provinsi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Jawa Timur, DKI Jakarta"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                    Target Kuota Responden *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="100000"
                    value={targetSample}
                    onChange={(e) => setTargetSample(e.target.value)}
                    className="input-field"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: 6 }}>
                  Status Awal Riset
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input-field"
                  style={{ width: '100%' }}
                >
                  <option value="ACTIVE">ACTIVE (Langsung aktif menerima kuesioner)</option>
                  <option value="DRAFT">DRAFT (Persiapan instrumen / enumerator)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={creating}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Menyimpan...' : 'Simpan & Jadikan Proyek Aktif'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
