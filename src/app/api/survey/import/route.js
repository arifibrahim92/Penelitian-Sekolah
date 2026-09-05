import { NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db.js';
import { scoreAllResponses } from '@/lib/scoringEngine.js';
import { parseExcelSurveyData } from '@/lib/seed.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const projectId = formData.get('projectId') || 'PRJ-2026-JB-001';
    const enumeratorId = formData.get('enumeratorId') || 'ENUM-001';

    if (!file) {
      return NextResponse.json({ error: 'File Excel (.xlsx) atau CSV wajib diunggah' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempFilePath = path.join(os.tmpdir(), `temp_import_${Date.now()}.xlsx`);
    fs.writeFileSync(tempFilePath, buffer);

    let parsedResponses = [];
    try {
      parsedResponses = parseExcelSurveyData(tempFilePath);
    } catch (parseErr) {
      console.error('Error parsing uploaded file:', parseErr);
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return NextResponse.json({
        error: 'Format file tidak valid atau gagal diekstrak. Pastikan file berformat .xlsx dengan kolom standar riset.'
      }, { status: 400 });
    } finally {
      if (fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch {}
      }
    }

    if (parsedResponses.length === 0) {
      return NextResponse.json({ error: 'Tidak ada baris data responden yang berhasil dibaca dari file.' }, { status: 400 });
    }

    const db = await getDb();
    let inserted = 0;

    const insertStmt = db.prepare(`
      INSERT INTO survey_responses (
        id, project_id, enumerator_id, student_name, gender, religion, grade,
        school_name, social_media_duration, favorite_social_media, favorite_content,
        raw_responses, scored_responses, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      for (let i = 0; i < parsedResponses.length; i++) {
        const r = parsedResponses[i];
        const respId = generateId('RESP-IMP');
        const scored = scoreAllResponses(r.rawResponses);

        insertStmt.run(
          respId,
          projectId,
          enumeratorId,
          `Responden Import ${i + 1}`,
          r.gender || 'Perempuan',
          r.religion || 'Islam',
          r.grade || 'X',
          r.school || 'SMK N 3 BANDUNG',
          r.duration || '3-5 jam',
          r.favoriteMedia || 'TikTok',
          JSON.stringify(r.favoriteContent || ['Musik']),
          JSON.stringify(r.rawResponses),
          JSON.stringify(scored),
          new Date().toISOString()
        );
        inserted++;
      }

      // Update total_submissions enumerator
      db.prepare(`
        UPDATE enumerators
        SET total_submissions = total_submissions + ?
        WHERE id = ?
      `).run(inserted, enumeratorId);
    })();

    await db.persist?.();

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${inserted} responden baru ke dalam proyek!`,
      importedCount: inserted
    });
  } catch (err) {
    console.error('Error during survey import:', err);
    return NextResponse.json({ error: 'Gagal mengimpor file data' }, { status: 500 });
  }
}
