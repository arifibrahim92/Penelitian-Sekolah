'use client';

import { useState, useEffect } from 'react';
import {
  Database, Search, Filter, Download, Upload, Eye, Trash2,
  CheckCircle2, AlertCircle, FileSpreadsheet, ChevronLeft, ChevronRight, X, FileText
} from 'lucide-react';
import { QUESTIONS, QUESTION_MAP } from '@/lib/instrument.js';
import { useActiveProject } from '@/lib/projectContext.js';

export default function SurveyResponsesPage() {
  const { projectId, activeProject } = useActiveProject();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1, limit: 15 });
  const [filterOptions, setFilterOptions] = useState({ schools: [], religions: [] });

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedMedia, setSelectedMedia] = useState('');

  // Modals
  const [detailModal, setDetailModal] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchResponses = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        projectId: projectId || 'PRJ-2026-JB-001',
        page: page.toString(),
        limit: '15'
      });
      if (search) params.append('search', search);
      if (selectedSchool) params.append('school', selectedSchool);
      if (selectedGender) params.append('gender', selectedGender);
      if (selectedDuration) params.append('duration', selectedDuration);
      if (selectedMedia) params.append('media', selectedMedia);

      const res = await fetch(`/api/survey/responses?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setResponses(data.responses);
        setPagination(data.pagination);
        if (data.filterOptions) {
          setFilterOptions(data.filterOptions);
        }
      }
    } catch (err) {
      console.error('Error fetching survey responses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses(1);
  }, [projectId, selectedSchool, selectedGender, selectedDuration, selectedMedia]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchResponses(1);
  };

  const handleDeleteResponse = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data responden ini?')) return;
    try {
      const res = await fetch(`/api/survey/responses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchResponses(pagination.page);
      }
    } catch (err) {
      console.error('Error deleting response:', err);
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    setErrorMessage('');
    setMessage('');

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('projectId', projectId || 'PRJ-2026-JB-001');

    try {
      const res = await fetch('/api/survey/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Gagal mengimpor file');
        setImporting(false);
        return;
      }

      setMessage(data.message || 'Impor data berhasil!');
      setShowImportModal(false);
      setImportFile(null);
      fetchResponses(1);
    } catch (err) {
      setErrorMessage('Terjadi kesalahan koneksi saat mengunggah');
    } finally {
      setImporting(false);
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
            Repositori Data Responden Kuesioner
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Eksplorasi data mentah, verifikasi butir jawaban Q1–Q24, dan unduh berkas jawaban per kuesioner.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setShowImportModal(true)} className="btn btn-secondary">
            <Upload size={16} />
            <span>Impor Excel (.xlsx)</span>
          </button>
          <a href="/api/export?format=csv_raw" download className="btn btn-secondary">
            <Download size={16} />
            <span>CSV Mentah</span>
          </a>
          <a href="/api/export?format=csv_scored" download className="btn btn-accent">
            <Download size={16} />
            <span>CSV Berskor</span>
          </a>
        </div>
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

      {/* Filter & Search Bar */}
      <div className="glass-card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          {/* Search Box */}
          <div style={{ position: 'relative', gridColumn: 'span 2' }}>
            <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa, sekolah, atau ID..."
              className="form-input"
              style={{ paddingLeft: 36, paddingRight: 10, height: 40 }}
            />
          </div>

          {/* School Filter */}
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="form-select"
            style={{ height: 40 }}
          >
            <option value="">Semua Sekolah</option>
            {filterOptions.schools.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="form-select"
            style={{ height: 40 }}
          >
            <option value="">Semua Gender</option>
            <option value="Perempuan">Perempuan</option>
            <option value="Laki-Laki">Laki-Laki</option>
          </select>

          {/* Duration Filter */}
          <select
            value={selectedDuration}
            onChange={(e) => setSelectedDuration(e.target.value)}
            className="form-select"
            style={{ height: 40 }}
          >
            <option value="">Semua Durasi Medsos</option>
            <option value="0-2 jam">0-2 jam</option>
            <option value="3-5 jam">3-5 jam</option>
            <option value="6-8 jam">6-8 jam</option>
            <option value=">8 jam">&gt;8 jam</option>
          </select>

          {/* Media Filter */}
          <select
            value={selectedMedia}
            onChange={(e) => setSelectedMedia(e.target.value)}
            className="form-select"
            style={{ height: 40 }}
          >
            <option value="">Semua Platform</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="X">X (Twitter)</option>
            <option value="Facebook">Facebook</option>
          </select>
        </form>
      </div>

      {/* Responses Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID Responden</th>
              <th>Nama &amp; Gender</th>
              <th>Asal Sekolah</th>
              <th>Durasi &amp; Medsos</th>
              <th>Topik Favorit</th>
              <th>Skor Mean (Inversi)</th>
              <th style={{ textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Memuat data kuesioner siswa...
                </td>
              </tr>
            ) : responses.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Tidak ada responden yang cocok dengan kriteria pencarian/filter.
                </td>
              </tr>
            ) : (
              responses.map(r => {
                const scoredVals = Object.values(r.scored_responses || {});
                const totalScore = scoredVals.reduce((acc, v) => acc + (typeof v === 'number' ? v : 0), 0);
                const meanScore = scoredVals.length > 0 ? (totalScore / scoredVals.length).toFixed(2) : '0';
                const contents = Array.isArray(r.favorite_content) ? r.favorite_content.join(', ') : '';

                return (
                  <tr key={r.id}>
                    <td>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: 'var(--accent)',
                        background: 'rgba(6, 182, 212, 0.1)',
                        padding: '3px 6px',
                        borderRadius: 4
                      }}>
                        {r.id.split('-').slice(-2).join('-') || r.id}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{r.student_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {r.gender} • Kelas {r.grade} • {r.religion}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {r.school_name}
                      </span>
                    </td>

                    <td>
                      <div style={{ color: '#38bdf8', fontWeight: 600 }}>{r.favorite_social_media}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.social_media_duration} / hari</div>
                    </td>

                    <td style={{ maxWidth: 220 }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {contents || '-'}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: Number(meanScore) >= 2.8 ? '#34d399' : '#fbbf24' }}>
                        {meanScore} <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ 4.00</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => setDetailModal(r)}
                          className="btn btn-secondary btn-sm"
                          title="Lihat Rincian Jawaban Q1–Q24"
                          style={{ padding: '4px 8px' }}
                        >
                          <Eye size={13} />
                          <span>Detail</span>
                        </button>
                        <a
                          href={`/api/survey/responses/download?id=${r.id}&format=json`}
                          className="btn btn-secondary btn-sm"
                          title="Unduh Berkas Jawaban Responden (Format JSON)"
                          style={{ padding: '4px 8px', color: '#38bdf8' }}
                          download
                        >
                          <Download size={13} />
                          <span>JSON</span>
                        </a>
                        <a
                          href={`/api/survey/responses/download?id=${r.id}&format=txt`}
                          className="btn btn-secondary btn-sm"
                          title="Unduh Lembar Transkrip Jawaban Resmi (Format Teks/Cetak)"
                          style={{ padding: '4px 8px', color: '#a5b4fc' }}
                          download
                        >
                          <FileText size={13} />
                          <span>TXT</span>
                        </a>
                        <button
                          onClick={() => handleDeleteResponse(r.id)}
                          className="btn btn-secondary btn-sm"
                          title="Hapus Data Responden Ini"
                          style={{ color: '#f87171', padding: '4px 8px' }}
                        >
                          <Trash2 size={13} />
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

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Menampilkan halaman <b>{pagination.page}</b> dari <b>{pagination.totalPages}</b> (Total {pagination.total} responden)
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => fetchResponses(pagination.page - 1)}
            className="btn btn-secondary btn-sm"
          >
            <ChevronLeft size={16} />
            <span>Sebelumnya</span>
          </button>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => fetchResponses(pagination.page + 1)}
            className="btn btn-secondary btn-sm"
          >
            <span>Selanjutnya</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* DETAIL MODAL (Rincian 24 Butir dan Skoring Inversi) */}
      {detailModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 840 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rincian Jawaban Responden</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ID: {detailModal.id} • {detailModal.student_name} ({detailModal.gender}) • {detailModal.school_name}
                </div>
              </div>
              <button onClick={() => setDetailModal(null)} className="btn btn-secondary btn-sm">
                <X size={16} />
              </button>
            </div>

            {/* Profile Bar */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '12px 16px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              marginBottom: 20,
              fontSize: '0.85rem'
            }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Agama:</span> <b>{detailModal.religion}</b></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Kelas:</span> <b>{detailModal.grade}</b></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Durasi Medsos:</span> <b>{detailModal.social_media_duration}</b></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Platform:</span> <b>{detailModal.favorite_social_media}</b></div>
            </div>

            {/* Questions List */}
            <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: 6 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {QUESTIONS.map(q => {
                  const rawAns = detailModal.raw_responses[q.code] || '-';
                  const score = detailModal.scored_responses[q.code] || 0;
                  const isFavorable = q.valence === 'FAVORABLE';

                  return (
                    <div key={q.code} style={{
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '12px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 14
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#fff' }}>{q.code}</span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: isFavorable ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: isFavorable ? '#34d399' : '#fbbf24'
                          }}>
                            {isFavorable ? 'Favorable (+)' : 'Unfavorable (-)'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                          {q.text}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>RESPONS</div>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '1rem',
                            color: '#fff',
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '4px 10px',
                            borderRadius: 6
                          }}>
                            {rawAns}
                          </span>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKOR (INVERSI)</div>
                          <span style={{
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            color: score >= 3 ? '#34d399' : '#f87171'
                          }}>
                            {score}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, flexWrap: 'wrap', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <a
                  href={`/api/survey/responses/download?id=${detailModal.id}&format=json`}
                  className="btn btn-primary btn-sm"
                  download
                >
                  <Download size={14} />
                  <span>Unduh Berkas Lengkap (.JSON)</span>
                </a>
                <a
                  href={`/api/survey/responses/download?id=${detailModal.id}&format=txt`}
                  className="btn btn-secondary btn-sm"
                  download
                >
                  <FileText size={14} />
                  <span>Unduh Lembar Transkrip (.TXT)</span>
                </a>
              </div>
              <button onClick={() => setDetailModal(null)} className="btn btn-secondary">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT MODAL (Upload File Excel) */}
      {showImportModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 520 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: 8 }}>
              Impor Berkas Survei Excel (.xlsx)
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
              Unggah file rekapan hasil survei responden berformat Excel sesuai format standar riset Jawa Barat (BNPT).
            </p>

            {errorMessage && (
              <div style={{
                background: 'var(--status-critical-bg)',
                border: '1px solid var(--status-critical-border)',
                color: '#fca5a5',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                marginBottom: 16
              }}>
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleImportSubmit}>
              <div style={{
                border: '2px dashed var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '30px 20px',
                textAlign: 'center',
                marginBottom: 20,
                background: 'rgba(255, 255, 255, 0.02)'
              }}>
                <FileSpreadsheet size={40} color="#06b6d4" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                  {importFile ? importFile.name : 'Pilih Berkas Excel (.xlsx)'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  Mendukung file seperti <i>Jawa Barat - Input Hasil Survey Respon Siswa.xlsx</i>
                </div>
                <input
                  type="file"
                  accept=".xlsx"
                  required
                  onChange={(e) => setImportFile(e.target.files[0])}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={importing || !importFile}
                  className="btn btn-accent"
                >
                  {importing ? 'Memproses Impor...' : 'Unggah & Ekstrak Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
