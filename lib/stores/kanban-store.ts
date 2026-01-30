import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { TaskStatus, TaskPriority } from './task-store';

// View mode types
export type ViewMode = 'compact' | 'expanded';

// Sort options
export type SortField = 'priority' | 'dueDate' | 'createdAt' | 'updatedAt' | 'title';
export type SortDirection = 'asc' | 'desc';

// Column configuration
export interface ColumnConfig {
  id: TaskStatus;
  title: string;
  visible: boolean;
  collapsed: boolean;
  color: string;
  limit?: number; // WIP limit
}

// Filter preset
export interface FilterPreset {
  id: string;
  name: string;
  filters: KanbanFilters;
}

// Kanban-specific filters
export interface KanbanFilters {
  priorities: TaskPriority[];
  labels: string[];
  assignedAgents: string[];
  projectId?: string;
  showSubtasks: boolean;
  dueDateRange?: {
    start?: string;
    end?: string;
  };
  searchQuery: string;
}

// Kanban store state interface
interface KanbanState {
  // Column configuration
  columns: ColumnConfig[];

  // View preferences
  viewMode: ViewMode;
  showEmptyColumns: boolean;
  showTaskCount: boolean;
  showProgress: boolean;
  cardSize: 'small' | 'medium' | 'large';

  // Sorting
  sortField: SortField;
  sortDirection: SortDirection;

  // Filters
  filters: KanbanFilters;
  filterPresets: FilterPreset[];
  activePresetId: string | null;

  // UI state
  isDragging: boolean;
  draggedTaskId: string | null;

  // Column actions
  setColumnVisibility: (columnId: TaskStatus, visible: boolean) => void;
  setColumnCollapsed: (columnId: TaskStatus, collapsed: boolean) => void;
  reorderColumns: (startIndex: number, endIndex: number) => void;
  setColumnLimit: (columnId: TaskStatus, limit: number | undefined) => void;
  setColumnColor: (columnId: TaskStatus, color: string) => void;
  resetColumns: () => void;

  // View actions
  setViewMode: (mode: ViewMode) => void;
  toggleShowEmptyColumns: () => void;
  toggleShowTaskCount: () => void;
  toggleShowProgress: () => void;
  setCardSize: (size: 'small' | 'medium' | 'large') => void;

  // Sort actions
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;

  // Filter actions
  setFilters: (filters: Partial<KanbanFilters>) => void;
  clearFilters: () => void;
  togglePriorityFilter: (priority: TaskPriority) => void;
  toggleLabelFilter: (label: string) => void;
  toggleAgentFilter: (agentId: string) => void;
  setSearchQuery: (query: string) => void;
  setProjectFilter: (projectId: string | undefined) => void;
  setDueDateRange: (range: { start?: string; end?: string } | undefined) => void;

  // Preset actions
  saveFilterPreset: (name: string) => FilterPreset;
  loadFilterPreset: (presetId: string) => void;
  deleteFilterPreset: (presetId: string) => void;
  updateFilterPreset: (presetId: string, updates: Partial<Omit<FilterPreset, 'id'>>) => void;

  // Drag state actions
  setDragging: (isDragging: boolean, taskId?: string | null) => void;

  // Getters
  getVisibleColumns: () => ColumnConfig[];
  getColumnById: (id: TaskStatus) => ColumnConfig | undefined;
  isColumnAtLimit: (columnId: TaskStatus, currentCount: number) => boolean;
}

