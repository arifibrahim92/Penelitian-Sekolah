import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'PRJ-2026-JB-001';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const school = searchParams.get('school') || '';
    const gender = searchParams.get('gender') || '';
    const religion = searchParams.get('religion') || '';
    const duration = searchParams.get('duration') || '';
    const media = searchParams.get('media') || '';

    const db = await getDb();
    let whereClauses = ['r.project_id = ?'];
    let params = [projectId];

    if (search) {
      whereClauses.push('(r.student_name LIKE ? OR r.school_name LIKE ? OR r.id LIKE ?)');
      const s = `%${search.trim()}%`;
      params.push(s, s, s);
    }
    if (school) {
      whereClauses.push('r.school_name = ?');
      params.push(school);
    }
    if (gender) {
      whereClauses.push('r.gender = ?');
      params.push(gender);
    }
    if (religion) {
      whereClauses.push('r.religion = ?');
      params.push(religion);
    }
    if (duration) {
      whereClauses.push('r.social_media_duration = ?');
      params.push(duration);
    }
    if (media) {
      whereClauses.push('r.favorite_social_media = ?');
      params.push(media);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM survey_responses r
      ${whereStr}
    `).get(...params).count;

    const offset = (page - 1) * limit;
    const responses = db.prepare(`
      SELECT r.*, e.full_name as enumerator_name
      FROM survey_responses r
      LEFT JOIN enumerators e ON r.enumerator_id = e.id
      ${whereStr}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // Filter dropdown options
    const schools = db.prepare(`
      SELECT DISTINCT school_name FROM survey_responses WHERE project_id = ? ORDER BY school_name
    `).all(projectId).map(s => s.school_name);

    const religions = db.prepare(`
      SELECT DISTINCT religion FROM survey_responses WHERE project_id = ? ORDER BY religion
    `).all(projectId).map(r => r.religion);

    return NextResponse.json({
      success: true,
      responses: responses.map(r => ({
        ...r,
        favorite_content: safeJsonParse(r.favorite_content, []),
        raw_responses: safeJsonParse(r.raw_responses, {}),
        scored_responses: safeJsonParse(r.scored_responses, {})
      })),
      filterOptions: { schools, religions },
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      }
    });
  } catch (err) {
    console.error('Error fetching responses:', err);
    return NextResponse.json({ error: 'Gagal memuat data responden' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID responden wajib disertakan' }, { status: 400 });
    }

    const db = await getDb();
    const existing = db.prepare('SELECT enumerator_id FROM survey_responses WHERE id = ?').get(id);
    if (!existing) {
      return NextResponse.json({ error: 'Data responden tidak ditemukan' }, { status: 404 });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM survey_responses WHERE id = ?').run(id);
      if (existing.enumerator_id) {
        db.prepare(`
          UPDATE enumerators
          SET total_submissions = MAX(0, total_submissions - 1)
          WHERE id = ?
        `).run(existing.enumerator_id);
      }
    })();

    await db.persist?.();

    return NextResponse.json({ success: true, message: 'Data responden berhasil dihapus' });
  } catch (err) {
    console.error('Error deleting response:', err);
    return NextResponse.json({ error: 'Gagal menghapus data responden' }, { status: 500 });
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
