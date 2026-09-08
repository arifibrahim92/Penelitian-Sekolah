'use client';

import Link from 'next/link';
import { Shield, KeyRound } from 'lucide-react';

export function SiteHeader() {
  return (
    <header className="relative z-20 border-b border-border/60 bg-background/40 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <div className="grid size-11 place-items-center rounded-sm border border-cyan/30 bg-cyan/10 glow-cyan">
            <Shield className="size-6 text-cyan" strokeWidth={1.75} />
          </div>
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-[0.08em] text-foreground">SURVEI DAMAI</span>
              <span className="rounded-sm border border-violet/40 bg-violet/15 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-widest text-violet">BNPT RI</span>
            </div>
            <span className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground">ANALYTICS &amp; FIELD SURVEY ENGINE</span>
          </div>
        </Link>
        <nav className="flex items-center gap-3">
          <Link
            href="/survey/login"
            className="inline-flex items-center gap-2 rounded-sm border border-amber/40 bg-amber/15 px-4 py-2 font-mono text-sm font-semibold text-amber transition-colors hover:bg-amber/25 glow-amber"
            style={{ textDecoration: 'none' }}
          >
            <KeyRound className="size-4" strokeWidth={2} /> 
            <span>Masuk Surveyor (PIN)</span>
          </Link>
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-secondary px-4 py-2 font-mono text-sm font-semibold text-foreground transition-colors hover:bg-secondary/70"
            style={{ textDecoration: 'none' }}
          >
            <Shield className="size-4" strokeWidth={2} /> 
            <span>Portal Peneliti / Admin</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
