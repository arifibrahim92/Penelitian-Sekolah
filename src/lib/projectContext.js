'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'survei_active_project_id';
const DEFAULT_PROJECT_ID = 'PRJ-2026-JB-001';

export function getStoredProjectId() {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_ID;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PROJECT_ID;
}

export function setStoredProjectId(id) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: id } }));
}

/**
 * Hook to manage active project across admin pages
 */
export function useActiveProject() {
  const [projectId, setProjectId] = useState(getStoredProjectId);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchProjectsList = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
        // If stored projectId is not in list, fallback to first project
        const exists = data.projects.some(p => p.id === projectId);
        if (!exists && data.projects.length > 0) {
          const firstId = data.projects[0].id;
          setProjectId(firstId);
          localStorage.setItem(STORAGE_KEY, firstId);
        }
      }
    } catch (err) {
      console.error('Error loading projects list:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjectsList();

    const handleProjectChanged = (e) => {
      if (e.detail?.projectId) {
        setProjectId(e.detail.projectId);
      }
    };

    window.addEventListener('projectChanged', handleProjectChanged);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setProjectId(e.newValue);
      }
    });

    return () => {
      window.removeEventListener('projectChanged', handleProjectChanged);
    };
  }, []);

  const switchProject = (newId) => {
    setProjectId(newId);
    setStoredProjectId(newId);
  };

  const activeProject = projects.find(p => p.id === projectId) || projects[0] || null;

  return {
    projectId,
    activeProject,
    projects,
    loadingProjects,
    switchProject,
    refreshProjects: fetchProjectsList
  };
}
