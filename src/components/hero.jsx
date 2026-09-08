import { Shield } from 'lucide-react';

export function Hero() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 pt-16 text-center sm:px-6 sm:pt-24">
      <div className="inline-flex items-center gap-2 rounded-sm border border-violet/40 bg-violet/10 px-3 py-1.5">
        <Shield className="size-3.5 text-violet" strokeWidth={2} />
        <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-violet">
          BADAN NASIONAL PENANGGULANGAN TERORISME (BNPT RI)
        </span>
      </div>
      <h1 className="mt-8 text-balance font-sans text-4xl font-bold leading-[1.1] tracking-tight sm:text-6xl">
        <span className="text-foreground">Platform Survei Lapangan &amp;</span><br />
        <span className="text-amber drop-glow-amber">Analytics Engine</span>{' '}
        <span className="text-cyan drop-glow-cyan">Psikometri Sekolah</span>
      </h1>
      <p className="mx-auto mt-6 max-w-2xl text-pretty font-mono text-sm leading-relaxed text-muted-foreground sm:text-base">
        Riset Respon Siswa terhadap Narasi Radikal Terorisme di Media Sosial pada Satuan Pendidikan Menengah Atas. Mengotomatiskan pengumpulan data terisolasi, standardisasi skoring inversi Likert, dan tabulasi silang analitik.
        <span className="ml-1 inline-block h-4 w-2 translate-y-0.5 bg-amber retro-blink" />
      </p>
    </section>
  );
}
