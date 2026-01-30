import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Task status types for kanban workflow
export type TaskStatus = 'backlog' | 'todo' | 'inProgress' | 'review' | 'done';

// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

// Subtask interface
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

// Main Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  projectId?: string;
  projectName?: string;
  assignedAgent?: string;
  agentRunId?: string;  // MoltBot run ID for live tracking
  progress: number;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  labels: string[];
  subtasks: Subtask[];
}

// Filter options interface
export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  projectId?: string;
  priority?: TaskPriority | TaskPriority[];
  assignedAgent?: string;
  labels?: string[];
  searchQuery?: string;
}

// Task store state interface
interface TaskState {
  tasks: Task[];
  filters: TaskFilters;

  // Task CRUD actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;

  // Kanban actions
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex?: number) => void;
  reorderTasks: (status: TaskStatus, startIndex: number, endIndex: number) => void;

  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // Label actions
  addLabel: (taskId: string, label: string) => void;
  removeLabel: (taskId: string, label: string) => void;

  // Filter actions
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;

  // Agent integration actions
  assignAgentToTask: (taskId: string, agentRunId: string, agentType?: string) => void;
  updateTaskProgress: (taskId: string, progress: number) => void;
  completeAgentTask: (taskId: string) => void;
  failAgentTask: (taskId: string, error?: string) => void;
  findTaskByRunId: (runId: string) => Task | undefined;

  // Bulk actions
  clearAllTasks: () => void;

  // Getters
  getTaskById: (id: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getFilteredTasks: () => Task[];
  getAllLabels: () => string[];
}

