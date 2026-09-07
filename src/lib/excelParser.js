/**
 * Parser Kuesioner Excel (.xlsx, .xls) & CSV
 * Mendukung format instrumen riset BNPT (multi-tier header) dan format tabel standar (single header).
 * Murni JavaScript menggunakan library 'xlsx' (tanpa ketergantungan unzip CLI).
 */

import * as XLSX from 'xlsx';
import fs from 'fs';

/**
 * Parsing workbook SheetJS menjadi array data responden
 */
export function parseSurveyWorkbook(wb) {
  if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('Berkas Excel tidak memiliki sheet yang dapat dibaca.');
  }

  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    throw new Error('Lembar kerja Excel kosong.');
  }

  // 1. Cari baris yang memuat butir soal Q1 s/d Q24
  let qRowIdx = -1;
  let qColMap = {};

  for (let r = 0; r < Math.min(30, rows.length); r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    const map = {};
    for (let c = 0; c < row.length; c++) {
      const val = String(row[c] || '').trim().toUpperCase();
      const match = val.match(/^Q([1-9]|1[0-9]|2[0-4])$/);
      if (match) {
        const qNum = parseInt(match[1], 10);
        // Ambil kemunculan pertama (respons mentah sebelum kolom skor)
        if (map[qNum] === undefined) {
          map[qNum] = c;
        }
      }
    }
    // Jika menemukan minimal Q1, Q2, dan Q24 pada baris ini
    if (map[1] !== undefined && map[2] !== undefined && map[24] !== undefined) {
      qRowIdx = r;
      qColMap = map;
      break;
    }
  }

  if (qRowIdx === -1) {
    throw new Error(
      'Format instrumen tidak cocok: Kolom kuesioner Q1 s/d Q24 tidak ditemukan. Pastikan berkas Excel memuat kolom Q1 sampai Q24.'
    );
  }

  // 2. Pemetaan kolom profil siswa
  const colMap = {
    respondent: -1,
    gender: -1,
    religion: -1,
    grade: -1,
    school: -1,
    duration: -1,
    media: -1,
    content: -1
  };

  // Pindai baris header (dari 2 baris di atas qRowIdx hingga qRowIdx)
  const startHeader = Math.max(0, qRowIdx - 2);
  for (let r = startHeader; r <= qRowIdx; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c++) {
      const txt = String(row[c] || '').trim().toLowerCase();
      // Abaikan teks judul banner panjang
      if (!txt || txt.length > 50) continue;

      if (colMap.respondent === -1 && !txt.includes('jawaban') && !txt.includes('skor') && /(responden|nama|student|siswa)/i.test(txt)) {
        colMap.respondent = c;
      } else if (colMap.gender === -1 && /^(jenis kelamin|gender|jk|j\.k)$/i.test(txt)) {
        colMap.gender = c;
      } else if (colMap.religion === -1 && /^(agama|religion)$/i.test(txt)) {
        colMap.religion = c;
      } else if (colMap.grade === -1 && /^(kelas|grade|tingkat)$/i.test(txt)) {
        colMap.grade = c;
      } else if (colMap.school === -1 && /^(sekolah|nama sekolah|school|asal sekolah)$/i.test(txt)) {
        colMap.school = c;
      } else if (colMap.duration === -1 && /(durasi|lama medsos|waktu medsos)/i.test(txt)) {
        colMap.duration = c;
      } else if (colMap.media === -1 && /(medsos favorit|media sosial favorit|platform favorit|medsos)/i.test(txt)) {
        colMap.media = c;
      } else if (colMap.content === -1 && /(konten favorit|topik favorit|jenis konten|konten)/i.test(txt)) {
        colMap.content = c;
      }
    }
  }

  // Fallback jika tidak terdeteksi nama kolom tapi cocok dengan indeks standar BNPT
  if (colMap.gender === -1 && colMap.religion === -1 && colMap.school === -1) {
    colMap.respondent = 0;
    colMap.gender = 1;
    colMap.religion = 2;
    colMap.grade = 3;
    colMap.school = 4;
    colMap.duration = 5;
    colMap.media = 6;
    colMap.content = 7;
  }

  const results = [];
  const startDataRow = qRowIdx + 1;

  for (let r = startDataRow; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row) || row.length === 0) continue;

    const respIdVal = colMap.respondent !== -1 ? String(row[colMap.respondent] || '').trim() : '';
    const genderVal = colMap.gender !== -1 ? String(row[colMap.gender] || '').trim() : '';

    // Lewati baris kosong atau baris keterangan rekapitulasi/skor di bagian bawah
    if (!respIdVal && !genderVal) continue;
    const lowerResp = respIdVal.toLowerCase();
    if (lowerResp.includes('skor') || lowerResp.includes('total') || lowerResp.includes('keterangan')) continue;

    // Ambil jawaban Q1 s/d Q24
    let answeredCount = 0;
    const rawResponses = {};
    for (let q = 1; q <= 24; q++) {
      const colIdx = qColMap[q];
      let ans = colIdx !== undefined ? String(row[colIdx] || '').trim().toUpperCase() : '';

      if (['SS', 'S', 'TS', 'STS'].includes(ans)) {
        answeredCount++;
      } else if (['1', '2', '3', '4'].includes(ans)) {
        // Konversi jika data numerik (1: SS, 2: S, 3: TS, 4: STS sesuai legend instrumen)
        const numMap = { '1': 'SS', '2': 'S', '3': 'TS', '4': 'STS' };
        ans = numMap[ans];
        answeredCount++;
      } else if (!ans) {
        ans = 'S'; // Default jika kosong
      }
      rawResponses['Q' + q] = ans;
    }

    // Hindari membaca tabel legenda di bagian bawah file
    if (answeredCount < 4 && !respIdVal) continue;

    // Parse konten favorit (comma-separated)
    let favoriteContent = [];
    const contentVal = colMap.content !== -1 ? String(row[colMap.content] || '').trim() : '';
    if (contentVal) {
      favoriteContent = contentVal.split(/[,;]/).map(s => s.trim()).filter(Boolean);
    }
    if (favoriteContent.length === 0) {
      favoriteContent = ['Musik'];
    }

    // Normalisasi Gender
    let normGender = 'Perempuan';
    if (/laki|pria|l\b/i.test(genderVal)) normGender = 'Laki-Laki';
    else if (/perempuan|wanita|p\b/i.test(genderVal)) normGender = 'Perempuan';

    // Normalisasi Durasi
    let normDuration = colMap.duration !== -1 ? String(row[colMap.duration] || '').trim() : '';
    if (!normDuration) normDuration = '3-5 jam';

    // Normalisasi Media Favorit
    let normMedia = colMap.media !== -1 ? String(row[colMap.media] || '').trim() : '';
    if (!normMedia) normMedia = 'TikTok';

    results.push({
      studentCode: respIdVal || `R${results.length + 1}`,
      gender: normGender,
      religion: (colMap.religion !== -1 && String(row[colMap.religion] || '').trim()) || 'Islam',
      grade: (colMap.grade !== -1 && String(row[colMap.grade] || '').trim()) || 'X',
      school: (colMap.school !== -1 && String(row[colMap.school] || '').trim()) || 'SMK N 3 BANDUNG',
      duration: normDuration,
      favoriteMedia: normMedia,
      favoriteContent,
      rawResponses
    });
  }

  return results;
}

/**
 * Parsing berkas Excel dari Buffer atau File Path
 */
export function parseSurveyExcel(input) {
  let wb;
  if (typeof input === 'string') {
    if (!fs.existsSync(input)) {
      throw new Error(`File tidak ditemukan: ${input}`);
    }
    const buf = fs.readFileSync(input);
    wb = XLSX.read(buf, { type: 'buffer' });
  } else if (Buffer.isBuffer(input) || input instanceof Uint8Array || input instanceof ArrayBuffer) {
    wb = XLSX.read(Buffer.from(input), { type: 'buffer' });
  } else {
    throw new Error('Input data file tidak valid');
  }

  return parseSurveyWorkbook(wb);
}