// Generate unique ID
const generateId = (): string => {
  return `preset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    visible: true,
    collapsed: false,
    color: '#6B7280', // gray
  },
  {
    id: 'todo',
    title: 'To Do',
    visible: true,
    collapsed: false,
    color: '#3B82F6', // blue
  },
  {
    id: 'inProgress',
    title: 'In Progress',
    visible: true,
    collapsed: false,
    color: '#F59E0B', // amber
    limit: 5, // Default WIP limit
  },
  {
    id: 'review',
    title: 'Review',
    visible: true,
    collapsed: false,
    color: '#8B5CF6', // violet
    limit: 3,
  },
  {
    id: 'done',
    title: 'Done',
    visible: true,
    collapsed: false,
    color: '#10B981', // green
  },
];

// Default filters
const DEFAULT_FILTERS: KanbanFilters = {
  priorities: [],
  labels: [],
  assignedAgents: [],
  projectId: undefined,
  showSubtasks: true,
  dueDateRange: undefined,
  searchQuery: '',
};

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      // Initial state
      columns: DEFAULT_COLUMNS,
      viewMode: 'expanded',
      showEmptyColumns: true,
      showTaskCount: true,
      showProgress: true,
      cardSize: 'medium',
      sortField: 'priority',
      sortDirection: 'desc',
      filters: DEFAULT_FILTERS,
      filterPresets: [],
      activePresetId: null,
      isDragging: false,
      draggedTaskId: null,

      // Set column visibility
      setColumnVisibility: (columnId, visible) => {
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, visible } : col
          ),
        }));
      },

      // Set column collapsed state
      setColumnCollapsed: (columnId, collapsed) => {
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, collapsed } : col
          ),
        }));
      },

      // Reorder columns
      reorderColumns: (startIndex, endIndex) => {
        set((state) => {
          const newColumns = [...state.columns];
          const [removed] = newColumns.splice(startIndex, 1);
          newColumns.splice(endIndex, 0, removed);
          return { columns: newColumns };
        });
      },

      // Set WIP limit for column
      setColumnLimit: (columnId, limit) => {
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, limit } : col
          ),
        }));
      },

      // Set column color
      setColumnColor: (columnId, color) => {
        set((state) => ({
          columns: state.columns.map((col) =>
            col.id === columnId ? { ...col, color } : col
          ),
        }));
      },

      // Reset columns to default
      resetColumns: () => {
        set({ columns: DEFAULT_COLUMNS });
      },

      // Set view mode
      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      // Toggle show empty columns
      toggleShowEmptyColumns: () => {
        set((state) => ({ showEmptyColumns: !state.showEmptyColumns }));
      },

      // Toggle show task count
      toggleShowTaskCount: () => {
        set((state) => ({ showTaskCount: !state.showTaskCount }));
      },

      // Toggle show progress
      toggleShowProgress: () => {
        set((state) => ({ showProgress: !state.showProgress }));
      },

      // Set card size
      setCardSize: (size) => {
        set({ cardSize: size });
      },

      // Set sort field
      setSortField: (field) => {
        set({ sortField: field });
      },

      // Set sort direction
      setSortDirection: (direction) => {
        set({ sortDirection: direction });
      },

      // Toggle sort direction
      toggleSortDirection: () => {
        set((state) => ({
          sortDirection: state.sortDirection === 'asc' ? 'desc' : 'asc',
        }));
      },

      // Set filters
      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
          activePresetId: null, // Clear active preset when manually changing filters
        }));
      },

      // Clear all filters
      clearFilters: () => {
        set({ filters: DEFAULT_FILTERS, activePresetId: null });
      },

      // Toggle priority filter
      togglePriorityFilter: (priority) => {
        set((state) => {
          const priorities = state.filters.priorities.includes(priority)
            ? state.filters.priorities.filter((p) => p !== priority)
            : [...state.filters.priorities, priority];
          return {
            filters: { ...state.filters, priorities },
            activePresetId: null,
          };
        });
      },

      // Toggle label filter
      toggleLabelFilter: (label) => {
        set((state) => {
          const labels = state.filters.labels.includes(label)
            ? state.filters.labels.filter((l) => l !== label)
            : [...state.filters.labels, label];
          return {
            filters: { ...state.filters, labels },
            activePresetId: null,
          };
        });
      },

      // Toggle agent filter
      toggleAgentFilter: (agentId) => {
        set((state) => {
          const assignedAgents = state.filters.assignedAgents.includes(agentId)
            ? state.filters.assignedAgents.filter((a) => a !== agentId)
            : [...state.filters.assignedAgents, agentId];
          return {
            filters: { ...state.filters, assignedAgents },
            activePresetId: null,
          };
        });
      },

      // Set search query
      setSearchQuery: (query) => {
        set((state) => ({
          filters: { ...state.filters, searchQuery: query },
        }));
      },

      // Set project filter
      setProjectFilter: (projectId) => {
        set((state) => ({
          filters: { ...state.filters, projectId },
          activePresetId: null,
        }));
      },

      // Set due date range filter
      setDueDateRange: (range) => {
        set((state) => ({
          filters: { ...state.filters, dueDateRange: range },
          activePresetId: null,
        }));
      },

      // Save current filters as a preset
      saveFilterPreset: (name) => {
        const preset: FilterPreset = {
          id: generateId(),
          name,
          filters: { ...get().filters },
        };

        set((state) => ({
          filterPresets: [...state.filterPresets, preset],
          activePresetId: preset.id,
        }));

        return preset;
      },

      // Load a filter preset
      loadFilterPreset: (presetId) => {
        const preset = get().filterPresets.find((p) => p.id === presetId);
        if (preset) {
          set({
            filters: { ...preset.filters },
            activePresetId: presetId,
          });
        }
      },

      // Delete a filter preset
      deleteFilterPreset: (presetId) => {
        set((state) => ({
          filterPresets: state.filterPresets.filter((p) => p.id !== presetId),
          activePresetId: state.activePresetId === presetId ? null : state.activePresetId,
        }));
      },

      // Update a filter preset
      updateFilterPreset: (presetId, updates) => {
        set((state) => ({
          filterPresets: state.filterPresets.map((preset) =>
            preset.id === presetId ? { ...preset, ...updates } : preset
          ),
        }));
      },

      // Set dragging state
      setDragging: (isDragging, taskId = null) => {
        set({ isDragging, draggedTaskId: taskId });
      },

      // Get visible columns in order
      getVisibleColumns: () => {
        return get().columns.filter((col) => col.visible);
      },

      // Get column by ID
      getColumnById: (id) => {
        return get().columns.find((col) => col.id === id);
      },

      // Check if column is at WIP limit
      isColumnAtLimit: (columnId, currentCount) => {
        const column = get().columns.find((col) => col.id === columnId);
        if (!column || column.limit === undefined) return false;
        return currentCount >= column.limit;
      },
    }),
    {
      name: 'moltbot-kanban-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        columns: state.columns,
        viewMode: state.viewMode,
        showEmptyColumns: state.showEmptyColumns,
        showTaskCount: state.showTaskCount,
        showProgress: state.showProgress,
        cardSize: state.cardSize,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        filters: state.filters,
        filterPresets: state.filterPresets,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useVisibleColumns = () =>
  useKanbanStore((state) => state.columns.filter((col) => col.visible));

export const useKanbanFilters = () =>
  useKanbanStore((state) => state.filters);

export const useViewMode = () =>
  useKanbanStore((state) => state.viewMode);

export const useIsDragging = () =>
  useKanbanStore((state) => state.isDragging);

// Helper to check if any filters are active
export const useHasActiveFilters = () =>
  useKanbanStore((state) => {
    const { filters } = state;
    return (
      filters.priorities.length > 0 ||
      filters.labels.length > 0 ||
      filters.assignedAgents.length > 0 ||
      filters.projectId !== undefined ||
      filters.dueDateRange !== undefined ||
      filters.searchQuery !== ''
    );
  });
