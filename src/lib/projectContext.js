'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'survei_active_project_id';
const DEFAULT_PROJECT_ID = '';

export function getStoredProjectId() {
  if (typeof window === 'undefined') return DEFAULT_PROJECT_ID;
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_PROJECT_ID;
}

export function setStoredProjectId(id) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: id } }));
}

export function notifyProjectsUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('projectsUpdated'));
}

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const [projectId, setProjectId] = useState(getStoredProjectId);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchProjectsList = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
        if (data.projects.length === 0) {
          setProjectId('');
          if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
        } else {
          setProjectId(prevId => {
            const exists = data.projects.some(p => p.id === prevId);
            if (!exists) {
              const firstId = data.projects[0].id;
              if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, firstId);
              return firstId;
            }
            return prevId;
          });
        }
      }
    } catch (err) {
      console.error('Error loading projects list:', err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectsList();

    const handleProjectChanged = (e) => {
      if (e.detail?.projectId) {
        setProjectId(e.detail.projectId);
      }
    };

    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setProjectId(e.newValue);
      }
    };

    const handleGlobalRefresh = () => {
      fetchProjectsList();
    };

    window.addEventListener('projectChanged', handleProjectChanged);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('projectsUpdated', handleGlobalRefresh);

    return () => {
      window.removeEventListener('projectChanged', handleProjectChanged);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('projectsUpdated', handleGlobalRefresh);
    };
  }, [fetchProjectsList]);

  const switchProject = useCallback((newId) => {
    setProjectId(newId);
    setStoredProjectId(newId);
  }, []);

  const refreshProjects = useCallback(async () => {
    await fetchProjectsList();
    notifyProjectsUpdated();
  }, [fetchProjectsList]);

  const activeProject = projects.find(p => p.id === projectId) || projects[0] || null;

  const value = {
    projectId,
    activeProject,
    projects,
    loadingProjects,
    switchProject,
    refreshProjects
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Hook to consume active project context across all components and pages
 */
export function useActiveProject() {
  const context = useContext(ProjectContext);
  if (context) {
    return context;
  }

  // Fallback standalone hook if not wrapped inside ProjectProvider
  const [projectId, setProjectId] = useState(getStoredProjectId);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const fetchProjectsList = useCallback(async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setProjects(data.projects);
        if (data.projects.length === 0) {
          setProjectId('');
        } else {
          setProjectId(prevId => {
            const exists = data.projects.some(p => p.id === prevId);
            return exists ? prevId : data.projects[0].id;
          });
        }
      }
    } catch (err) {
      console.error('Error loading projects list (fallback):', err);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    fetchProjectsList();

    const handleProjectChanged = (e) => {
      if (e.detail?.projectId) setProjectId(e.detail.projectId);
    };
    const handleGlobalRefresh = () => {
      fetchProjectsList();
    };

    window.addEventListener('projectChanged', handleProjectChanged);
    window.addEventListener('projectsUpdated', handleGlobalRefresh);
    return () => {
      window.removeEventListener('projectChanged', handleProjectChanged);
      window.removeEventListener('projectsUpdated', handleGlobalRefresh);
    };
  }, [fetchProjectsList]);

  const switchProject = useCallback((newId) => {
    setProjectId(newId);
    setStoredProjectId(newId);
  }, []);

  const refreshProjects = useCallback(async () => {
    await fetchProjectsList();
    notifyProjectsUpdated();
  }, [fetchProjectsList]);

  const activeProject = projects.find(p => p.id === projectId) || projects[0] || null;

  return {
    projectId,
    activeProject,
    projects,
    loadingProjects,
    switchProject,
    refreshProjects
  };
}

