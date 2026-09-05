'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QUESTIONS, LIKERT_OPTIONS, DIMENSIONS } from '@/lib/instrument.js';
import { CheckCircle2, AlertCircle, Sparkles, PlusCircle, ArrowLeft, Send, User, Smartphone, ListChecks, FileText, Download } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FieldSurveyForm() {
  const router = useRouter();
  const [enumerator, setEnumerator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [submissionStats, setSubmissionStats] = useState({ today: 0, total: 0 });

  // Form State
  const [studentName, setStudentName] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [gender, setGender] = useState('Perempuan');
  const [religion, setReligion] = useState('Islam');
  const [grade, setGrade] = useState('X');
  const [schoolName, setSchoolName] = useState('');
  const [duration, setDuration] = useState('3-5 jam');
  const [favoriteMedia, setFavoriteMedia] = useState('TikTok');
  const [favoriteContent, setFavoriteContent] = useState(['Musik', 'Komedi']);
  const [responses, setResponses] = useState({});

  useEffect(() => {
    // Cek cookie surveyor_session
    const cookies = document.cookie;
    const surveyorCookie = cookies.split('; ').find(row => row.startsWith('surveyor_session='));
    if (!surveyorCookie) {
      router.push('/survey/login');
      return;
    }

    try {
      const session = JSON.parse(decodeURIComponent(surveyorCookie.split('=')[1]));
      // Fetch data enumerator terkini
      fetch(`/api/auth/pin-verify?pin=${session.pin}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setEnumerator(data.enumerator);
            setSchoolName(data.enumerator.assignedSchool || 'SMK N 3 BANDUNG');
          } else {
            router.push('/survey/login');
          }
        })
        .catch(() => router.push('/survey/login'))
        .finally(() => setLoading(false));
    } catch {
      router.push('/survey/login');
    }
  }, [router]);

  const handleLikertSelect = (qCode, val) => {
    setResponses(prev => ({
      ...prev,
      [qCode]: val
    }));
  };

  const toggleContentTopic = (topic) => {
    setFavoriteContent(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  const answeredCount = Object.keys(responses).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin: enumerator.pinRaw || enumerator.pin,
          enumeratorId: enumerator.id,
          studentName: isAnonymous ? 'Anonim' : (studentName || 'Anonim'),
          gender,
          religion,
          grade,
          schoolName: schoolName.trim(),
          socialMediaDuration: duration,
          favoriteSocialMedia: favoriteMedia,
          favoriteContent,
          rawResponses: responses
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Gagal menyimpan respons survei');
        setSubmitting(false);
        return;
      }

      // Sukses!
      setSubmissionStats({
        today: data.todaySubmissions,
        total: data.totalSubmissions
      });
      setShowSuccessModal(true);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {}

    } catch (err) {
      setSubmitError('Terjadi kesalahan koneksi saat mengirim formulir');
    } finally {
      setSubmitting(false);
    }
  };

  const resetFormForNextStudent = () => {
    setStudentName('');
    setIsAnonymous(true);
    setGender('Perempuan');
    setReligion('Islam');
    setGrade('X');
    setResponses({});
    setShowSuccessModal(false);
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        Memuat instrumen survei lapangan...
      </div>
    );
  }

  const contentTopics = [
    'Musik', 'Game', 'Komedi', 'Agama', 'Olahraga', 'Politik',
    'Kuliner / Shopping', 'Edukasi', 'Film / Series', 'Selebriti'
  ];

  return (
    <div className="animate-fade-in" style={{ maxWidth: 860, margin: '0 auto', paddingBottom: 80 }}>
      {/* Top Surveyor Bar */}
      <div className="glass-card" style={{
        marginBottom: 24,
        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase' }}>
            Surveyor Lapangan Terverifikasi
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
            {enumerator?.fullName}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Penugasan: <b>{enumerator?.assignedSchool || schoolName}</b>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link
            href="/survey/draft"
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', background: 'rgba(255, 255, 255, 0.08)' }}
            title="Lihat atau cetak lembar kuesioner fisik / unduh berkas Word"
          >
            <FileText size={15} color="#06b6d4" />
            <span>Unduh / Cetak Draft Kuesioner</span>
          </Link>

          <div style={{
            display: 'flex',
            gap: 16,
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SUBMISI HARI INI</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                {submissionStats.today || enumerator?.todaySubmissions || 0}
              </div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 16 }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TOTAL PRIBADI</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8' }}>
                {submissionStats.total || enumerator?.totalSubmissions || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* BAGIAN 1: PROFIL SISWA */}
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <User size={20} color="var(--primary)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Bagian 1: Data Profil Responden Siswa</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            {/* Nama Siswa */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>Nama Siswa</label>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                  />
                  <span>Anonimkan (Rahasia)</span>
                </label>
              </div>
              <input
                type="text"
                disabled={isAnonymous}
                placeholder={isAnonymous ? 'Nama Dirahasiakan (Anonim)' : 'Ketik nama lengkap siswa...'}
                value={isAnonymous ? '' : studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Asal Sekolah */}
            <div className="form-group">
              <label className="form-label">Nama Sekolah Satuan Pendidikan</label>
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="form-input"
                placeholder="Misal: SMK N 3 BANDUNG"
              />
            </div>

            {/* Jenis Kelamin */}
            <div className="form-group">
              <label className="form-label">Jenis Kelamin</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['Perempuan', 'Laki-Laki'].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`btn ${gender === g ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Kelas */}
            <div className="form-group">
              <label className="form-label">Tingkat Kelas</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['X', 'XI', 'XII'].map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setGrade(k)}
                    className={`btn ${grade === k ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '10px' }}
                  >
                    Kelas {k}
                  </button>
                ))}
              </div>
            </div>

            {/* Agama */}
            <div className="form-group">
              <label className="form-label">Agama / Keyakinan</label>
              <select
                value={religion}
                onChange={(e) => setReligion(e.target.value)}
                className="form-select"
              >
                <option value="Islam">Islam</option>
                <option value="Kristen Protestan">Kristen Protestan</option>
                <option value="Kristen Katolik">Kristen Katolik</option>
                <option value="Hindu">Hindu</option>
                <option value="Buddha">Buddha</option>
                <option value="Khonghucu">Khonghucu</option>
                <option value="Lainnya">Penghayat Kepercayaan / Lainnya</option>
              </select>
            </div>
          </div>
        </div>

        {/* BAGIAN 2: PERILAKU MEDIA SOSIAL */}
        <div className="glass-card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            <Smartphone size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Bagian 2: Perilaku &amp; Konsumsi Media Sosial</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {/* Durasi Bermedia Sosial */}
            <div className="form-group">
              <label className="form-label">Rata-rata Durasi Bermedia Sosial per Hari</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['0-2 jam', '3-5 jam', '6-8 jam', '>8 jam'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={`btn ${duration === d ? 'btn-accent' : 'btn-secondary'}`}
                    style={{ padding: '10px 8px', fontSize: '0.88rem' }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Sosial Paling Sering Digunakan */}
            <div className="form-group">
              <label className="form-label">Platform Media Sosial Utama (Paling Sering)</label>
              <select
                value={favoriteMedia}
                onChange={(e) => setFavoriteMedia(e.target.value)}
                className="form-select"
              >
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="YouTube">YouTube</option>
                <option value="X">X (Twitter)</option>
                <option value="Facebook">Facebook</option>
                <option value="Threads">Threads</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>

          {/* Topik Konten Favorit */}
          <div className="form-group" style={{ marginTop: 8 }}>
            <label className="form-label">Kategori Konten yang Sering Diakses (Pilih Satu atau Lebih)</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {contentTopics.map(topic => {
                const selected = favoriteContent.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleContentTopic(topic)}
                    className={`btn btn-sm ${selected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      borderRadius: 20,
                      padding: '6px 14px',
                      fontSize: '0.84rem'
                    }}
                  >
                    {selected ? '✓ ' : '+ '}
                    {topic}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* BAGIAN 3: 24 BUTIR INSTRUMEN LIKERT (Q1 - Q24) */}
        <div className="glass-card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Bagian 3: Instrumen Kuesioner Sikap (24 Butir)</h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Bacalah setiap pernyataan dan pilih respon yang paling menggambarkan sikap siswa sebenarnya.
              </p>
            </div>
            <span className="badge badge-primary">
              Skala Likert 4 Tingkat
            </span>
          </div>

          {/* List of 24 Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {QUESTIONS.map((q, idx) => {
              const currentVal = responses[q.code];
              const isFilled = Boolean(currentVal);

              return (
                <div
                  key={q.code}
                  id={`item-${q.code}`}
                  style={{
                    background: isFilled ? 'rgba(15, 23, 42, 0.6)' : 'rgba(239, 68, 68, 0.04)',
                    border: isFilled ? '1px solid var(--border-subtle)' : '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                    <span style={{
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      background: isFilled ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.1)',
                      color: isFilled ? '#a5b4fc' : 'var(--text-muted)',
                      padding: '4px 10px',
                      borderRadius: 6,
                      flexShrink: 0
                    }}>
                      {q.code}
                    </span>
                    <div style={{ fontSize: '0.98rem', fontWeight: 500, lineHeight: 1.5, color: '#fff' }}>
                      {q.text}
                    </div>
                  </div>

                  {/* 4 Likert Choices */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: 8
                  }}>
                    {LIKERT_OPTIONS.map(opt => {
                      const isSelected = currentVal === opt.value;
                      let activeStyle = {};
                      if (isSelected) {
                        if (opt.value === 'SS') activeStyle = { background: 'var(--likert-ss)', color: '#fff', borderColor: 'var(--likert-ss)' };
                        if (opt.value === 'S') activeStyle = { background: 'var(--likert-s)', color: '#fff', borderColor: 'var(--likert-s)' };
                        if (opt.value === 'TS') activeStyle = { background: 'var(--likert-ts)', color: '#000', borderColor: 'var(--likert-ts)' };
                        if (opt.value === 'STS') activeStyle = { background: 'var(--likert-sts)', color: '#fff', borderColor: 'var(--likert-sts)' };
                      }

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleLikertSelect(q.code, opt.value)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-subtle)',
                            background: 'rgba(255, 255, 255, 0.04)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.88rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 2,
                            transition: 'all 0.15s ease',
                            ...activeStyle
                          }}
                        >
                          <span style={{ fontSize: '1rem', fontWeight: 800 }}>{opt.value}</span>
                          <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {submitError && (
          <div style={{
            background: 'var(--status-critical-bg)',
            border: '1px solid var(--status-critical-border)',
            color: '#fca5a5',
            padding: '16px 20px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.9rem',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Submit Action */}
        <div style={{ textAlign: 'center' }}>
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-accent btn-lg"
            style={{ minWidth: 320, padding: '16px 36px', fontSize: '1.1rem' }}
          >
            {submitting ? (
              <span>Menyimpan Respons Survei...</span>
            ) : (
              <>
                <Send size={20} />
                <span>Submit Respons Siswa</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* MODAL SUKSES & INPUT RESPONDEN BARU */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: 'center', maxWidth: 500 }}>
            <div style={{
              width: 70,
              height: 70,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 size={38} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '1.6rem', marginBottom: 8, fontWeight: 800 }}>
              Respons Berhasil Disimpan!
            </h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Data kuesioner siswa telah berhasil diinjeksi ke database riset dan bobot psikometri telah dihitung otomatis.
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '14px 20px',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 28,
              display: 'flex',
              justifyContent: 'space-around'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUBMISI HARI INI</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
                  {submissionStats.today} Siswa
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: 20 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TOTAL KESELURUHAN</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
                  {submissionStats.total} Siswa
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={resetFormForNextStudent}
                className="btn btn-accent btn-lg"
                style={{ width: '100%' }}
              >
                <PlusCircle size={20} />
                <span>Input Responden Baru</span>
              </button>

              <button
                onClick={() => router.push('/')}
                className="btn btn-secondary"
                style={{ width: '100%' }}
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
