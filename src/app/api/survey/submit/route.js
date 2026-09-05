import { NextResponse } from 'next/server';
import { getDb, generateId } from '@/lib/db.js';
import { scoreAllResponses } from '@/lib/scoringEngine.js';
import { QUESTIONS } from '@/lib/instrument.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      pin,
      enumeratorId,
      studentName = 'Anonim',
      gender,
      religion,
      grade,
      schoolName,
      socialMediaDuration,
      favoriteSocialMedia,
      favoriteContent = [],
      rawResponses = {}
    } = body;

    const db = await getDb();

    // 1. Verifikasi Enumerator
    let enumerator = null;
    if (pin) {
      enumerator = db.prepare('SELECT * FROM enumerators WHERE pin_raw = ?').get(pin.trim());
    } else if (enumeratorId) {
      enumerator = db.prepare('SELECT * FROM enumerators WHERE id = ?').get(enumeratorId);
    }

    if (!enumerator) {
      return NextResponse.json({ error: 'Identitas enumerator tidak valid atau PIN salah' }, { status: 401 });
    }

    if (enumerator.status === 'REVOKED') {
      return NextResponse.json({
        error: 'Akses PIN Anda telah dinonaktifkan oleh Peneliti Utama'
      }, { status: 403 });
    }

    // 2. Validasi Profil Siswa
    if (!gender || !religion || !grade || !schoolName) {
      return NextResponse.json({
        error: 'Data profil siswa (Jenis Kelamin, Agama, Kelas, dan Asal Sekolah) wajib dilengkapi'
      }, { status: 400 });
    }

    if (!socialMediaDuration || !favoriteSocialMedia) {
      return NextResponse.json({
        error: 'Data perilaku bermedia sosial (durasi harian dan media sosial utama) wajib diisi'
      }, { status: 400 });
    }

    // 3. Sanitasi Respons Kuesioner (Fleksibel, tidak dibatasi wajib 24 butir)
    const validChoices = ['SS', 'S', 'TS', 'STS'];
    const sanitizedResponses = {};
    for (const q of QUESTIONS) {
      const val = rawResponses[q.code];
      if (val && validChoices.includes(val.trim().toUpperCase())) {
        sanitizedResponses[q.code] = val.trim().toUpperCase();
      }
    }

    // 4. Kalkulasi Skoring Psikometri Otomatis dengan Inversi
    const scoredResponses = scoreAllResponses(sanitizedResponses);

    // 5. Simpan ke Database Proyek
    const responseId = generateId('RESP');
    const now = new Date().toISOString();

    db.transaction(() => {
      db.prepare(`
        INSERT INTO survey_responses (
          id, project_id, enumerator_id, student_name, gender, religion, grade,
          school_name, social_media_duration, favorite_social_media, favorite_content,
          raw_responses, scored_responses, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        responseId,
        enumerator.project_id,
        enumerator.id,
        studentName ? studentName.trim() : 'Anonim',
        gender,
        religion,
        grade,
        schoolName.trim(),
        socialMediaDuration,
        favoriteSocialMedia,
        JSON.stringify(Array.isArray(favoriteContent) ? favoriteContent : [favoriteContent]),
        JSON.stringify(rawResponses),
        JSON.stringify(scoredResponses),
        now
      );

      // Increment counter enumerator
      db.prepare(`
        UPDATE enumerators
        SET total_submissions = total_submissions + 1
        WHERE id = ?
      `).run(enumerator.id);
    })();

    await db.persist?.();

    // Ambil statistik terkini enumerator
    const updatedEnum = db.prepare('SELECT total_submissions FROM enumerators WHERE id = ?').get(enumerator.id);
    const todayCount = db.prepare(`
      SELECT COUNT(*) as count FROM survey_responses
      WHERE enumerator_id = ? AND date(created_at) = date('now')
    `).get(enumerator.id).count;

    return NextResponse.json({
      success: true,
      message: 'Respons kuesioner siswa berhasil disimpan!',
      responseId,
      todaySubmissions: todayCount,
      totalSubmissions: updatedEnum.total_submissions
    }, { status: 201 });
  } catch (err) {
    console.error('Error submitting survey response:', err);
    return NextResponse.json({ error: 'Terjadi kegagalan saat menyimpan respons survei' }, { status: 500 });
  }
}
