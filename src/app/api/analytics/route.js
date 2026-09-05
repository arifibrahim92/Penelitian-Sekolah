import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db.js';
import { computeComprehensiveAnalytics } from '@/lib/scoringEngine.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || 'PRJ-2026-JB-001';

    const db = getDb();
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    const enumerators = db.prepare('SELECT * FROM enumerators WHERE project_id = ?').all(projectId);
    const responses = db.prepare('SELECT * FROM survey_responses WHERE project_id = ?').all(projectId);

    const analytics = computeComprehensiveAnalytics(responses, project, enumerators);

    return NextResponse.json({
      success: true,
      project,
      analytics
    });
  } catch (err) {
    console.error('Error calculating analytics:', err);
    return NextResponse.json({ error: 'Gagal memproses data analitik' }, { status: 500 });
  }
}
