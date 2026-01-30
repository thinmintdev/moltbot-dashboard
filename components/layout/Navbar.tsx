"use client";

import { useState } from "react";
import {
  LayoutGrid,
  Terminal,
  Sparkles,
  Map,
  Lightbulb,
  FileText,
  BookOpen,
  Wrench,
  GitBranch,
  CircleDot,
  GitPullRequest,
  Plus,
  Search,
  Settings,
  ChevronDown,
  Server,
  Activity,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export type ViewType =
  | "kanban"
  | "agents"
  | "insights"
  | "roadmap"
  | "ideation"
  | "changelog"
  | "context"
  | "mcp"
  | "worktrees"
  | "github-issues"
  | "github-prs"
  | "infrastructure";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface NavbarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  projects: Project[];
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  onNewProject: () => void;
  onNewTask: () => void;
  onOpenSettings: () => void;
  isConnected: boolean;
  currentModel: string | null;
}

// Project views - shown in main View dropdown
const projectViewOptions: { id: ViewType; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: "kanban", label: "Kanban Board", icon: <LayoutGrid size={16} />, shortcut: "K" },
  { id: "agents", label: "Agent Terminals", icon: <Terminal size={16} />, shortcut: "A" },
  { id: "insights", label: "Insights", icon: <Sparkles size={16} />, shortcut: "N" },
  { id: "roadmap", label: "Roadmap", icon: <Map size={16} />, shortcut: "D" },
  { id: "ideation", label: "Ideation", icon: <Lightbulb size={16} />, shortcut: "I" },
  { id: "changelog", label: "Changelog", icon: <FileText size={16} />, shortcut: "L" },
  { id: "context", label: "Context", icon: <BookOpen size={16} />, shortcut: "C" },
  { id: "worktrees", label: "Worktrees", icon: <GitBranch size={16} />, shortcut: "W" },
  { id: "github-issues", label: "GitHub Issues", icon: <CircleDot size={16} />, shortcut: "G" },
  { id: "github-prs", label: "GitHub PRs", icon: <GitPullRequest size={16} />, shortcut: "P" },
];

// Settings/System views - shown in Settings dropdown
const settingsViewOptions: { id: ViewType; label: string; icon: React.ReactNode; shortcut: string }[] = [
  { id: "mcp", label: "MCP Overview", icon: <Wrench size={16} />, shortcut: "M" },
  { id: "infrastructure", label: "Infrastructure", icon: <Server size={16} />, shortcut: "F" },
];

// All view options combined for lookup
const viewOptions = [...projectViewOptions, ...settingsViewOptions];

