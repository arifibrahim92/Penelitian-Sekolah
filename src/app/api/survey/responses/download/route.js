import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db.js';
import { QUESTIONS, QUESTION_MAP, DIMENSIONS, INDICATORS } from '@/lib/instrument.js';
import { scoreSingleResponse, evaluateResponseSafety } from '@/lib/scoringEngine.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const format = (searchParams.get('format') || 'json').toLowerCase();

    if (!id) {
      return NextResponse.json({ error: 'Parameter ID kuesioner diperlukan' }, { status: 400 });
    }

    const db = await getDb();
    const row = db.prepare(`
      SELECT r.*, e.full_name as enumerator_name, p.project_name, p.province
      FROM survey_responses r
      LEFT JOIN enumerators e ON r.enumerator_id = e.id
      LEFT JOIN projects p ON r.project_id = p.id
      WHERE r.id = ?
    `).get(id);

    if (!row) {
      return NextResponse.json({ error: 'Data kuesioner responden tidak ditemukan' }, { status: 404 });
    }

    const rawResponses = safeJsonParse(row.raw_responses, {});
    const scoredResponses = safeJsonParse(row.scored_responses, {});
    const favoriteContent = safeJsonParse(row.favorite_content, []);

    // Elaborate 24 items
    const items = QUESTIONS.map((q, idx) => {
      const ans = (rawResponses[q.code] || '').trim().toUpperCase() || '-';
      const score = scoredResponses[q.code] ?? scoreSingleResponse(q.code, ans);
      const safety = evaluateResponseSafety(q.code, ans);
      const dim = DIMENSIONS[q.dimensionId];
      const ind = INDICATORS[q.indicatorId];

      return {
        number: idx + 1,
        code: q.code,
        dimensionId: q.dimensionId,
        dimensionName: dim?.title || q.dimensionId,
        indicatorId: q.indicatorId,
        indicatorName: ind?.title || q.indicatorId,
        valence: q.valence === 'FAVORABLE' ? 'Favorable (+)' : 'Unfavorable (-)',
        valenceType: q.valence,
        questionText: q.text,
        rawAnswer: ans,
        numericScore: score,
        isSafe: safety.isSafe,
        isVulnerable: safety.isVulnerable,
        safetyStatus: safety.isSafe ? 'Aman' : (safety.isVulnerable ? 'Rentan' : 'Netral')
      };
    });

    const totalScore = items.reduce((acc, i) => acc + i.numericScore, 0);
    const maxScore = items.length * 4;
    const scorePercent = Number(((totalScore / maxScore) * 100).toFixed(2));
    const safeCount = items.filter(i => i.isSafe).length;
    const vulnerableCount = items.filter(i => i.isVulnerable).length;

    const safeFileName = (row.student_name || 'Responden')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();

    // 1. Format JSON
    if (format === 'json') {
      const resultJson = {
        metadata_kuesioner: {
          id_kuesioner: row.id,
          id_proyek: row.project_id,
          nama_proyek: row.project_name || 'Survei Respon Siswa',
          wilayah_analisis: row.province || 'Jawa Barat',
          nama_enumerator: row.enumerator_name || 'Petugas Lapangan',
          waktu_pengisian: row.created_at
        },
        profil_siswa: {
          nama: row.student_name,
          asal_sekolah: row.school_name,
          kelas: row.grade,
          jenis_kelamin: row.gender,
          agama: row.religion
        },
        perilaku_media_sosial: {
          durasi_harian: row.social_media_duration,
          platform_favorit: row.favorite_social_media,
          topik_konten_favorit: favoriteContent
        },
        ringkasan_skor_psikometri: {
          total_skor_aktual: totalScore,
          total_skor_maksimum: maxScore,
          persentase_skor_komposit: scorePercent,
          jumlah_butir_aman: safeCount,
          persentase_aman: Number(((safeCount / items.length) * 100).toFixed(2)),
          jumlah_butir_rentan: vulnerableCount,
          persentase_rentan: Number(((vulnerableCount / items.length) * 100).toFixed(2))
        },
        jawaban_butir_instrumen: items
      };

      return new Response(JSON.stringify(resultJson, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="jawaban-${safeFileName}-${row.id}.json"`
        }
      });
    }

    // 2. Format Transkrip Teks (TXT)
    const line = '='.repeat(80);
    const subLine = '-'.repeat(80);

    let txtContent = `${line}\n`;
    txtContent += `BADAN NASIONAL PENANGGULANGAN TERORISME REPUBLIK INDONESIA (BNPT RI)\n`;
    txtContent += `LEMBAR KUESIONER & TRANSKRIP JAWABAN SISWA (SURVEI LAPANGAN)\n`;
    txtContent += `${line}\n\n`;

    txtContent += `INFORMASI KUESIONER:\n`;
    txtContent += `ID Responden       : ${row.id}\n`;
    txtContent += `Proyek Riset       : ${row.project_name || 'Survei Respon Siswa terhadap Narasi Radikal Terorisme'}\n`;
    txtContent += `Wilayah / Provinsi : ${row.province || 'Jawa Barat'}\n`;
    txtContent += `Waktu Pengisian    : ${new Date(row.created_at).toLocaleString('id-ID')}\n`;
    txtContent += `Enumerator / Guru  : ${row.enumerator_name || 'Petugas Lapangan'}\n\n`;

    txtContent += `I. PROFIL SISWA\n${subLine}\n`;
    txtContent += `Nama Siswa         : ${row.student_name}\n`;
    txtContent += `Asal Satuan Pddk.  : ${row.school_name}\n`;
    txtContent += `Tingkat Kelas      : ${row.grade}\n`;
    txtContent += `Jenis Kelamin      : ${row.gender}\n`;
    txtContent += `Agama / Kepercayaan: ${row.religion}\n\n`;

    txtContent += `II. PERILAKU BERMEDIA SOSIAL\n${subLine}\n`;
    txtContent += `Durasi Medsos/Hari : ${row.social_media_duration}\n`;
    txtContent += `Platform Favorit   : ${row.favorite_social_media}\n`;
    txtContent += `Topik Konten Minat : ${favoriteContent.join(', ')}\n\n`;

    txtContent += `III. RINCIAN JAWABAN 24 BUTIR INSTRUMEN LIKERT\n${subLine}\n`;
    txtContent += `No | Kode | Sifat        | Jawab | Skor | Status  | Dimensi & Teks Pernyataan\n`;
    txtContent += `${subLine}\n`;

    items.forEach(i => {
      const numStr = String(i.number).padStart(2, ' ');
      const codeStr = i.code.padEnd(4, ' ');
      const valStr = i.valenceType === 'FAVORABLE' ? 'Favorable(+)' : 'Unfavorable(-)';
      const ansStr = i.rawAnswer.padEnd(5, ' ');
      const scoreStr = String(i.numericScore).padEnd(4, ' ');
      const statStr = i.safetyStatus.padEnd(7, ' ');
      txtContent += `${numStr} | ${codeStr} | ${valStr.padEnd(12, ' ')} | ${ansStr} | ${scoreStr} | ${statStr} | [${i.dimensionName}] ${i.questionText}\n`;
    });

    txtContent += `\n${line}\n`;
    txtContent += `RINGKASAN SKOR PSIKOMETRI:\n`;
    txtContent += `- Total Skor Aktual   : ${totalScore} dari ${maxScore} poin (${scorePercent}%)\n`;
    txtContent += `- Respon Aman         : ${safeCount} dari 24 butir (${((safeCount / 24) * 100).toFixed(1)}%)\n`;
    txtContent += `- Respon Rentan       : ${vulnerableCount} dari 24 butir (${((vulnerableCount / 24) * 100).toFixed(1)}%)\n`;
    txtContent += `- Klasifikasi Respon  : ${scorePercent >= 70 ? 'KUAT / RESILIEN' : (scorePercent >= 50 ? 'WASPADA / SEDANG' : 'KRITIS / RENTAN')}\n`;
    txtContent += `${line}\n`;
    txtContent += `Dicetak otomatis oleh Platform Survei Damai BNPT RI pada ${new Date().toISOString()}\n`;

    return new Response(txtContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="transkrip-jawaban-${safeFileName}-${row.id}.txt"`
      }
    });
  } catch (err) {
    console.error('Error downloading response file:', err);
    return NextResponse.json({ error: 'Gagal mengunduh berkas kuesioner responden' }, { status: 500 });
  }
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}
