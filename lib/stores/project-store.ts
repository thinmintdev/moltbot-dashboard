import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Project status types
export type ProjectStatus = 'active' | 'paused' | 'archived' | 'completed';

// Project settings interface
export interface ProjectSettings {
  defaultModel: string;
  defaultAgent?: string;
  autoAssign: boolean; // Auto-assign tasks to agents
  webhooks?: string[];
}

// Project statistics interface
export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  activeAgents: number;
  lastActivity: string;
}

// Source type for projects
export type ProjectSourceType = 'local' | 'github';

// Project interface with AutoClaude-style workspace support
export interface Project {
  id: string;
  name: string;
  description: string;
  sourceType: ProjectSourceType; // Required: local directory or github
  path: string; // Local directory path
  repoUrl?: string; // Git remote URL
  githubOwner?: string; // GitHub owner/org
  githubRepo?: string; // GitHub repository name
  gitBranch?: string;
  status: ProjectStatus;

  // Project-specific settings
  settings: ProjectSettings;

  // Stats
  stats: ProjectStats;

  // Legacy task array for backwards compatibility
  tasks: string[]; // Array of task IDs

  createdAt: string;
  updatedAt: string;
  color: string;
  icon?: string;
}

// Project creation input
export type ProjectInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'tasks' | 'stats'> & {
  tasks?: string[];
  stats?: Partial<ProjectStats>;
};

// Project store state interface
interface ProjectState {
  projects: Project[];
  activeProjectId: string | null;

  // Project CRUD actions
  addProject: (project: ProjectInput) => Project;
  updateProject: (id: string, updates: Partial<Omit<Project, 'id' | 'createdAt'>>) => void;
  deleteProject: (id: string) => void;

  // Active project management
  setActiveProject: (id: string | null) => void;
  getActiveProject: () => Project | null;

  // Task association actions
  addTaskToProject: (projectId: string, taskId: string) => void;
  removeTaskFromProject: (projectId: string, taskId: string) => void;

  // Status actions
  setProjectStatus: (id: string, status: ProjectStatus) => void;
  archiveProject: (id: string) => void;

  // Settings actions
  updateProjectSettings: (id: string, settings: Partial<ProjectSettings>) => void;

  // Stats actions
  updateProjectStats: (id: string, stats: Partial<ProjectStats>) => void;
  incrementTaskCount: (projectId: string) => void;
  incrementCompletedTaskCount: (projectId: string) => void;
  updateActiveAgentCount: (projectId: string, count: number) => void;
  touchProjectActivity: (projectId: string) => void;

  // Git actions
  updateGitInfo: (id: string, repoUrl?: string, gitBranch?: string) => void;

  // Getters
  getProjectById: (id: string) => Project | undefined;
  getProjectsByStatus: (status: ProjectStatus) => Project[];
  getProjectTaskIds: (projectId: string) => string[];
  getProjectsByPath: (path: string) => Project[];
}

