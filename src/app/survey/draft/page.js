'use client';

import Link from 'next/link';
import { QUESTIONS, DIMENSIONS, INDICATORS } from '@/lib/instrument.js';
import { Printer, Download, FileText, ArrowLeft, Shield, FileSpreadsheet, CheckSquare } from 'lucide-react';

export default function QuestionnaireDraftPrintPage() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      {/* Top Action Bar (Hidden when printed) */}
      <div className="no-print" style={{
        maxWidth: 900,
        margin: '0 auto 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        background: 'rgba(15, 23, 42, 0.85)',
        padding: '14px 20px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link href="/survey" className="btn btn-secondary btn-sm">
            <ArrowLeft size={14} />
            <span>Kembali ke Formulir Online</span>
          </Link>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Draft Instrumen Kuesioner (Siap Cetak / Kertas Fisik)
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <a
            href="/api/instrument/download?format=docx"
            download
            className="btn btn-primary btn-sm"
            style={{ background: '#2563eb' }}
          >
            <Download size={14} />
            <span>Unduh Berkas Word (.docx)</span>
          </a>
          <a
            href="/api/instrument/download?format=txt"
            download
            className="btn btn-secondary btn-sm"
          >
            <FileText size={14} />
            <span>Unduh Teks (.txt)</span>
          </a>
          <button onClick={handlePrint} className="btn btn-accent btn-sm">
            <Printer size={14} />
            <span>Cetak Lembar Kuesioner (PDF)</span>
          </button>
        </div>
      </div>

      {/* The Printable Document Sheet */}
      <div style={{
        maxWidth: 860,
        margin: '0 auto',
        background: '#ffffff',
        color: '#111827',
        padding: '40px 50px',
        borderRadius: 8,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        lineHeight: 1.5
      }}>
        {/* Kop Resmi BNPT RI */}
        <div style={{ textAlign: 'center', borderBottom: '3px double #111827', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1e3a8a' }}>
            BADAN NASIONAL PENANGGULANGAN TERORISME REPUBLIK INDONESIA (BNPT RI)
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em', color: '#4b5563', marginTop: 2 }}>
            PUSAT MEDIA DAMAI (PMD) — SURVEI SEKOLAH DAMAI
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', marginTop: 10, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
            KUESIONER RESPON SISWA TERHADAP KONTEN DI MEDIA SOSIAL
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>
            Instrumen Pengukuran Opini dan Ketahanan Ideologi Siswa Sekolah Menengah Tingkat Atas
          </div>
        </div>

        {/* Bagian I: Data Profil Siswa */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', background: '#f3f4f6', padding: '6px 12px', borderLeft: '4px solid #1e3a8a', marginBottom: 12 }}>
            I. DATA PROFIL RESPONDEN SISWA
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <tbody>
              <tr>
                <td style={{ width: '28%', padding: '6px 4px', fontWeight: 600 }}>Nama Siswa</td>
                <td style={{ width: '2%' }}>:</td>
                <td style={{ borderBottom: '1px dotted #9ca3af', padding: '6px 4px' }}></td>
              </tr>
              <tr>
                <td style={{ padding: '6px 4px', fontWeight: 600 }}>Jenis Kelamin</td>
                <td>:</td>
                <td style={{ padding: '6px 4px' }}>
                  [ &nbsp; ] Laki-Laki &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Perempuan
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 4px', fontWeight: 600 }}>Agama / Kepercayaan</td>
                <td>:</td>
                <td style={{ borderBottom: '1px dotted #9ca3af', padding: '6px 4px' }}></td>
              </tr>
              <tr>
                <td style={{ padding: '6px 4px', fontWeight: 600 }}>Kelas</td>
                <td>:</td>
                <td style={{ padding: '6px 4px' }}>
                  [ &nbsp; ] X &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] XI &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] XII
                </td>
              </tr>
              <tr>
                <td style={{ padding: '6px 4px', fontWeight: 600 }}>Asal Satuan Pendidikan</td>
                <td>:</td>
                <td style={{ borderBottom: '1px dotted #9ca3af', padding: '6px 4px' }}></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bagian II: Perilaku Bermedia Sosial */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', background: '#f3f4f6', padding: '6px 12px', borderLeft: '4px solid #1e3a8a', marginBottom: 12 }}>
            II. PERILAKU BERMEDIA SOSIAL
          </div>
          <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <span style={{ fontWeight: 600 }}>1. Durasi bermedia sosial dalam sehari (Pilih satu):</span>
              <div style={{ marginTop: 4, paddingLeft: 12 }}>
                [ &nbsp; ] 0–2 jam/hari &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] 3–5 jam/hari &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] 6–8 jam/hari &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] &gt;8 jam/hari
              </div>
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>2. Media sosial yang paling sering Anda gunakan (Pilih satu):</span>
              <div style={{ marginTop: 4, paddingLeft: 12 }}>
                [ &nbsp; ] Instagram &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] TikTok &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] YouTube &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] X (Twitter) &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Facebook &nbsp;&nbsp;&nbsp;&nbsp; [ &nbsp; ] Lainnya
              </div>
            </div>
            <div>
              <span style={{ fontWeight: 600 }}>3. Kategori konten yang paling sering diakses (Boleh pilih lebih dari satu):</span>
              <div style={{ marginTop: 4, paddingLeft: 12 }}>
                [ &nbsp; ] Musik &nbsp;&nbsp;&nbsp; [ &nbsp; ] Game &nbsp;&nbsp;&nbsp; [ &nbsp; ] Komedi &nbsp;&nbsp;&nbsp; [ &nbsp; ] Agama &nbsp;&nbsp;&nbsp; [ &nbsp; ] Olahraga &nbsp;&nbsp;&nbsp; [ &nbsp; ] Politik/Berita &nbsp;&nbsp;&nbsp; [ &nbsp; ] Lainnya
              </div>
            </div>
          </div>
        </div>

        {/* Petunjuk Pengisian */}
        <div style={{ marginBottom: 20, background: '#f9fafb', border: '1px solid #e5e7eb', padding: '12px 16px', borderRadius: 6 }}>
          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1f2937', marginBottom: 4 }}>
            PETUNJUK PENGISIAN KUESIONER:
          </div>
          <p style={{ fontSize: '0.82rem', color: '#4b5563', margin: '0 0 6px' }}>
            Bacalah setiap butir pernyataan di bawah ini dengan seksama. Berikan tanda centang <b>(✓)</b> pada salah satu kolom pilihan yang paling menggambarkan diri Anda:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: '0.78rem', textAlign: 'center', fontWeight: 700 }}>
            <span style={{ background: '#e0f2fe', padding: '4px 6px', borderRadius: 4, color: '#0369a1' }}>SS: Sangat Setuju</span>
            <span style={{ background: '#dbeafe', padding: '4px 6px', borderRadius: 4, color: '#1d4ed8' }}>S: Setuju</span>
            <span style={{ background: '#fef3c7', padding: '4px 6px', borderRadius: 4, color: '#b45309' }}>TS: Tidak Setuju</span>
            <span style={{ background: '#fee2e2', padding: '4px 6px', borderRadius: 4, color: '#b91c1c' }}>STS: Sangat Tidak Setuju</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 6, fontStyle: 'italic' }}>
            * Tidak ada jawaban benar atau salah. Seluruh data dan identitas responden dijamin kerahasiaannya oleh BNPT RI.
          </div>
        </div>

        {/* Tabel 24 Butir Pernyataan */}
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.82rem',
          marginBottom: 24
        }}>
          <thead>
            <tr style={{ background: '#1e3a8a', color: '#ffffff', textAlign: 'center' }}>
              <th style={{ width: '6%', padding: '10px 6px', border: '1px solid #1e3a8a' }}>No.</th>
              <th style={{ padding: '10px 10px', border: '1px solid #1e3a8a', textAlign: 'left' }}>Butir Pernyataan Sikap Siswa</th>
              <th style={{ width: '8%', padding: '10px 4px', border: '1px solid #1e3a8a' }}>SS</th>
              <th style={{ width: '8%', padding: '10px 4px', border: '1px solid #1e3a8a' }}>S</th>
              <th style={{ width: '8%', padding: '10px 4px', border: '1px solid #1e3a8a' }}>TS</th>
              <th style={{ width: '8%', padding: '10px 4px', border: '1px solid #1e3a8a' }}>STS</th>
            </tr>
          </thead>
          <tbody>
            {QUESTIONS.map((q, idx) => (
              <tr key={q.code} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                <td style={{
                  padding: '8px 6px',
                  border: '1px solid #d1d5db',
                  textAlign: 'center',
                  fontWeight: 700
                }}>
                  {idx + 1}
                </td>
                <td style={{
                  padding: '8px 10px',
                  border: '1px solid #d1d5db',
                  lineHeight: 1.4
                }}>
                  {q.text}
                </td>
                <td style={{ padding: '8px 4px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #4b5563', borderRadius: 2 }}></span>
                </td>
                <td style={{ padding: '8px 4px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #4b5563', borderRadius: 2 }}></span>
                </td>
                <td style={{ padding: '8px 4px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #4b5563', borderRadius: 2 }}></span>
                </td>
                <td style={{ padding: '8px 4px', border: '1px solid #d1d5db', textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: 14, height: 14, border: '1px solid #4b5563', borderRadius: 2 }}></span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer Lembar Cetak */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30, fontSize: '0.8rem', color: '#4b5563' }}>
          <div>
            <div>Tanggal Pengisian : ............................................. 2026</div>
            <div style={{ marginTop: 6 }}>Tanda Tangan Siswa : .............................................</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 700 }}>Petugas Enumerator / Surveyor:</div>
            <div style={{ marginTop: 40, borderTop: '1px solid #4b5563', display: 'inline-block', minWidth: 180, textAlign: 'center' }}>
              ( Nama Jelas &amp; Tanda Tangan )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
