import { SiteHeader } from '@/components/site-header'
import { Hero } from '@/components/hero'
import { StatusPanel } from '@/components/status-panel'
import { PortalCards } from '@/components/portal-cards'
import { getDb } from '@/lib/db.js';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let project = null;
  let totalResponses = 0;
  let activeEnumerators = 0;
  let totalSchools = 0;

  try {
    const db = await getDb();
    const p = db.prepare('SELECT * FROM projects WHERE status = ? ORDER BY created_at DESC').get('ACTIVE') || db.prepare('SELECT * FROM projects ORDER BY created_at DESC').get();
    if (p) {
      project = p;
      totalResponses = db.prepare('SELECT COUNT(*) as count FROM survey_responses WHERE project_id = ?').get(project.id)?.count || 0;
      activeEnumerators = db.prepare("SELECT COUNT(*) as count FROM enumerators WHERE project_id = ? AND status = 'ACTIVE'").get(project.id)?.count || 0;
      totalSchools = db.prepare('SELECT COUNT(DISTINCT school_name) as count FROM survey_responses WHERE project_id = ?').get(project.id)?.count || 0;
    }
  } catch (err) {
    console.warn('DB load warning on HomePage:', err?.message);
  }

  const targetSample = project?.target_sample || 400;
  const percentTarget = project && project.target_sample
    ? Math.min(100, Number(((totalResponses / project.target_sample) * 100).toFixed(1)))
    : (totalResponses > 0 ? Math.min(100, Number(((totalResponses / targetSample) * 100).toFixed(1))) : 0);

  const metrics = [
    { label: 'Responden Masuk', value: String(totalResponses), sub: `Target: ${targetSample} siswa`, tone: 'text-foreground' },
    { label: 'Ketercapaian Kuota', value: `${percentTarget}%`, sub: 'Margin of Error: ~12%', tone: 'text-phosphor' },
    { label: 'Enumerator Aktif', value: String(activeEnumerators), sub: 'Akses via PIN 6-digit', tone: 'text-violet' },
    { label: 'Sekolah Terdata', value: String(totalSchools), sub: 'SMK / SMA / MA', tone: 'text-amber' },
  ];

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
          <StatusPanel project={project} metrics={metrics} />
          <PortalCards />
        </main>
      </div>
    </div>
  );
}
