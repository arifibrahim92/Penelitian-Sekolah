/**
 * Generator Berkas Draft / Template Excel (.xlsx) untuk Input Data Kuesioner
 * Menghasilkan workbook Excel siap pakai yang dapat diunduh pengguna,
 * diisi secara manual, dan langsung diimpor ke sistem.
 */

import * as XLSX from 'xlsx';
import { QUESTIONS, DIMENSIONS, INDICATORS } from './instrument.js';

export function generateExcelSurveyTemplateBuffer() {
  const wb = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: Input Data Kuesioner
  // ==========================================
  const headers = [
    'RESPONDEN',
    'JENIS KELAMIN',
    'AGAMA',
    'KELAS',
    'SEKOLAH',
    'DURASI MEDSOS',
    'MEDSOS FAVORIT',
    'KONTEN FAVORIT',
    ...Array.from({ length: 24 }, (_, i) => `Q${i + 1}`)
  ];

  // 3 Baris contoh data realistis
  const sampleRows = [
    [
      'R1', 'Perempuan', 'Islam', 'X', 'SMK N 3 BANDUNG', '3-5 jam', 'TikTok', 'Musik, Komedi',
      'S', 'TS', 'S', 'S', 'S', 'S', 'SS', 'SS', 'SS', 'S', 'SS', 'SS', 'TS', 'SS', 'SS', 'TS', 'SS', 'S', 'TS', 'S', 'TS', 'SS', 'TS', 'S'
    ],
    [
      'R2', 'Laki-Laki', 'Islam', 'XI', 'SMA N 1 BANDUNG', '>8 jam', 'Instagram', 'Musik, Olahraga, Game',
      'SS', 'S', 'S', 'S', 'S', 'S', 'SS', 'SS', 'SS', 'S', 'SS', 'SS', 'TS', 'SS', 'SS', 'TS', 'SS', 'S', 'TS', 'S', 'TS', 'SS', 'TS', 'S'
    ],
    [
      'R3', 'Laki-Laki', 'Kristen Protestan', 'XII', 'SMA N 2 BANDUNG', '0-2 jam', 'YouTube', 'Pendidikan, Film',
      'S', 'TS', 'S', 'S', 'TS', 'S', 'S', 'S', 'S', 'S', 'S', 'S', 'TS', 'S', 'S', 'TS', 'S', 'S', 'TS', 'S', 'TS', 'S', 'TS', 'S'
    ]
  ];

  const wsInput = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Lebar kolom rapi
  wsInput['!cols'] = [
    { wch: 14 }, // RESPONDEN
    { wch: 16 }, // JENIS KELAMIN
    { wch: 18 }, // AGAMA
    { wch: 8 },  // KELAS
    { wch: 26 }, // SEKOLAH
    { wch: 16 }, // DURASI MEDSOS
    { wch: 18 }, // MEDSOS FAVORIT
    { wch: 28 }, // KONTEN FAVORIT
    ...Array.from({ length: 24 }, () => ({ wch: 6 })) // Q1-Q24
  ];

  // ==========================================
  // SHEET 2: Daftar 24 Butir Soal Kuesioner
  // ==========================================
  const itemHeaders = ['NO', 'KODE', 'PERNYATAAN BUTIR KUESIONER (BNPT RI)', 'DIMENSI SIKAP', 'INDIKATOR OPERASIONAL', 'VALENSI', 'OPSI JAWABAN'];
  const itemRows = QUESTIONS.map((q, idx) => [
    idx + 1,
    q.code,
    q.text,
    DIMENSIONS[q.dimensionId]?.title || '',
    INDICATORS[q.indicatorId]?.title || '',
    q.valence === 'FAVORABLE' ? 'Favorable (+)' : 'Unfavorable (-)',
    'SS / S / TS / STS'
  ]);

  const wsItems = XLSX.utils.aoa_to_sheet([itemHeaders, ...itemRows]);
  wsItems['!cols'] = [
    { wch: 5 },
    { wch: 8 },
    { wch: 72 },
    { wch: 26 },
    { wch: 26 },
    { wch: 16 },
    { wch: 18 }
  ];

  // ==========================================
  // SHEET 3: Panduan Pengisian
  // ==========================================
  const guideData = [
    ['PANDUAN PENGISIAN DRAFT KUESIONER EXCEL', ''],
    ['Badan Nasional Penanggulangan Terorisme (BNPT RI) - Instrumen Survei Respon Siswa', ''],
    ['', ''],
    ['1. CARA MENGISI DATA RESPONDEN (SHEET "Input Data Kuesioner"):', ''],
    ['   - Kolom RESPONDEN', 'Isi dengan kode siswa (misal: R1, R2, R3) atau nama lengkap siswa.'],
    ['   - Kolom JENIS KELAMIN', 'Pilih salah satu: "Laki-Laki" atau "Perempuan".'],
    ['   - Kolom AGAMA', 'Pilih: "Islam", "Kristen Protestan", "Kristen Katolik", "Hindu", "Buddha", atau "Konghucu".'],
    ['   - Kolom KELAS', 'Isi tingkat kelas siswa: "X", "XI", atau "XII".'],
    ['   - Kolom SEKOLAH', 'Isi nama asal sekolah (contoh: "SMK N 3 BANDUNG", "SMA N 1").'],
    ['   - Kolom DURASI MEDSOS', 'Pilih estimasi durasi: "0-2 jam", "3-5 jam", "6-8 jam", atau ">8 jam".'],
    ['   - Kolom MEDSOS FAVORIT', 'Pilih media sosial utama: "TikTok", "Instagram", "YouTube", "X", atau "Facebook".'],
    ['   - Kolom KONTEN FAVORIT', 'Tulis topik favorit dipisah koma (contoh: "Musik, Olahraga, Game, Pendidikan").'],
    ['', ''],
    ['2. CARA MENGISI JAWABAN BUTIR SOAL Q1 s/d Q24:', ''],
    ['   Isi setiap kolom Q1 sampai Q24 dengan salah satu kode skala Likert berikut (Huruf Kapital):', ''],
    ['   - SS', 'SANGAT SETUJU'],
    ['   - S', 'SETUJU'],
    ['   - TS', 'TIDAK SETUJU'],
    ['   - STS', 'SANGAT TIDAK SETUJU'],
    ['   *(Catatan: Pengisian dengan angka 1=SS, 2=S, 3=TS, 4=STS juga didukung secara otomatis oleh sistem)*', ''],
    ['', ''],
    ['3. CARA MENGINPUT KE APLIKASI:', ''],
    ['   - Buka menu "Data Responden" pada sistem aplikasi survei.', ''],
    ['   - Klik tombol "Impor Excel (.xlsx)".', ''],
    ['   - Pilih berkas Excel yang sudah Anda isi ini, lalu klik "Unggah & Ekstrak Data".', ''],
    ['   - Seluruh data responden dan hasil penilaian skor psikometri inversi otomatis masuk ke database.', '']
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 32 },
    { wch: 75 }
  ];

  // Susun sheets
  XLSX.utils.book_append_sheet(wb, wsInput, 'Input Data Kuesioner');
  XLSX.utils.book_append_sheet(wb, wsItems, 'Daftar 24 Butir Soal');
  XLSX.utils.book_append_sheet(wb, wsGuide, 'Petunjuk Pengisian');

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}