// Generate unique ID for projects
const generateProjectId = (): string => {
  return `proj_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString();

// Default project colors
export const PROJECT_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#84CC16', // lime
] as const;

// Default project settings
const getDefaultSettings = (): ProjectSettings => ({
  defaultModel: 'claude-3-opus',
  autoAssign: false,
});

// Default project stats
const getDefaultStats = (): ProjectStats => ({
  totalTasks: 0,
  completedTasks: 0,
  activeAgents: 0,
  lastActivity: getTimestamp(),
});

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      activeProjectId: null,

      // Add a new project
      addProject: (projectData) => {
        const newProject: Project = {
          ...projectData,
          id: generateProjectId(),
          tasks: projectData.tasks || [],
          settings: {
            ...getDefaultSettings(),
            ...projectData.settings,
          },
          stats: {
            ...getDefaultStats(),
            ...projectData.stats,
          },
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
          color: projectData.color || PROJECT_COLORS[get().projects.length % PROJECT_COLORS.length],
        };

        set((state) => ({
          projects: [...state.projects, newProject],
        }));

        return newProject;
      },

      // Update an existing project
      updateProject: (id, updates) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? { ...project, ...updates, updatedAt: getTimestamp() }
              : project
          ),
        }));
      },

      // Delete a project
      deleteProject: (id) => {
        set((state) => ({
          projects: state.projects.filter((project) => project.id !== id),
          // Clear active project if it was the deleted one
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        }));
      },

      // Set the active project
      setActiveProject: (id) => {
        set({ activeProjectId: id });
      },

      // Get the active project
      getActiveProject: () => {
        const { projects, activeProjectId } = get();
        if (!activeProjectId) return null;
        return projects.find((p) => p.id === activeProjectId) || null;
      },

      // Add a task ID to a project
      addTaskToProject: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId && !project.tasks.includes(taskId)
              ? {
                  ...project,
                  tasks: [...project.tasks, taskId],
                  stats: {
                    ...project.stats,
                    totalTasks: project.stats.totalTasks + 1,
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Remove a task ID from a project
      removeTaskFromProject: (projectId, taskId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  tasks: project.tasks.filter((id) => id !== taskId),
                  stats: {
                    ...project.stats,
                    totalTasks: Math.max(0, project.stats.totalTasks - 1),
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Set project status
      setProjectStatus: (id, status) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  status,
                  stats: {
                    ...project.stats,
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Archive a project (convenience method)
      archiveProject: (id) => {
        get().setProjectStatus(id, 'archived');
      },

      // Update project settings
      updateProjectSettings: (id, settings) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  settings: { ...project.settings, ...settings },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Update project stats
      updateProjectStats: (id, stats) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  stats: { ...project.stats, ...stats },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Increment total task count
      incrementTaskCount: (projectId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stats: {
                    ...project.stats,
                    totalTasks: project.stats.totalTasks + 1,
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Increment completed task count
      incrementCompletedTaskCount: (projectId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stats: {
                    ...project.stats,
                    completedTasks: project.stats.completedTasks + 1,
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Update active agent count
      updateActiveAgentCount: (projectId, count) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stats: {
                    ...project.stats,
                    activeAgents: count,
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Touch project activity timestamp
      touchProjectActivity: (projectId) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === projectId
              ? {
                  ...project,
                  stats: {
                    ...project.stats,
                    lastActivity: getTimestamp(),
                  },
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Update Git information
      updateGitInfo: (id, repoUrl, gitBranch) => {
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  repoUrl: repoUrl ?? project.repoUrl,
                  gitBranch: gitBranch ?? project.gitBranch,
                  updatedAt: getTimestamp(),
                }
              : project
          ),
        }));
      },

      // Get project by ID
      getProjectById: (id) => {
        return get().projects.find((project) => project.id === id);
      },

      // Get projects by status
      getProjectsByStatus: (status) => {
        return get().projects.filter((project) => project.status === status);
      },

      // Get task IDs for a project
      getProjectTaskIds: (projectId) => {
        const project = get().projects.find((p) => p.id === projectId);
        return project?.tasks || [];
      },

      // Get projects by path
      getProjectsByPath: (path) => {
        return get().projects.filter((project) => project.path === path);
      },
    }),
    {
      name: 'moltbot-project-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projects: state.projects,
        activeProjectId: state.activeProjectId,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useActiveProject = () =>
  useProjectStore((state) => {
    if (!state.activeProjectId) return null;
    return state.projects.find((p) => p.id === state.activeProjectId) || null;
  });

export const useActiveProjects = () =>
  useProjectStore((state) => state.projects.filter((p) => p.status === 'active'));

export const useProjectById = (id: string) =>
  useProjectStore((state) => state.projects.find((p) => p.id === id));

export const useProjectsByPath = (path: string) =>
  useProjectStore((state) => state.projects.filter((p) => p.path === path));

export const useProjectStats = (id: string) =>
  useProjectStore((state) => state.projects.find((p) => p.id === id)?.stats);