// Generate unique ID
const generateId = (): string => {
  return `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Generate subtask ID
const generateSubtaskId = (): string => {
  return `subtask_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Get current ISO timestamp
const getTimestamp = (): string => new Date().toISOString();

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      filters: {},

      // Add a new task
      addTask: (taskData) => {
        const newTask: Task = {
          ...taskData,
          id: generateId(),
          progress: taskData.progress ?? 0,
          createdAt: getTimestamp(),
          updatedAt: getTimestamp(),
        };

        set((state) => ({
          tasks: [...state.tasks, newTask],
        }));

        return newTask;
      },

      // Update an existing task
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id
              ? { ...task, ...updates, updatedAt: getTimestamp() }
              : task
          ),
        }));
      },

      // Delete a task
      deleteTask: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      // Move task to a new status (kanban column) with optional position
      moveTask: (taskId, newStatus, newIndex) => {
        set((state) => {
          const taskIndex = state.tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return state;

          const task = state.tasks[taskIndex];
          const updatedTask = {
            ...task,
            status: newStatus,
            updatedAt: getTimestamp(),
          };

          // Remove task from current position
          const tasksWithoutMoved = state.tasks.filter((t) => t.id !== taskId);

          if (newIndex !== undefined) {
            // Get tasks in the target status
            const tasksInTargetStatus = tasksWithoutMoved.filter(
              (t) => t.status === newStatus
            );
            const tasksNotInTargetStatus = tasksWithoutMoved.filter(
              (t) => t.status !== newStatus
            );

            // Insert at specific position within target status
            tasksInTargetStatus.splice(newIndex, 0, updatedTask);

            // Reconstruct tasks array maintaining order
            const newTasks: Task[] = [];
            const statusOrder: TaskStatus[] = ['backlog', 'todo', 'inProgress', 'review', 'done'];

            for (const status of statusOrder) {
              if (status === newStatus) {
                newTasks.push(...tasksInTargetStatus);
              } else {
                newTasks.push(...tasksNotInTargetStatus.filter((t) => t.status === status));
              }
            }

            return { tasks: newTasks };
          } else {
            // Just append to end
            return { tasks: [...tasksWithoutMoved, updatedTask] };
          }
        });
      },

      // Reorder tasks within the same status column
      reorderTasks: (status, startIndex, endIndex) => {
        set((state) => {
          const statusTasks = state.tasks.filter((t) => t.status === status);
          const otherTasks = state.tasks.filter((t) => t.status !== status);

          // Reorder within status
          const [movedTask] = statusTasks.splice(startIndex, 1);
          statusTasks.splice(endIndex, 0, {
            ...movedTask,
            updatedAt: getTimestamp(),
          });

          // Reconstruct maintaining status grouping
          const statusOrder: TaskStatus[] = ['backlog', 'todo', 'inProgress', 'review', 'done'];
          const newTasks: Task[] = [];

          for (const s of statusOrder) {
            if (s === status) {
              newTasks.push(...statusTasks);
            } else {
              newTasks.push(...otherTasks.filter((t) => t.status === s));
            }
          }

          return { tasks: newTasks };
        });
      },

      // Add a subtask to a task
      addSubtask: (taskId, title) => {
        const newSubtask: Subtask = {
          id: generateSubtaskId(),
          title,
          completed: false,
        };

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: [...task.subtasks, newSubtask],
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Toggle subtask completion
      toggleSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.map((st) =>
                    st.id === subtaskId ? { ...st, completed: !st.completed } : st
                  ),
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Delete a subtask
      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Add label to task
      addLabel: (taskId, label) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId && !task.labels.includes(label)
              ? {
                  ...task,
                  labels: [...task.labels, label],
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Remove label from task
      removeLabel: (taskId, label) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  labels: task.labels.filter((l) => l !== label),
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Set filter options
      setFilters: (filters) => {
        set({ filters });
      },

      // Clear all filters
      clearFilters: () => {
        set({ filters: {} });
      },

      // =========================================================================
      // Agent Integration - Live Updates from MoltBot
      // =========================================================================

      // Assign an agent to a task (starts execution)
      assignAgentToTask: (taskId, agentRunId, agentType) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'inProgress' as TaskStatus,
                  assignedAgent: agentType || task.assignedAgent,
                  agentRunId,
                  progress: 0,
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Update task progress from agent
      updateTaskProgress: (taskId, progress) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, progress, updatedAt: getTimestamp() }
              : task
          ),
        }));
      },

      // Mark task as complete (moves to review)
      completeAgentTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'review' as TaskStatus,
                  progress: 100,
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Mark task as failed
      failAgentTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? {
                  ...task,
                  status: 'backlog' as TaskStatus, // Move back to backlog on failure
                  updatedAt: getTimestamp(),
                }
              : task
          ),
        }));
      },

      // Find task by MoltBot run ID
      findTaskByRunId: (runId) => {
        return get().tasks.find((task) => task.agentRunId === runId);
      },

      // Clear all tasks
      clearAllTasks: () => {
        set({ tasks: [], filters: {} });
      },

      // Get task by ID
      getTaskById: (id) => {
        return get().tasks.find((task) => task.id === id);
      },

      // Get tasks by status
      getTasksByStatus: (status) => {
        return get().tasks.filter((task) => task.status === status);
      },

      // Get tasks by project
      getTasksByProject: (projectId) => {
        return get().tasks.filter((task) => task.projectId === projectId);
      },

      // Get filtered tasks based on current filters
      getFilteredTasks: () => {
        const { tasks, filters } = get();

        return tasks.filter((task) => {
          // Status filter
          if (filters.status) {
            const statuses = Array.isArray(filters.status)
              ? filters.status
              : [filters.status];
            if (!statuses.includes(task.status)) return false;
          }

          // Project filter
          if (filters.projectId && task.projectId !== filters.projectId) {
            return false;
          }

          // Priority filter
          if (filters.priority) {
            const priorities = Array.isArray(filters.priority)
              ? filters.priority
              : [filters.priority];
            if (!priorities.includes(task.priority)) return false;
          }

          // Assigned agent filter
          if (filters.assignedAgent && task.assignedAgent !== filters.assignedAgent) {
            return false;
          }

          // Labels filter (task must have all specified labels)
          if (filters.labels && filters.labels.length > 0) {
            const hasAllLabels = filters.labels.every((label) =>
              task.labels.includes(label)
            );
            if (!hasAllLabels) return false;
          }

          // Search query filter
          if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(query);
            const matchesDescription = task.description.toLowerCase().includes(query);
            if (!matchesTitle && !matchesDescription) return false;
          }

          return true;
        });
      },

      // Get all unique labels across all tasks
      getAllLabels: () => {
        const { tasks } = get();
        const labelsSet = new Set<string>();
        tasks.forEach((task) => {
          task.labels.forEach((label) => labelsSet.add(label));
        });
        return Array.from(labelsSet).sort();
      },
    }),
    {
      name: 'moltbot-task-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tasks: state.tasks,
        filters: state.filters,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useTasksByStatus = (status: TaskStatus) =>
  useTaskStore((state) => state.tasks.filter((t) => t.status === status));

export const useTasksByProject = (projectId: string) =>
  useTaskStore((state) => state.tasks.filter((t) => t.projectId === projectId));

export const useFilteredTasks = () =>
  useTaskStore((state) => state.getFilteredTasks());