export function Navbar({
  currentView,
  onViewChange,
  projects,
  activeProjectId,
  onProjectChange,
  onNewProject,
  onNewTask,
  onOpenSettings,
  isConnected,
  currentModel,
}: NavbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);

  const activeProject = projects.find((p) => p.id === activeProjectId);
  const currentViewOption = viewOptions.find((v) => v.id === currentView);

  return (
    <nav className="h-12 bg-[#111113] border-b border-[#27272a] flex items-center px-4 gap-2">
      {/* Logo - Click to go home */}
      <button
        onClick={() => onViewChange("kanban")}
        className="flex items-center gap-2 mr-4 hover:opacity-80 transition-opacity"
      >
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg shadow-red-500/20">
          <Activity size={16} className="text-white" />
        </div>
        <span className="font-bold text-[#fafafa] tracking-tight">Molten</span>
      </button>

      {/* Projects Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] transition-colors text-sm">
            {activeProject && (
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeProject.color }}
              />
            )}
            <span className="text-[#fafafa]">
              {activeProject?.name || "Select Project"}
            </span>
            <ChevronDown size={14} className="text-[#71717a]" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-[#18181b] border border-[#27272a] rounded-lg p-1 shadow-xl z-50"
            sideOffset={5}
          >
            {projects.map((project) => (
              <DropdownMenu.Item
                key={project.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none"
                onSelect={() => onProjectChange(project.id)}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <span className="text-[#fafafa] text-sm">{project.name}</span>
                {project.id === activeProjectId && (
                  <span className="ml-auto text-orange-500">✓</span>
                )}
              </DropdownMenu.Item>
            ))}
            <DropdownMenu.Separator className="h-px bg-[#27272a] my-1" />
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none text-orange-500"
              onSelect={onNewProject}
            >
              <Plus size={14} />
              <span className="text-sm">New Project</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* View Dropdown - Project views only */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] transition-colors text-sm">
            {currentViewOption?.icon}
            <span className="text-[#fafafa]">{currentViewOption?.label || "View"}</span>
            <ChevronDown size={14} className="text-[#71717a]" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[220px] bg-[#18181b] border border-[#27272a] rounded-lg p-1 shadow-xl z-50 max-h-[400px] overflow-y-auto"
            sideOffset={5}
          >
            {projectViewOptions.map((option) => (
              <DropdownMenu.Item
                key={option.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none"
                onSelect={() => onViewChange(option.id)}
              >
                <span className="text-[#71717a]">{option.icon}</span>
                <span className="text-[#fafafa] text-sm flex-1">{option.label}</span>
                <span className="text-[#71717a] text-xs bg-[#27272a] px-1.5 py-0.5 rounded">
                  {option.shortcut}
                </span>
                {option.id === currentView && (
                  <span className="text-orange-500 ml-1">✓</span>
                )}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* New Task Button */}
      <button
        onClick={onNewTask}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 transition-all text-white text-sm font-medium shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
      >
        <Plus size={14} />
        <span>New Task</span>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#18181b] border border-[#27272a] hover:bg-[#27272a] transition-colors text-sm text-[#71717a]"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search...</span>
        <span className="hidden sm:inline text-xs bg-[#27272a] px-1.5 py-0.5 rounded">
          ⌘K
        </span>
      </button>

      {/* Model Indicator */}
      {currentModel && (
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 text-xs text-[#71717a]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span className="truncate max-w-[100px]">{currentModel}</span>
        </div>
      )}

      {/* Settings Dropdown */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 rounded-md hover:bg-[#27272a] transition-colors text-[#71717a] hover:text-[#fafafa]">
            <Settings size={18} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            className="min-w-[200px] bg-[#18181b] border border-[#27272a] rounded-lg p-1 shadow-xl z-50"
            sideOffset={5}
            align="end"
          >
            {/* System Views Section */}
            <DropdownMenu.Label className="px-3 py-1.5 text-xs text-[#71717a] font-medium">
              System
            </DropdownMenu.Label>
            {settingsViewOptions.map((option) => (
              <DropdownMenu.Item
                key={option.id}
                className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none"
                onSelect={() => onViewChange(option.id)}
              >
                <span className="text-[#71717a]">{option.icon}</span>
                <span className="text-[#fafafa] text-sm flex-1">{option.label}</span>
                <span className="text-[#71717a] text-xs bg-[#27272a] px-1.5 py-0.5 rounded">
                  {option.shortcut}
                </span>
                {option.id === currentView && (
                  <span className="text-orange-500 ml-1">✓</span>
                )}
              </DropdownMenu.Item>
            ))}

            <DropdownMenu.Separator className="h-px bg-[#27272a] my-1" />

            {/* App Settings */}
            <DropdownMenu.Label className="px-3 py-1.5 text-xs text-[#71717a] font-medium">
              Preferences
            </DropdownMenu.Label>
            <DropdownMenu.Item
              className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer hover:bg-[#27272a] outline-none"
              onSelect={onOpenSettings}
            >
              <span className="text-[#71717a]"><Settings size={16} /></span>
              <span className="text-[#fafafa] text-sm">App Settings</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {/* Connection Status */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#18181b] border border-[#27272a]">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
          }`}
        />
        <span className="text-xs text-[#71717a]">
          {isConnected ? "Connected" : "Offline"}
        </span>
      </div>
    </nav>
  );
}
