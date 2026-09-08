import { CheckCircle2 } from 'lucide-react';

export function StatusPanel({ project, metrics }) {
  const displayMetrics = metrics || [
    { label: 'Responden Masuk', value: '0', sub: 'Target: 400 siswa', tone: 'text-foreground' },
    { label: 'Ketercapaian Kuota', value: '0%', sub: 'Margin of Error: ~12%', tone: 'text-phosphor' },
    { label: 'Enumerator Aktif', value: '0', sub: 'Akses via PIN 6-digit', tone: 'text-violet' },
    { label: 'Sekolah Terdata', value: '0', sub: 'SMK / SMA / MA', tone: 'text-amber' },
  ];

  const projectName = project ? project.project_name : 'Respon Murid Jawa Tengah';
  const provinceName = project ? `(${project.province})` : '(Jawa Tengah)';
  const statusLabel = project ? 'STATUS: AKTIF BERJALAN' : 'STATUS: AKTIF BERJALAN';

  return (
    <section className="mx-auto mt-14 w-full max-w-5xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-md border border-border bg-card/70 p-6 backdrop-blur-sm sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/60 to-transparent" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
              WILAYAH RISET TERKINI
            </span>
            <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground">
              {projectName} <span className="text-muted-foreground">{provinceName}</span>
            </h2>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-sm border border-phosphor/40 bg-phosphor/10 px-3 py-1.5">
            <CheckCircle2 className="size-4 text-phosphor" strokeWidth={2} />
            <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-phosphor">{statusLabel}</span>
          </div>
        </div>
        <div className="my-6 h-px w-full bg-border" />
        <dl className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {displayMetrics.map((m) => (
            <div key={m.label}>
              <dt className="font-mono text-xs tracking-wide text-muted-foreground">{m.label}</dt>
              <dd className={`mt-1 font-mono text-4xl font-bold ${m.tone}`}>{m.value}</dd>
              <p className="mt-1 font-mono text-[11px] text-muted-foreground/80">{m.sub}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
