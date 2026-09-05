'use client';

import { useState, useEffect } from 'react';
import {
  Users, KeyRound, Lock, Unlock, Copy, Check, PlusCircle,
  RefreshCw, Trash2, ExternalLink, School, Phone, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useActiveProject } from '@/lib/projectContext.js';

export default function EnumeratorsManagementPage() {
  const { projectId, activeProject } = useActiveProject();
  const [enumerators, setEnumerators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedPin, setCopiedPin] = useState(null);
  const [copiedLink, setCopiedLink] = useState(null);

  // Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [assignedSchool, setAssignedSchool] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchEnumerators = async () => {
    try {
      const targetId = projectId || 'PRJ-2026-JB-001';
      const res = await fetch(`/api/enumerators?projectId=${targetId}`);
      const data = await res.json();
      if (data.success) {
        setEnumerators(data.enumerators);
      }
    } catch (err) {
      console.error('Error fetching enumerators:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnumerators();
  }, [projectId]);

  const handleAddEnumerator = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/enumerators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId || 'PRJ-2026-JB-001',
          fullName,
          phoneNumber,
          assignedSchool,
          customPin: customPin || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal menambahkan enumerator');
        setActionLoading(false);
        return;
      }

      setMessage(`Enumerator ${data.enumerator.full_name} berhasil didaftarkan dengan PIN: ${data.enumerator.pin_raw}`);
      setShowAddModal(false);
      setFullName('');
      setPhoneNumber('');
      setAssignedSchool('');
      setCustomPin('');
      fetchEnumerators();
    } catch (err) {
      setErrorMessage('Terjadi kesalahan jaringan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (enumItem) => {
    const newStatus = enumItem.status === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      const res = await fetch('/api/enumerators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: enumItem.id,
          status: newStatus
        })
      });
      if (res.ok) {
        fetchEnumerators();
      }
    } catch (err) {
      console.error('Error toggling status:', err);
    }
  };

  const handleRegeneratePin = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menerbitkan PIN baru untuk enumerator ini? PIN lama tidak akan berlaku lagi.')) {
      return;
    }
    try {
      const res = await fetch('/api/enumerators', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, regeneratePin: true })
      });
      if (res.ok) {
        fetchEnumerators();
      }
    } catch (err) {
      console.error('Error regenerating PIN:', err);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Hapus enumerator "${name}"? Seluruh kuesioner yang telah diinput tetap tersimpan di database.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/enumerators?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchEnumerators();
      }
    } catch (err) {
      console.error('Error deleting enumerator:', err);
    }
  };

  const copyToClipboard = (text, type, id) => {
    navigator.clipboard.writeText(text);
    if (type === 'pin') {
      setCopiedPin(id);
      setTimeout(() => setCopiedPin(null), 2000);
    } else {
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

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
            Manajemen Enumerator &amp; PIN Lapangan
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Daftarkan petugas survei, buat PIN 6-digit unik, dan kontrol status akses aktif/kunci per sekolah.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <PlusCircle size={18} />
          <span>Daftarkan Surveyor Baru</span>
        </button>
      </div>

      {message && (
        <div style={{
          background: 'var(--status-safe-bg)',
          border: '1px solid var(--status-safe-border)',
          color: '#34d399',
          padding: '14px 18px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      {/* Info Card PRD */}
      <div className="glass-card" style={{ marginBottom: 24, padding: '18px 22px', background: 'rgba(79, 70, 229, 0.08)', border: '1px solid rgba(79, 70, 229, 0.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <KeyRound size={22} color="#818cf8" style={{ flexShrink: 0 }} />
          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <b style={{ color: '#fff' }}>Prinsip Akses Lapangan Terisolasi:</b> Surveyor hanya memerlukan tautan web dan <b>PIN 6-Digit</b> unik tanpa login kata sandi. Jika kuota target responden di sekolah tersebut telah terpenuhi, Admin dapat langsung menekan tombol <b>Kunci (Revoke) PIN</b> agar tidak ada input berlebih.
          </div>
        </div>
      </div>

      {/* Table of Enumerators */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Enumerator</th>
              <th>Sekolah Penugasan</th>
              <th>Kode PIN (6-Digit)</th>
              <th>Status Akses</th>
              <th>Submisi Responden</th>
              <th style={{ textAlign: 'right' }}>Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Memuat daftar enumerator...
                </td>
              </tr>
            ) : enumerators.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Belum ada enumerator terdaftar. Klik "Daftarkan Surveyor Baru" di atas.
                </td>
              </tr>
            ) : (
              enumerators.map(enumItem => {
                const isActive = enumItem.status === 'ACTIVE';
                const surveyUrl = typeof window !== 'undefined'
                  ? `${window.location.origin}/survey/login?pin=${enumItem.pin_raw}`
                  : `/survey/login?pin=${enumItem.pin_raw}`;

                return (
                  <tr key={enumItem.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
                        {enumItem.full_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Phone size={12} />
                        <span>{enumItem.phone_number || 'Tidak ada nomor HP'}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                        <School size={14} color="#06b6d4" />
                        <span style={{ fontWeight: 600 }}>{enumItem.assigned_school || 'Semua Sekolah'}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontFamily: 'monospace',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          letterSpacing: '0.15em',
                          color: isActive ? '#06b6d4' : 'var(--text-muted)',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {enumItem.pin_raw}
                        </span>
                        <button
                          onClick={() => copyToClipboard(enumItem.pin_raw, 'pin', enumItem.id)}
                          title="Salin PIN"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                        >
                          {copiedPin === enumItem.id ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>

                    <td>
                      {isActive ? (
                        <span className="badge badge-safe">
                          <CheckCircle2 size={12} /> AKTIF
                        </span>
                      ) : (
                        <span className="badge badge-critical">
                          <Lock size={12} /> DIKUNCI / REVOKED
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                        {enumItem.total_submissions} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>siswa</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#34d399' }}>
                        +{enumItem.today_submissions || 0} hari ini
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {/* Copy Direct Link */}
                        <button
                          onClick={() => copyToClipboard(surveyUrl, 'link', enumItem.id)}
                          title="Salin Tautan Kuesioner dengan PIN"
                          className="btn btn-secondary btn-sm"
                        >
                          {copiedLink === enumItem.id ? (
                            <>
                              <Check size={14} color="#10b981" />
                              <span style={{ fontSize: '0.78rem', color: '#10b981' }}>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink size={14} />
                              <span style={{ fontSize: '0.78rem' }}>Link PIN</span>
                            </>
                          )}
                        </button>

                        {/* Lock / Unlock Status Toggle */}
                        <button
                          onClick={() => handleToggleStatus(enumItem)}
                          title={isActive ? 'Kunci / Cabut Akses PIN' : 'Buka Kunci PIN'}
                          className={`btn btn-sm ${isActive ? 'btn-danger' : 'btn-primary'}`}
                        >
                          {isActive ? <Lock size={14} /> : <Unlock size={14} />}
                          <span>{isActive ? 'Kunci' : 'Aktifkan'}</span>
                        </button>

                        {/* Regenerate PIN */}
                        <button
                          onClick={() => handleRegeneratePin(enumItem.id)}
                          title="Ganti PIN Acak Baru"
                          className="btn btn-secondary btn-sm"
                        >
                          <RefreshCw size={14} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(enumItem.id, enumItem.full_name)}
                          title="Hapus Surveyor"
                          className="btn btn-secondary btn-sm"
                          style={{ color: '#f87171' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Tambah Enumerator Baru */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.4rem', marginBottom: 6, fontWeight: 800 }}>
              Daftarkan Enumerator Lapangan Baru
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Sistem akan otomatis menerbitkan PIN 6-digit acak yang aman untuk surveyor ini.
            </p>

            {errorMessage && (
              <div style={{
                background: 'var(--status-critical-bg)',
                border: '1px solid var(--status-critical-border)',
                color: '#fca5a5',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10
              }}>
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddEnumerator}>
              <div className="form-group">
                <label className="form-label">Nama Lengkap Surveyor *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Misal: Budi Santoso, S.Pd"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor Kontak WhatsApp / HP</label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Misal: 081234567890"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Sekolah Penugasan Lapangan</label>
                <input
                  type="text"
                  value={assignedSchool}
                  onChange={(e) => setAssignedSchool(e.target.value)}
                  placeholder="Misal: SMA N 1 BANDUNG"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kustom Kode PIN (Opsional, kosongkan untuk acak otomatis)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={customPin}
                  onChange={(e) => setCustomPin(e.target.value)}
                  placeholder="6 digit angka (misal: 482910)"
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn btn-primary"
                >
                  {actionLoading ? 'Mendaftarkan...' : 'Simpan & Terbitkan PIN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
