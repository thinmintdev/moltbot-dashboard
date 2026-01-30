// MCP Tool types
export type MCPToolStatus = "active" | "inactive" | "error"

export interface MCPTool {
  id: string
  name: string
  description: string
  status: MCPToolStatus
  enabled: boolean
  version: string
  source: "npm" | "url" | "local"
  sourceUrl?: string
  capabilities: string[]
  lastHealthCheck?: Date
  errorMessage?: string
  configurable: boolean
}

// Skill types
export interface Skill {
  id: string
  name: string
  description: string
  enabled: boolean
  path: string
  version: string
  author?: string
  usageCount: number
  lastUsed?: Date
  tags: string[]
}

// Connection types
export type ConnectionStatus = "connected" | "disconnected" | "error" | "pending"

export interface BaseConnection {
  id: string
  name: string
  status: ConnectionStatus
  lastSync?: Date
  errorMessage?: string
}

export interface GitHubConnection extends BaseConnection {
  type: "github"
  username?: string
  avatarUrl?: string
  reposAccess: "all" | "selected"
  selectedRepos?: string[]
  scopes?: string[]
}

export interface GoogleConnection extends BaseConnection {
  type: "google"
  email?: string
  scopes: GoogleScope[]
}

export type GoogleScope = "gmail" | "calendar" | "drive"

export interface NotionConnection extends BaseConnection {
  type: "notion"
  workspaceName?: string
  workspaceId?: string
}

export interface ObsidianConnection extends BaseConnection {
  type: "obsidian"
  vaultPath?: string
  vaultName?: string
}

export interface LinearConnection extends BaseConnection {
  type: "linear"
  workspaceName?: string
  workspaceId?: string
}

export interface SlackConnection extends BaseConnection {
  type: "slack"
  workspaceName?: string
  workspaceId?: string
  connectionType: "oauth" | "webhook"
  webhookUrl?: string
}

export interface DiscordConnection extends BaseConnection {
  type: "discord"
  botUsername?: string
  guildCount?: number
}

export type Connection =
  | GitHubConnection
  | GoogleConnection
  | NotionConnection
  | ObsidianConnection
  | LinearConnection
  | SlackConnection
  | DiscordConnection

// Model types
export type ModelProvider = "anthropic" | "openai" | "google" | "custom"

export interface Model {
  id: string
  name: string
  provider: ModelProvider
  isDefault: boolean
  isGlobalDefault: boolean
  contextWindow: number
  costPerInputToken: number
  costPerOutputToken: number
  capabilities: string[]
  endpoint?: string
  apiKeyConfigured: boolean
}

export interface CustomModelProvider {
  id: string
  name: string
  baseUrl: string
  apiKeyConfigured: boolean
  models: string[]
}

// General settings types
export type ThemeMode = "dark" | "light" | "system"

export interface GeneralSettings {
  theme: ThemeMode
  defaultWorkspacePath: string
  autoSaveInterval: number // in seconds
  notifications: {
    enabled: boolean
    sound: boolean
    taskComplete: boolean
    agentError: boolean
    newMessage: boolean
  }
  agentConcurrencyLimit: number
  logRetentionDays: number
}

// Settings state
export interface SettingsState {
  general: GeneralSettings
  mcpTools: MCPTool[]
  skills: Skill[]
  connections: Connection[]
  models: Model[]
  customProviders: CustomModelProvider[]
  hasUnsavedChanges: boolean
}

export type SettingsTab = "general" | "mcp-tools" | "skills" | "connections" | "models" | "advanced"
