import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { StatusPanel } from '@/components/status-panel'
import { PortalCards } from '@/components/portal-cards'
import { getDb } from '@/lib/db.js';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let projects = [];

  try {
    const db = await getDb();
    projects = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM survey_responses r WHERE r.project_id = p.id) as total_responses,
        (SELECT COUNT(*) FROM enumerators e WHERE e.project_id = p.id AND e.status = 'ACTIVE') as active_enumerators,
        (SELECT COUNT(DISTINCT school_name) FROM survey_responses r WHERE r.project_id = p.id) as total_schools
      FROM projects p
      ORDER BY p.created_at DESC
    `).all();
  } catch (err) {
    console.warn('DB load warning on HomePage:', err?.message);
  }

  return (
    <div className="retro-landing-root relative min-h-screen overflow-hidden bg-background">
      {/* Retro background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0 retro-grid" />
      <div aria-hidden className="pointer-events-none absolute inset-0 retro-glow" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent"
      />

      <div className="relative z-10">
        <SiteHeader />
        <main>
          <Hero />
          <StatusPanel initialProjects={projects} />
          <PortalCards />
        </main>
      </div>
    </div>
  );
}
