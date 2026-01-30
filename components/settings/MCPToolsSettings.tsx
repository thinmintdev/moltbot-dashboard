"use client"

import { useState } from "react"
import classNames from "classnames"
import {
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Package,
  Search,
  Activity,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { Switch } from "./Switch"
import { FormInput } from "./FormInput"
import { SectionHeader, SectionCard } from "./SectionHeader"
import { MCPTool, MCPToolStatus } from "./types"

interface MCPToolsSettingsProps {
  tools: MCPTool[]
  onToggleTool: (toolId: string, enabled: boolean) => void
  onInstallTool: (source: string, type: "npm" | "url") => void
  onUninstallTool: (toolId: string) => void
  onConfigureTool: (toolId: string) => void
  onHealthCheck: (toolId: string) => void
  onRefreshAll: () => void
}

export function MCPToolsSettings({
  tools,
  onToggleTool,
  onInstallTool,
  onUninstallTool,
  onConfigureTool,
  onHealthCheck,
  onRefreshAll,
}: MCPToolsSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installSource, setInstallSource] = useState("")
  const [installType, setInstallType] = useState<"npm" | "url">("npm")
  const [expandedTool, setExpandedTool] = useState<string | null>(null)

  const filteredTools = tools.filter(
    (tool) =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getStatusConfig = (status: MCPToolStatus) => {
    switch (status) {
      case "active":
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: "text-emerald-400",
          bgColor: "bg-emerald-500/20",
          label: "Active",
        }
      case "inactive":
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: "text-theme-400",
          bgColor: "bg-theme-700",
          label: "Inactive",
        }
      case "error":
        return {
          icon: <AlertCircle className="w-4 h-4" />,
          color: "text-rose-400",
          bgColor: "bg-rose-500/20",
          label: "Error",
        }
    }
  }

  const handleInstall = () => {
    if (installSource.trim()) {
      onInstallTool(installSource.trim(), installType)
      setInstallSource("")
      setShowInstallModal(false)
    }
  }

  const stats = {
    total: tools.length,
    active: tools.filter((t) => t.status === "active").length,
    inactive: tools.filter((t) => t.status === "inactive").length,
    error: tools.filter((t) => t.status === "error").length,
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-theme-800/50 border border-theme-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-white">{stats.total}</div>
          <div className="text-xs text-theme-400">Total Tools</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-emerald-400">{stats.active}</div>
          <div className="text-xs text-emerald-400/70">Active</div>
        </div>
        <div className="bg-theme-800/50 border border-theme-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-theme-400">{stats.inactive}</div>
          <div className="text-xs text-theme-500">Inactive</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-rose-400">{stats.error}</div>
          <div className="text-xs text-rose-400/70">Errors</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-400" />
          <input
            type="text"
            placeholder="Search MCP tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-theme-800 border border-theme-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onRefreshAll}>
          <RefreshCw className="w-4 h-4" />
        </Button>
        <Button variant="primary" size="sm" onClick={() => setShowInstallModal(true)}>
          <Plus className="w-4 h-4" />
          Install MCP
        </Button>
      </div>

      {/* Tools List */}
      <div className="space-y-3">
        {filteredTools.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-theme-600 mx-auto mb-3" />
            <p className="text-theme-400">
              {searchQuery ? "No tools match your search" : "No MCP tools installed"}
            </p>
            {!searchQuery && (
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setShowInstallModal(true)}
              >
                <Plus className="w-4 h-4" />
                Install Your First Tool
              </Button>
            )}
          </div>
        ) : (
          filteredTools.map((tool) => {
            const statusConfig = getStatusConfig(tool.status)
            const isExpanded = expandedTool === tool.id

            return (
              <SectionCard key={tool.id} className="p-0">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Toggle */}
                    <div className="pt-1">
                      <Switch
                        checked={tool.enabled}
                        onCheckedChange={(checked) => onToggleTool(tool.id, checked)}
                        size="sm"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-white truncate">
                          {tool.name}
                        </h4>
                        <span className="text-xs text-theme-500">v{tool.version}</span>
                        <span
                          className={classNames(
                            "px-2 py-0.5 rounded-full text-xs flex items-center gap-1",
                            statusConfig.bgColor,
                            statusConfig.color
                          )}
                        >
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </div>
                      <p className="text-xs text-theme-400 line-clamp-2">
                        {tool.description}
                      </p>
                      {tool.status === "error" && tool.errorMessage && (
                        <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {tool.errorMessage}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onHealthCheck(tool.id)}
                        className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                        title="Health Check"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      {tool.configurable && (
                        <button
                          onClick={() => onConfigureTool(tool.id)}
                          className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                          title="Configure"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() =>
                          setExpandedTool(isExpanded ? null : tool.id)
                        }
                        className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                        title="Details"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onUninstallTool(tool.id)}
                        className="p-2 text-theme-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Uninstall"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-theme-700">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-theme-400">Source:</span>
                          <span className="ml-2 text-white capitalize">
                            {tool.source}
                          </span>
                          {tool.sourceUrl && (
                            <span className="ml-1 text-theme-500 text-xs">
                              ({tool.sourceUrl})
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-theme-400">Last Health Check:</span>
                          <span className="ml-2 text-white">
                            {tool.lastHealthCheck
                              ? new Date(tool.lastHealthCheck).toLocaleString()
                              : "Never"}
                          </span>
                        </div>
                      </div>
                      {tool.capabilities.length > 0 && (
                        <div className="mt-3">
                          <span className="text-theme-400 text-sm">Capabilities:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {tool.capabilities.map((cap) => (
                              <span
                                key={cap}
                                className="px-2 py-0.5 bg-theme-700 rounded text-xs text-theme-300"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )
          })
        )}
      </div>

      {/* Install Modal */}
      <Modal
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Install MCP Tool"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Installation Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setInstallType("npm")}
                className={classNames(
                  "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  installType === "npm"
                    ? "border-theme-500 bg-theme-500/20 text-white"
                    : "border-theme-700 bg-theme-800 text-theme-400 hover:border-theme-600"
                )}
              >
                NPM Package
              </button>
              <button
                onClick={() => setInstallType("url")}
                className={classNames(
                  "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                  installType === "url"
                    ? "border-theme-500 bg-theme-500/20 text-white"
                    : "border-theme-700 bg-theme-800 text-theme-400 hover:border-theme-600"
                )}
              >
                URL / Git
              </button>
            </div>
          </div>

          <FormInput
            label={installType === "npm" ? "Package Name" : "URL"}
            value={installSource}
            onChange={setInstallSource}
            placeholder={
              installType === "npm"
                ? "@modelcontextprotocol/server-filesystem"
                : "https://github.com/user/mcp-tool.git"
            }
            description={
              installType === "npm"
                ? "Enter the npm package name"
                : "Enter a Git URL or direct download link"
            }
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button variant="ghost" onClick={() => setShowInstallModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleInstall}
              disabled={!installSource.trim()}
            >
              <Plus className="w-4 h-4" />
              Install
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
