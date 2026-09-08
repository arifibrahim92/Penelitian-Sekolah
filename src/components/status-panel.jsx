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
                  className="project-dropdown-btn"
                  style={{
                    backgroundColor: '#0c182c',
                    border: '1px solid #06b6d4',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Layers className="size-3.5" style={{ color: '#06b6d4' }} />
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>Pilih Riset Lain</span>
                  <ChevronDown className={`size-3.5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ color: '#38bdf8' }} />
                </button>

                {dropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setDropdownOpen(false)}
                    />
                    <div
                      className="absolute right-0 top-full z-50 mt-2 w-72 sm:w-80 rounded-md p-2 shadow-2xl backdrop-blur-md"
                      style={{
                        backgroundColor: '#0a101f',
                        border: '1px solid rgba(6, 182, 212, 0.5)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.9), 0 0 20px rgba(6, 182, 212, 0.25)',
                      }}
                    >
                      <div
                        className="px-2 py-1.5 font-mono text-[10px] font-bold tracking-wider border-b mb-1.5"
                        style={{ color: '#94a3b8', borderColor: 'rgba(255, 255, 255, 0.12)' }}
                      >
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
                              className="w-full text-left rounded-sm p-2 font-mono text-xs transition-colors cursor-pointer flex items-center justify-between gap-2"
                              style={{
                                backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                                border: isSelected ? '1px solid rgba(6, 182, 212, 0.5)' : '1px solid transparent',
                                color: '#ffffff',
                              }}
                            >
                              <div className="min-w-0 flex-1">
                                <div style={{ fontWeight: 700, color: '#ffffff' }}>{p.project_name}</div>
                                <div style={{ fontSize: '0.75rem', color: isSelected ? '#38bdf8' : '#94a3b8' }}>
                                  {p.province} • {pResp}/{pTgt} siswa ({pPct}%)
                                </div>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="size-4 shrink-0" style={{ color: '#06b6d4' }} />
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
          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: 6,
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Layers className="size-3.5" style={{ color: '#06b6d4' }} />
                </div>
                <span className="font-mono text-xs font-bold tracking-[0.12em]" style={{ color: '#f8fafc' }}>
                  PILIH &amp; GANTI TAMPILAN RISET:
                </span>
              </div>
              <span className="hidden sm:inline font-mono text-[11px]" style={{ color: '#94a3b8' }}>
                Klik tombol riset untuk beralih data
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
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
                    className={`project-pill ${isSelected ? 'project-pill-active' : ''}`}
                    style={{
                      backgroundColor: isSelected ? '#082138' : '#0f172a',
                      border: isSelected ? '1.5px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.18)',
                      boxShadow: isSelected ? '0 0 16px rgba(6, 182, 212, 0.35)' : '0 2px 6px rgba(0, 0, 0, 0.3)',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        borderRadius: '50%',
                        backgroundColor: isSelected ? '#06b6d4' : '#64748b',
                        boxShadow: isSelected ? '0 0 10px #06b6d4' : 'none',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                      {p.project_name}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: isSelected ? '#38bdf8' : '#94a3b8' }}>
                      ({p.province})
                    </span>
                    <span
                      className="project-pill-badge"
                      style={{
                        backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                        color: isSelected ? '#22d3ee' : '#cbd5e1',
                        border: isSelected ? '1px solid rgba(6, 182, 212, 0.45)' : '1px solid rgba(255, 255, 255, 0.15)',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: '4px',
                      }}
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
            <span style={{ color: '#cbd5e1' }}>
              Ketercapaian Kuota Riset <span className="font-semibold" style={{ color: '#ffffff' }}>({projectName})</span>:
            </span>
            <span className="font-bold text-phosphor" style={{ color: '#34d399' }}>
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
