'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Shield, BarChart3, Users, Database, Download, LogOut, KeyRound, CheckCircle2, Home, Layers, ChevronDown, FolderPlus } from 'lucide-react';
import { useActiveProject } from '@/lib/projectContext.js';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [surveyorSession, setSurveyorSession] = useState(null);

  useEffect(() => {
    // Cek status sesi dari cookie atau localStorage
    if (typeof window !== 'undefined') {
      const cookies = document.cookie;
      setIsAdmin(cookies.includes('admin_session') || pathname.startsWith('/admin'));
      
      const surveyorCookie = cookies.split('; ').find(row => row.startsWith('surveyor_session='));
      if (surveyorCookie) {
        try {
          const decoded = decodeURIComponent(surveyorCookie.split('=')[1]);
          setSurveyorSession(JSON.parse(decoded));
        } catch {}
      }
    }
  }, [pathname]);

  const handleAdminLogout = () => {
    document.cookie = 'admin_session=; path=/; max-age=0';
    setIsAdmin(false);
    router.push('/admin/login');
  };

  const handleSurveyorLogout = () => {
    document.cookie = 'surveyor_session=; path=/; max-age=0';
    setSurveyorSession(null);
    router.push('/survey/login');
  };

  const isSurveyPage = pathname.startsWith('/survey');
  const isAdminPage = pathname.startsWith('/admin');

  return (
    <header className="navbar no-print">
      <div className="nav-inner">
        {/* Brand */}
        <Link href="/" className="brand-logo">
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(79, 70, 229, 0.4)'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>SURVEI DAMAI</span>
              <span className="brand-badge">BNPT RI</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Analytics & Field Survey Engine
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav>
          {isAdminPage && !pathname.includes('/admin/login') && (
            <ul className="nav-links">
              {/* Project Selector Dropdown */}
              <li style={{ marginRight: 6 }}>
                <ProjectNavSelector />
              </li>
              <li>
                <Link href="/admin/projects" className={`nav-link ${pathname === '/admin/projects' ? 'active' : ''}`}>
                  <Layers size={16} />
                  <span>Proyek Riset</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/dashboard" className={`nav-link ${pathname === '/admin/dashboard' ? 'active' : ''}`}>
                  <BarChart3 size={16} />
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/enumerators" className={`nav-link ${pathname === '/admin/enumerators' ? 'active' : ''}`}>
                  <Users size={16} />
                  <span>Enumerator & PIN</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/responses" className={`nav-link ${pathname === '/admin/responses' ? 'active' : ''}`}>
                  <Database size={16} />
                  <span>Data Responden</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/analytics" className={`nav-link ${pathname === '/admin/analytics' ? 'active' : ''}`}>
                  <BarChart3 size={16} />
                  <span>Mesin Analitik</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/export" className={`nav-link ${pathname === '/admin/export' ? 'active' : ''}`}>
                  <Download size={16} />
                  <span>Ekspor Laporan</span>
                </Link>
              </li>
              <li>
                <button onClick={handleAdminLogout} className="btn btn-secondary btn-sm" style={{ marginLeft: 8 }}>
                  <LogOut size={14} />
                  <span>Keluar</span>
                </button>
              </li>
            </ul>
          )}

          {isSurveyPage && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {surveyorSession && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '6px 14px',
                  borderRadius: 20
                }}>
                  <CheckCircle2 size={16} color="#10b981" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#34d399' }}>
                    {surveyorSession.fullName} ({surveyorSession.school || 'Lapangan'})
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>|</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PIN: {surveyorSession.pin}</span>
                </div>
              )}
              {pathname === '/survey' && (
                <button onClick={handleSurveyorLogout} className="btn btn-secondary btn-sm">
                  <LogOut size={14} />
                  <span>Ganti PIN</span>
                </button>
              )}
            </div>
          )}

          {!isAdminPage && !isSurveyPage && (
            <ul className="nav-links">
              <li>
                <Link href="/survey/login" className="btn btn-primary btn-sm">
                  <KeyRound size={16} />
                  <span>Masuk Surveyor (PIN)</span>
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="btn btn-secondary btn-sm">
                  <Shield size={16} />
                  <span>Portal Peneliti / Admin</span>
                </Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
}

function ProjectNavSelector() {
  const { projectId, activeProject, projects, switchProject } = useActiveProject();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="btn btn-secondary btn-sm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(79, 70, 229, 0.12)',
          border: '1px solid rgba(79, 70, 229, 0.35)',
          color: '#e0e7ff',
          padding: '6px 12px',
          borderRadius: 8
        }}
      >
        <Layers size={14} color="#818cf8" />
        <span style={{
          maxWidth: 160,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontWeight: 700,
          fontSize: '0.78rem'
        }}>
          {activeProject ? activeProject.project_name : 'Pilih Proyek Riset'}
        </span>
        <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}
          />
          <div
            className="glass-card animate-scale-in"
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              width: 280,
              background: '#0f172a',
              border: '1px solid var(--border-subtle)',
              padding: '8px',
              zIndex: 101,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
              borderRadius: 10
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '6px 8px' }}>
              PILIH RISET AKTIF ({projects.length})
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {projects.map(p => {
                const isSelected = p.id === projectId;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      switchProject(p.id);
                      setOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(79, 70, 229, 0.2)' : 'transparent',
                      border: isSelected ? '1px solid rgba(79, 70, 229, 0.3)' : '1px solid transparent',
                      color: isSelected ? '#a5b4fc' : 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, lineHeight: 1.2 }}>
                        {p.project_name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.province} • {p.total_responses || 0}/{p.target_sample || 400}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 size={14} color="#818cf8" />}
                  </button>
                );
              })}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: 6, paddingTop: 6 }}>
              <Link
                href="/admin/projects"
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: '0.78rem',
                  color: 'var(--primary-color)',
                  fontWeight: 600,
                  padding: '6px 8px',
                  textDecoration: 'none',
                  borderRadius: 6
                }}
              >
                <FolderPlus size={14} />
                <span>+ Kelola &amp; Buat Riset Baru</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
