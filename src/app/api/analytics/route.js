import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db.js';
import { computeComprehensiveAnalytics } from '@/lib/scoringEngine.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedId = searchParams.get('projectId');

    const db = await getDb();
    let project = null;

    if (requestedId) {
      project = db.prepare('SELECT * FROM projects WHERE id = ?').get(requestedId);
    } else {
      const allProjects = db.prepare('SELECT * FROM projects').all();
      project = allProjects[0] || null;
    }

    if (!project) {
      return NextResponse.json({
        success: true,
        project: null,
        analytics: {
          totalResponden: 0,
          targetKuota: 0,
          ketercapaianKuota: 0,
          marginOfError: 0,
          enumeratorAktif: 0,
          sekolahTerdata: 0,
          dimensionResults: {},
          indicatorResults: {},
          genderStats: {},
          religionStats: {},
          durationStats: {},
          schoolStats: {},
          contentCategories: {},
          favorableMean: 0,
          unfavorableMean: 0
        }
      });
    }

    const enumerators = db.prepare('SELECT * FROM enumerators WHERE project_id = ?').all(project.id);
    const responses = db.prepare('SELECT * FROM survey_responses WHERE project_id = ?').all(project.id);

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
