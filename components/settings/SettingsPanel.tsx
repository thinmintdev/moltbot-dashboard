"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  Settings,
  Puzzle,
  Sparkles,
  Link,
  Cpu,
  Wrench,
  Search,
  Save,
  X,
  AlertCircle,
} from "lucide-react"
import { Button } from "../ui/Button"
import { GeneralSettings } from "./GeneralSettings"
import { MCPToolsSettings } from "./MCPToolsSettings"
import { SkillsSettings } from "./SkillsSettings"
import { ConnectionsSettings } from "./ConnectionsSettings"
import { ModelsSettings } from "./ModelsSettings"
import { AdvancedSettings } from "./AdvancedSettings"
import {
  SettingsTab,
  GeneralSettings as GeneralSettingsType,
  MCPTool,
  Skill,
  Connection,
  Model,
  CustomModelProvider,
} from "./types"

interface SettingsPanelProps {
  // General settings
  generalSettings: GeneralSettingsType
  onGeneralSettingsChange: (settings: GeneralSettingsType) => void

  // MCP Tools
  mcpTools: MCPTool[]
  onToggleMCPTool: (toolId: string, enabled: boolean) => void
  onInstallMCPTool: (source: string, type: "npm" | "url") => void
  onUninstallMCPTool: (toolId: string) => void
  onConfigureMCPTool: (toolId: string) => void
  onMCPHealthCheck: (toolId: string) => void
  onRefreshMCPTools: () => void

  // Skills
  skills: Skill[]
  onToggleSkill: (skillId: string, enabled: boolean) => void
  onInstallSkill: (source: string) => void
  onCreateSkill: () => void
  onEditSkill: (skillId: string) => void
  onDeleteSkill: (skillId: string) => void
  onBrowseMoltHub: () => void

  // Connections
  connections: Connection[]
  onConnect: (type: Connection["type"]) => void
  onDisconnect: (connectionId: string) => void
  onTestConnection: (connectionId: string) => void
  onSyncConnection: (connectionId: string) => void
  onConfigureConnection: (connectionId: string, config: Record<string, unknown>) => void

  // Models
  models: Model[]
  customProviders: CustomModelProvider[]
  onSetDefaultModel: (modelId: string, scope: "global" | "project") => void
  onAddCustomProvider: (provider: Omit<CustomModelProvider, "id">) => void
  onRemoveCustomProvider: (providerId: string) => void
  onUpdateApiKey: (providerId: string, apiKey: string) => void
  onTestModelConnection: (modelId: string) => void
  costTrackingEnabled: boolean
  onToggleCostTracking: (enabled: boolean) => void

  // Advanced
  debugMode: boolean
  onToggleDebugMode: (enabled: boolean) => void
  telemetryEnabled: boolean
  onToggleTelemetry: (enabled: boolean) => void
  onExportSettings: () => void
  onImportSettings: (file: File) => void
  onResetSettings: () => void
  onClearCache: () => void
  onClearLogs: () => void

  // Save/Discard
  hasUnsavedChanges: boolean
  onSave: () => void
  onDiscard: () => void
}

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
  { id: "mcp-tools", label: "MCP Tools", icon: <Puzzle className="w-4 h-4" /> },
  { id: "skills", label: "Skills", icon: <Sparkles className="w-4 h-4" /> },
  { id: "connections", label: "Connections", icon: <Link className="w-4 h-4" /> },
  { id: "models", label: "Models", icon: <Cpu className="w-4 h-4" /> },
  { id: "advanced", label: "Advanced", icon: <Wrench className="w-4 h-4" /> },
]

// Searchable items for quick navigation
interface SearchableItem {
  tab: SettingsTab
  label: string
  keywords: string[]
}

const searchableItems: SearchableItem[] = [
  { tab: "general", label: "Theme", keywords: ["theme", "dark", "light", "appearance"] },
  { tab: "general", label: "Workspace Path", keywords: ["workspace", "path", "directory"] },
  { tab: "general", label: "Auto-save", keywords: ["autosave", "save", "interval"] },
  { tab: "general", label: "Notifications", keywords: ["notification", "alert", "sound"] },
  { tab: "general", label: "Agent Concurrency", keywords: ["agent", "concurrency", "limit", "parallel"] },
  { tab: "general", label: "Log Retention", keywords: ["log", "retention", "cleanup"] },
  { tab: "mcp-tools", label: "MCP Tools", keywords: ["mcp", "tool", "server", "install"] },
  { tab: "skills", label: "Skills", keywords: ["skill", "capability", "molthub"] },
  { tab: "connections", label: "GitHub", keywords: ["github", "git", "repository"] },
  { tab: "connections", label: "Google Workspace", keywords: ["google", "gmail", "calendar", "drive"] },
  { tab: "connections", label: "Notion", keywords: ["notion", "workspace", "documentation"] },
  { tab: "connections", label: "Obsidian", keywords: ["obsidian", "vault", "notes"] },
  { tab: "connections", label: "Linear", keywords: ["linear", "issues", "project"] },
  { tab: "connections", label: "Slack", keywords: ["slack", "webhook", "chat"] },
  { tab: "connections", label: "Discord", keywords: ["discord", "bot", "server"] },
  { tab: "models", label: "API Keys", keywords: ["api", "key", "anthropic", "openai", "google"] },
  { tab: "models", label: "Custom Provider", keywords: ["custom", "provider", "endpoint"] },
  { tab: "models", label: "Cost Tracking", keywords: ["cost", "tracking", "usage", "spending"] },
  { tab: "advanced", label: "Debug Mode", keywords: ["debug", "developer", "verbose"] },
  { tab: "advanced", label: "Telemetry", keywords: ["telemetry", "analytics", "usage"] },
  { tab: "advanced", label: "Export Settings", keywords: ["export", "backup", "json"] },
  { tab: "advanced", label: "Import Settings", keywords: ["import", "restore", "json"] },
  { tab: "advanced", label: "Clear Cache", keywords: ["cache", "clear", "storage"] },
  { tab: "advanced", label: "Reset Settings", keywords: ["reset", "default", "restore"] },
]

