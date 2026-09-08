'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, ChevronDown, Layers, ArrowRight } from 'lucide-react';
import { useActiveProject } from '@/lib/projectContext.js';
import Link from 'next/link';

export function StatusPanel({ initialProjects = [] }) {
  const { projectId, activeProject, projects: contextProjects, switchProject } = useActiveProject();

  // Gabungkan projects dari context (live fetch) dengan initialProjects (SSR)
  const projects = (contextProjects && contextProjects.length > 0) ? contextProjects : (initialProjects || []);

  const [selectedProjectId, setSelectedProjectId] = useState(projectId || (projects[0]?.id || ''));
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sinkronisasi dengan projectId dari context saat context siap
  useEffect(() => {
    if (projectId && projects.some(p => p.id === projectId)) {
      setSelectedProjectId(projectId);
    } else if (projects.length > 0 && !selectedProjectId) {
      const activeP = projects.find(p => p.status === 'ACTIVE') || projects[0];
      setSelectedProjectId(activeP.id);
    }
  }, [projectId, projects]);

  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    switchProject?.(id);
    setDropdownOpen(false);
  };

  const currentProject = projects.find(p => p.id === selectedProjectId)
    || projects.find(p => p.status === 'ACTIVE')
    || projects[0]
    || null;

  // Jika tidak ada proyek sama sekali
  if (!currentProject && projects.length === 0) {
    return (
      <section className="mx-auto mt-14 w-full max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-md border border-border bg-card/70 p-8 backdrop-blur-sm text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/60 to-transparent" />
          <div className="inline-grid size-12 place-items-center rounded-sm border border-violet/40 bg-violet/10 glow-violet mb-4">
            <Layers className="size-6 text-violet" />
          </div>
          <h2 className="font-sans text-2xl font-bold tracking-tight text-foreground">
            Belum Ada Riset yang Terdaftar
          </h2>
          <p className="mx-auto mt-2 max-w-xl font-mono text-sm text-muted-foreground leading-relaxed">
            Tidak ada proyek riset aktif yang terdeteksi di database. Silakan masuk ke Portal Admin untuk membuat proyek riset baru dan mendistribusikan PIN enumerator lapangan.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-sm border border-violet/40 bg-violet/20 px-5 py-2.5 font-mono text-sm font-bold text-violet hover:bg-violet/30 glow-violet transition-colors"
            >
              <span>Buka Portal Peneliti (Admin)</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const totalResponses = Number(currentProject?.total_responses || 0);
  const targetSample = Number(currentProject?.target_sample || 400);
  const percentTarget = targetSample > 0
    ? Math.min(100, Number(((totalResponses / targetSample) * 100).toFixed(1)))
    : 0;
  const activeEnumerators = Number(currentProject?.active_enumerators || 0);
  const totalSchools = Number(currentProject?.total_schools || 0);

  const displayMetrics = [
    {
      label: 'Responden Masuk',
      value: String(totalResponses),
      sub: `Target: ${targetSample} siswa`,
      tone: 'text-foreground'
    },
    {
      label: 'Ketercapaian Kuota',
      value: `${percentTarget}%`,
      sub: 'Margin of Error: ~12%',
      tone: 'text-phosphor'
    },
    {
      label: 'Enumerator Aktif',
      value: String(activeEnumerators),
      sub: 'Akses via PIN 6-digit',
      tone: 'text-violet'
    },
    {
      label: 'Sekolah Terdata',
      value: String(totalSchools),
      sub: 'SMK / SMA / MA',
      tone: 'text-amber'
    },
  ];

  const projectName = currentProject ? currentProject.project_name : 'Respon Murid Jawa Tengah';
  const provinceName = currentProject ? `(${currentProject.province})` : '(Jawa Tengah)';
  const isProjectActive = currentProject?.status === 'ACTIVE';

  return (
    <section className="mx-auto mt-14 w-full max-w-5xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-md border border-border bg-card/70 p-6 backdrop-blur-sm sm:p-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber/60 to-transparent" />

        {/* Top Header Row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold tracking-[0.18em] text-muted-foreground">
                WILAYAH RISET TERKINI
              </span>
              {projects.length > 1 && (
                <span className="rounded-sm border border-cyan/40 bg-cyan/15 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-cyan">
                  {projects.length} RISET TERDAFTAR
                </span>
              )}
            </div>
            <h2 className="mt-1 font-sans text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {projectName} <span className="text-muted-foreground font-normal">{provinceName}</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Badge */}
            <div className={`inline-flex w-fit items-center gap-2 rounded-sm border px-3 py-1.5 ${
              isProjectActive
                ? 'border-phosphor/40 bg-phosphor/10 text-phosphor'
                : 'border-amber/40 bg-amber/10 text-amber'
            }`}>
              <CheckCircle2 className="size-4" strokeWidth={2} />
              <span className="font-mono text-[11px] font-bold tracking-[0.14em]">
                {isProjectActive ? 'STATUS: AKTIF BERJALAN' : `STATUS: ${currentProject?.status || 'STANDBY'}`}
              </span>
            </div>

            {/* Dropdown Toggle Button if multiple projects */}
            {projects.length > 1 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-cyan/40 bg-cyan/15 px-3 py-1.5 font-mono text-[11px] font-bold text-cyan transition-colors hover:bg-cyan/25 glow-cyan cursor-pointer"
                >
                  <Layers className="size-3.5" />
                  <span>Pilih Riset Lain</span>
                  <ChevronDown className={`size-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-md border border-cyan/30 bg-[#0b101d] p-2 shadow-2xl backdrop-blur-md glow-cyan">
                      <div className="px-2 py-1.5 font-mono text-[10px] font-bold tracking-wider text-muted-foreground border-b border-border/60 mb-1.5">
                        DAFTAR RISET AKTIF ({projects.length})
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {projects.map((p) => {
                          const isSelected = p.id === currentProject?.id;
                          const pResp = Number(p.total_responses || 0);
                          const pTgt = Number(p.target_sample || 400);
                          const pPct = pTgt > 0 ? ((pResp / pTgt) * 100).toFixed(0) : 0;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectProject(p.id)}
                              className={`w-full text-left rounded-sm p-2 font-mono text-xs transition-colors cursor-pointer flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'border border-cyan/40 bg-cyan/15 text-cyan'
                                  : 'hover:bg-secondary/60 text-foreground'
                              }`}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-bold truncate">{p.project_name}</div>
                                <div className="text-[10px] text-muted-foreground">
                                  {p.province} • {pResp}/{pTgt} siswa ({pPct}%)
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="size-4 shrink-0 text-cyan" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Multiple Projects Switcher Tabs/Pills */}
        {projects.length > 1 && (
          <div className="mt-5 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
                <Layers className="size-3.5 text-cyan" />
                PILIH &amp; GANTI TAMPILAN RISET:
              </span>
              <span className="hidden sm:inline font-mono text-[10px] text-muted-foreground/80">
                Klik kartu untuk beralih data
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {projects.map((p) => {
                const isSelected = p.id === currentProject?.id;
                const pResp = Number(p.total_responses || 0);
                const pTgt = Number(p.target_sample || 400);
                const pPct = pTgt > 0 ? ((pResp / pTgt) * 100).toFixed(0) : 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProject(p.id)}
                    className={`group relative flex items-center gap-2 rounded-sm border px-3 py-1.5 font-mono text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan/60 bg-cyan/20 text-cyan glow-cyan shadow-sm'
                        : 'border-border/60 bg-secondary/40 text-muted-foreground hover:border-cyan/40 hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`size-2 rounded-full transition-colors ${
                        isSelected
                          ? 'bg-cyan shadow-[0_0_8px_#06b6d4] animate-pulse'
                          : 'bg-muted-foreground/40 group-hover:bg-muted-foreground'
                      }`}
                    />
                    <span className="font-bold">{p.project_name}</span>
                    <span className="text-[10px] opacity-75">({p.province})</span>
                    <span
                      className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold ${
                        isSelected ? 'bg-cyan/30 text-cyan' : 'bg-white/5 text-muted-foreground'
                      }`}
                    >
                      {pResp}/{pTgt} ({pPct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quota Fulfillment Progress Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-muted-foreground">
              Ketercapaian Kuota Riset <span className="text-foreground font-semibold">({projectName})</span>:
            </span>
            <span className="font-bold text-phosphor">
              {totalResponses} dari {targetSample} Siswa ({percentTarget}%)
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary/80 border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan via-amber to-phosphor transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
              style={{ width: `${Math.min(100, Math.max(percentTarget > 0 ? 2 : 0, percentTarget))}%` }}
            />
          </div>
        </div>

        <div className="my-6 h-px w-full bg-border" />

        {/* 4 Key Metrics */}
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
