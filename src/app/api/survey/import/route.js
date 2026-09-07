import { NextResponse } from 'next/server';
import { getDb, generateId, hashString } from '@/lib/db.js';
import { scoreAllResponses } from '@/lib/scoringEngine.js';
import { parseSurveyExcel } from '@/lib/excelParser.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const requestedProjectId = formData.get('projectId');
    const requestedEnumeratorId = formData.get('enumeratorId');

    if (!file) {
      return NextResponse.json(
        { error: 'Berkas Excel (.xlsx, .xls) atau CSV wajib dipilih untuk diunggah.' },
        { status: 400 }
      );
    }

    // Baca buffer langsung dari memori tanpa file sementara
    const buffer = Buffer.from(await file.arrayBuffer());

    let parsedResponses = [];
    try {
      parsedResponses = parseSurveyExcel(buffer);
    } catch (parseErr) {
      console.error('Error parsing uploaded survey file:', parseErr);
      return NextResponse.json(
        {
          error:
            parseErr.message ||
            'Format berkas tidak valid atau gagal dibaca. Pastikan berkas berformat .xlsx, .xls, atau .csv dengan kolom instrumen riset standar (Q1 s/d Q24).'
        },
        { status: 400 }
      );
    }

    if (!parsedResponses || parsedResponses.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada baris data responden yang berhasil diekstrak dari berkas.' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // 1. Validasi / Resolusi Proyek Riset
    let project = null;
    if (requestedProjectId) {
      project = db.prepare('SELECT id, project_name FROM projects WHERE id = ?').get(requestedProjectId);
    }
    if (!project) {
      // Ambil proyek yang berstatus ACTIVE terbaru atau proyek terbaru apa pun
      project =
        db.prepare('SELECT id, project_name FROM projects WHERE status = "ACTIVE" ORDER BY created_at DESC LIMIT 1').get() ||
        db.prepare('SELECT id, project_name FROM projects ORDER BY created_at DESC LIMIT 1').get();
    }

    if (!project) {
      return NextResponse.json(
        {
          error:
            'Belum ada proyek riset yang terdaftar di sistem. Silakan buat riset baru terlebih dahulu pada menu Manajemen Riset sebelum mengimpor data kuesioner.'
        },
        { status: 400 }
      );
    }

    // 2. Validasi / Resolusi Enumerator
    let enumerator = null;
    if (requestedEnumeratorId) {
      enumerator = db
        .prepare('SELECT id FROM enumerators WHERE id = ? AND project_id = ?')
        .get(requestedEnumeratorId, project.id);
    }
    if (!enumerator) {
      enumerator =
        db.prepare('SELECT id FROM enumerators WHERE project_id = ? AND status = "ACTIVE" LIMIT 1').get(project.id) ||
        db.prepare('SELECT id FROM enumerators WHERE project_id = ? LIMIT 1').get(project.id);
    }

    if (!enumerator) {
      // Buat enumerator default otomatis untuk impor data jika belum ada
      const newEnumId = generateId('ENUM-IMP');
      db.prepare(`
        INSERT INTO enumerators (id, project_id, full_name, phone_number, assigned_school, pin_hash, pin_raw, status, total_submissions)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0)
      `).run(
        newEnumId,
        project.id,
        'Petugas Impor Berkas',
        '08120000000',
        'Semua Sekolah (Data Impor)',
        hashString('123456'),
        '123456'
      );
      enumerator = { id: newEnumId };
    }

    // 3. Masukkan Seluruh Data Responden
    const insertStmt = db.prepare(`
      INSERT INTO survey_responses (
        id, project_id, enumerator_id, student_name, gender, religion, grade,
        school_name, social_media_duration, favorite_social_media, favorite_content,
        raw_responses, scored_responses, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;

    db.transaction(() => {
      for (let i = 0; i < parsedResponses.length; i++) {
        const r = parsedResponses[i];
        const respId = generateId('RESP-IMP');
        const scored = scoreAllResponses(r.rawResponses);

        let studentDisplayName = `Responden Impor ${i + 1}`;
        if (r.studentCode) {
          if (r.studentCode.toUpperCase().startsWith('R') || r.studentCode.toLowerCase().startsWith('responden')) {
            studentDisplayName = r.studentCode.toLowerCase().startsWith('responden')
              ? r.studentCode
              : `Responden ${r.studentCode}`;
          } else {
            studentDisplayName = r.studentCode;
          }
        }

        insertStmt.run(
          respId,
          project.id,
          enumerator.id,
          studentDisplayName,
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
      `).run(inserted, enumerator.id);
    })();

    // Persistensi data ke Netlify Blobs / disk lokal
    await db.persist?.();

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor ${inserted} data responden kuesioner ke dalam riset "${project.project_name}"!`,
      importedCount: inserted,
      projectId: project.id,
      projectName: project.project_name
    });
  } catch (err) {
    console.error('Error during survey import:', err);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memproses impor data kuesioner.' },
      { status: 500 }
    );
  }
}
