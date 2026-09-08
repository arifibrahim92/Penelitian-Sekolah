import Link from 'next/link';
import { ArrowRight, CheckCircle2, KeyRound, Shield } from 'lucide-react';

const defaultPortals = [
  {
    icon: KeyRound,
    accent: 'cyan',
    eyebrow: 'FIELD ACCESS',
    title: 'Portal Enumerator Lapangan',
    body: (
      <>
        Antarmuka survei kuesioner terisolasi. Surveyor dapat langsung masuk menggunakan{' '}
        <span className="font-semibold text-foreground">PIN 6-Digit</span> tanpa password rumit.
        Dilengkapi pendampingan pengisian kuesioner siswa secara offline/online cepat.
      </>
    ),
    features: [
      'Akses PIN 6-digit terisolasi & aman',
      'Form 24 butir Likert ramah smartphone',
      'Tombol cepat "Input Responden Baru"',
    ],
    cta: 'Masuk Sebagai Surveyor (PIN)',
    href: '/survey/login',
  },
  {
    icon: Shield,
    accent: 'violet',
    eyebrow: 'COMMAND CENTER',
    title: 'Dashboard Peneliti / Admin',
    body: (
      <>
        Pusat kendali riset nasional. Pantau kuota sampel per sekolah, kelola dan kunci PIN
        enumerator, jalankan mesin inversi psikometri, analisis grafik interaktif, dan ekspor data
        JSON PRD.
      </>
    ),
    features: [
      'Manajemen Proyek, Enumerator & PIN',
      'Inversi Likert Otomatis (7 Indikator & 4 Dimensi)',
      'Ekspor JSON Skema PRD 7.1, CSV, & Laporan',
    ],
    cta: 'Masuk Portal Peneliti (Admin)',
    href: '/admin/login',
  },
];

export function PortalCards({ portals = defaultPortals }) {
  return (
    <section className="mx-auto mt-10 w-full max-w-5xl px-4 pb-24 sm:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        {portals.map((p) => {
          const isCyan = p.accent === 'cyan';
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className={`group relative flex flex-col justify-between rounded-md border bg-card/70 p-7 backdrop-blur-sm transition-colors sm:p-8 ${
                isCyan ? 'border-cyan/25 hover:border-cyan/50' : 'border-violet/25 hover:border-violet/50'
              }`}
            >
              <div>
                <div
                  className={`grid size-12 place-items-center rounded-sm border ${
                    isCyan ? 'border-cyan/30 bg-cyan/10 glow-cyan' : 'border-violet/30 bg-violet/10 glow-violet'
                  }`}
                >
                  <Icon className={`size-6 ${isCyan ? 'text-cyan' : 'text-violet'}`} strokeWidth={1.75} />
                </div>
                <span
                  className={`mt-6 inline-block font-mono text-[11px] font-bold tracking-[0.18em] ${
                    isCyan ? 'text-cyan' : 'text-violet'
                  }`}
                >
                  {p.eyebrow}
                </span>
                <h3 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground">{p.title}</h3>
                <p className="mt-3 font-mono text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`mt-0.5 size-4 shrink-0 ${isCyan ? 'text-cyan' : 'text-violet'}`}
                        strokeWidth={2}
                      />
                      <span className="font-mono text-sm text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href={p.href}
                className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-sm px-5 py-3.5 font-mono text-sm font-bold tracking-wide transition-transform hover:-translate-y-0.5 ${
                  isCyan ? 'bg-cyan text-background glow-cyan' : 'bg-violet text-background glow-violet'
                }`}
                style={{ textDecoration: 'none' }}
              >
                <span>{p.cta}</span>
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
