"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Settings,
  ChevronDown,
  Activity,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface NavbarProps {
  projects: Project[];
  activeProjectId: string | null;
  onProjectChange: (projectId: string) => void;
  onNewProject: () => void;
  onNewTask: () => void;
  onOpenSettings: () => void;
  isConnected: boolean;
  currentModel: string | null;
}

export function Navbar({
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

  return (
    <nav className="h-12 bg-[#111113] border-b border-[#27272a] flex items-center px-4 gap-2">
      {/* Logo - Click to go home */}
      <button
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

      {/* Settings button */}
      <button
        onClick={onOpenSettings}
        className="p-2 rounded-md hover:bg-[#27272a] transition-colors text-[#71717a] hover:text-[#fafafa]"
      >
        <Settings size={18} />
      </button>

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
