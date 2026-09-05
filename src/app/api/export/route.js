import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db.js';
import { computeComprehensiveAnalytics } from '@/lib/scoringEngine.js';
import { QUESTIONS } from '@/lib/instrument.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'PRJ-2026-JB-001';
    const format = searchParams.get('format') || 'json';

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    const enumerators = db.prepare('SELECT * FROM enumerators WHERE project_id = ?').all(projectId);
    const responses = db.prepare(`
      SELECT r.*, e.full_name as enumerator_name
      FROM survey_responses r
      LEFT JOIN enumerators e ON r.enumerator_id = e.id
      WHERE r.project_id = ?
      ORDER BY r.created_at ASC
    `).all(projectId);

    // 1. Format JSON Baku PRD 7.1
    if (format === 'json') {
      const analytics = computeComprehensiveAnalytics(responses, project, enumerators);
      const jsonString = JSON.stringify(analytics.structuredJson, null, 2);

      return new NextResponse(jsonString, {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="hasil_analisis_${projectId}.json"`
        }
      });
    }

    // 2. Format CSV Raw Responses
    if (format === 'csv_raw') {
      const qHeaders = QUESTIONS.map(q => q.code);
      const headerRow = [
        'ID Responden', 'Nama Siswa', 'Jenis Kelamin', 'Agama', 'Kelas', 'Sekolah',
        'Durasi Medsos', 'Medsos Favorit', 'Konten Favorit', 'Enumerator', 'Waktu Submit',
        ...qHeaders
      ];

      const rows = [headerRow.join(',')];

      for (const r of responses) {
        const raw = safeJsonParse(r.raw_responses, {});
        const content = safeJsonParse(r.favorite_content, []).join('; ');

        const qValues = QUESTIONS.map(q => `"${escapeCsv(raw[q.code] || '')}"`);

        const row = [
          `"${escapeCsv(r.id)}"`,
          `"${escapeCsv(r.student_name)}"`,
          `"${escapeCsv(r.gender)}"`,
          `"${escapeCsv(r.religion)}"`,
          `"${escapeCsv(r.grade)}"`,
          `"${escapeCsv(r.school_name)}"`,
          `"${escapeCsv(r.social_media_duration)}"`,
          `"${escapeCsv(r.favorite_social_media)}"`,
          `"${escapeCsv(content)}"`,
          `"${escapeCsv(r.enumerator_name || '')}"`,
          `"${escapeCsv(r.created_at)}"`,
          ...qValues
        ];
        rows.push(row.join(','));
      }

      const csvContent = '\uFEFF' + rows.join('\r\n'); // BOM for Excel UTF-8
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="data_mentah_${projectId}.csv"`
        }
      });
    }

    // 3. Format CSV Scored Responses (Nilai 1-4 setelah Inversi)
    if (format === 'csv_scored') {
      const qHeaders = QUESTIONS.map(q => `${q.code} (${q.valence === 'FAVORABLE' ? '+' : '-'})`);
      const headerRow = [
        'ID Responden', 'Nama Siswa', 'Jenis Kelamin', 'Agama', 'Kelas', 'Sekolah',
        'Durasi Medsos', 'Medsos Favorit', 'Total Skor', 'Rata-Rata Skor',
        ...qHeaders
      ];

      const rows = [headerRow.join(',')];

      for (const r of responses) {
        const scored = safeJsonParse(r.scored_responses, {});
        let total = 0;
        const qValues = QUESTIONS.map(q => {
          const val = scored[q.code] || 0;
          total += val;
          return val;
        });

        const mean = Number((total / QUESTIONS.length).toFixed(2));

        const row = [
          `"${escapeCsv(r.id)}"`,
          `"${escapeCsv(r.student_name)}"`,
          `"${escapeCsv(r.gender)}"`,
          `"${escapeCsv(r.religion)}"`,
          `"${escapeCsv(r.grade)}"`,
          `"${escapeCsv(r.school_name)}"`,
          `"${escapeCsv(r.social_media_duration)}"`,
          `"${escapeCsv(r.favorite_social_media)}"`,
          total,
          mean,
          ...qValues
        ];
        rows.push(row.join(','));
      }

      const csvContent = '\uFEFF' + rows.join('\r\n');
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="data_berskor_${projectId}.csv"`
        }
      });
    }

    return NextResponse.json({ error: 'Format ekspor tidak didukung (gunakan json, csv_raw, atau csv_scored)' }, { status: 400 });
  } catch (err) {
    console.error('Error exporting data:', err);
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}

function escapeCsv(val) {
  if (val === null || val === undefined) return '';
  return String(val).replace(/"/g, '""');
}

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try { return JSON.parse(str); } catch { return fallback; }
}