export function SettingsPanel(props: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general")
  const [searchQuery, setSearchQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)

  // Filter search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return searchableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(query) ||
        item.keywords.some((keyword) => keyword.includes(query))
    )
  }, [searchQuery])

  const handleSearchSelect = (item: SearchableItem) => {
    setActiveTab(item.tab)
    setSearchQuery("")
    setShowSearch(false)
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings
            settings={props.generalSettings}
            onChange={props.onGeneralSettingsChange}
          />
        )
      case "mcp-tools":
        return (
          <MCPToolsSettings
            tools={props.mcpTools}
            onToggleTool={props.onToggleMCPTool}
            onInstallTool={props.onInstallMCPTool}
            onUninstallTool={props.onUninstallMCPTool}
            onConfigureTool={props.onConfigureMCPTool}
            onHealthCheck={props.onMCPHealthCheck}
            onRefreshAll={props.onRefreshMCPTools}
          />
        )
      case "skills":
        return (
          <SkillsSettings
            skills={props.skills}
            onToggleSkill={props.onToggleSkill}
            onInstallSkill={props.onInstallSkill}
            onCreateSkill={props.onCreateSkill}
            onEditSkill={props.onEditSkill}
            onDeleteSkill={props.onDeleteSkill}
            onBrowseMoltHub={props.onBrowseMoltHub}
          />
        )
      case "connections":
        return (
          <ConnectionsSettings
            connections={props.connections}
            onConnect={props.onConnect}
            onDisconnect={props.onDisconnect}
            onTestConnection={props.onTestConnection}
            onSyncNow={props.onSyncConnection}
            onConfigure={props.onConfigureConnection}
          />
        )
      case "models":
        return (
          <ModelsSettings
            models={props.models}
            customProviders={props.customProviders}
            onSetDefaultModel={props.onSetDefaultModel}
            onAddCustomProvider={props.onAddCustomProvider}
            onRemoveCustomProvider={props.onRemoveCustomProvider}
            onUpdateApiKey={props.onUpdateApiKey}
            onTestConnection={props.onTestModelConnection}
            costTrackingEnabled={props.costTrackingEnabled}
            onToggleCostTracking={props.onToggleCostTracking}
          />
        )
      case "advanced":
        return (
          <AdvancedSettings
            debugMode={props.debugMode}
            onToggleDebugMode={props.onToggleDebugMode}
            telemetryEnabled={props.telemetryEnabled}
            onToggleTelemetry={props.onToggleTelemetry}
            onExportSettings={props.onExportSettings}
            onImportSettings={props.onImportSettings}
            onResetSettings={props.onResetSettings}
            onClearCache={props.onClearCache}
            onClearLogs={props.onClearLogs}
          />
        )
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b border-theme-700 p-4">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Settings</h2>
            <p className="text-sm text-theme-400">
              Configure MoltBot preferences and integrations
            </p>
          </div>

          {/* Save/Discard buttons */}
          {props.hasUnsavedChanges && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Unsaved changes
              </span>
              <Button variant="ghost" size="sm" onClick={props.onDiscard}>
                <X className="w-4 h-4" />
                Discard
              </Button>
              <Button variant="primary" size="sm" onClick={props.onSave}>
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-400" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowSearch(true)
            }}
            onFocus={() => setShowSearch(true)}
            className="w-full bg-theme-800 border border-theme-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
          />

          {/* Search Results Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSearch(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1 bg-theme-800 border border-theme-700 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto">
                {searchResults.map((item, index) => (
                  <button
                    key={`${item.tab}-${item.label}-${index}`}
                    onClick={() => handleSearchSelect(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-theme-700 transition-colors"
                  >
                    <span className="text-theme-400">
                      {tabs.find((t) => t.id === item.tab)?.icon}
                    </span>
                    <div>
                      <div className="text-sm text-white">{item.label}</div>
                      <div className="text-xs text-theme-500 capitalize">
                        {item.tab.replace("-", " ")}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tab Navigation */}
        <div className="w-48 shrink-0 border-r border-theme-700 p-2 overflow-y-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={classNames(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-1",
                activeTab === tab.id
                  ? "bg-theme-600 text-white"
                  : "text-theme-400 hover:bg-theme-800 hover:text-white"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">{renderTabContent()}</div>
      </div>
    </div>
  )
}
