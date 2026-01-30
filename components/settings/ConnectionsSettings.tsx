"use client"

import { useState } from "react"
import classNames from "classnames"
import {
  Github,
  Mail,
  Calendar,
  HardDrive,
  MessageSquare,
  Unlink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  ExternalLink,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { FormInput } from "./FormInput"
import { Switch } from "./Switch"
import { SectionCard } from "./SectionHeader"
import {
  Connection,
  ConnectionStatus,
  GitHubConnection,
  GoogleConnection,
  GoogleScope,
  NotionConnection,
  ObsidianConnection,
  LinearConnection,
  SlackConnection,
  DiscordConnection,
} from "./types"

interface ConnectionsSettingsProps {
  connections: Connection[]
  onConnect: (type: Connection["type"]) => void
  onDisconnect: (connectionId: string) => void
  onTestConnection: (connectionId: string) => void
  onSyncNow: (connectionId: string) => void
  onConfigure: (connectionId: string, config: Record<string, unknown>) => void
}

// Service icons mapping
const serviceIcons: Record<string, React.ReactNode> = {
  github: <Github className="w-5 h-5" />,
  google: <Mail className="w-5 h-5" />,
  notion: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 2.035c-.42-.326-.98-.7-2.055-.607L3.01 2.87c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.934zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.218 1.128L16.042 0c1.355-.093 1.635-.046 2.475.56l3.735 2.614c.608.42.794.56.794 1.073v17.138c0 1.027-.373 1.634-1.681 1.727l-15.458.933c-.98.047-1.448-.093-1.962-.746L1.5 20.354c-.56-.747-.793-1.307-.793-1.96V2.667c0-.839.374-1.446 1.512-1.539z" />
    </svg>
  ),
  obsidian: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.47 3.684l6.24 3.398-2.092 1.208-.91-.495-2.284 1.32v9.77l-1.907 1.102V9.116l-2.285-1.32-.91.495-2.09-1.208 6.237-3.399zm-7.5 4.33l2.09 1.207v7.56l4.455 2.574v2.414l-6.545-3.781V8.014zm14.94 0v7.974l-6.545 3.78v-2.414l4.455-2.573v-7.56l2.09-1.207z" />
    </svg>
  ),
  linear: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.357 3.357a.5.5 0 01.707 0l16.579 16.579a.5.5 0 01-.707.707L3.357 4.064a.5.5 0 010-.707z" />
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 110-16 8 8 0 010 16z" />
    </svg>
  ),
  slack: <MessageSquare className="w-5 h-5" />,
  discord: (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  ),
}

const serviceNames: Record<string, string> = {
  github: "GitHub",
  google: "Google Workspace",
  notion: "Notion",
  obsidian: "Obsidian",
  linear: "Linear",
  slack: "Slack",
  discord: "Discord",
}

const serviceDescriptions: Record<string, string> = {
  github: "Connect your GitHub account for repository access and automation",
  google: "Access Gmail, Calendar, and Drive for productivity integrations",
  notion: "Sync with your Notion workspace for documentation and notes",
  obsidian: "Connect to your Obsidian vault for knowledge management",
  linear: "Integrate with Linear for issue tracking and project management",
  slack: "Send notifications and interact via Slack",
  discord: "Connect your Discord bot for community automation",
}

function getStatusConfig(status: ConnectionStatus) {
  switch (status) {
    case "connected":
      return {
        icon: <CheckCircle className="w-4 h-4" />,
        color: "text-emerald-400",
        bgColor: "bg-emerald-500/20",
        label: "Connected",
      }
    case "disconnected":
      return {
        icon: <Unlink className="w-4 h-4" />,
        color: "text-theme-400",
        bgColor: "bg-theme-700",
        label: "Not Connected",
      }
    case "error":
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        color: "text-rose-400",
        bgColor: "bg-rose-500/20",
        label: "Error",
      }
    case "pending":
      return {
        icon: <Clock className="w-4 h-4" />,
        color: "text-amber-400",
        bgColor: "bg-amber-500/20",
        label: "Pending",
      }
  }
}

export function ConnectionsSettings({
  connections,
  onConnect,
  onDisconnect,
  onTestConnection,
  onSyncNow,
  onConfigure,
}: ConnectionsSettingsProps) {
  const [configureConnection, setConfigureConnection] = useState<Connection | null>(null)

  // Create a default connection object for services not yet configured
  const connectionTypes: Connection["type"][] = [
    "github",
    "google",
    "notion",
    "obsidian",
    "linear",
    "slack",
    "discord",
  ]

  const getConnectionByType = (type: Connection["type"]) =>
    connections.find((c) => c.type === type)

  const formatLastSync = (date?: Date) => {
    if (!date) return "Never synced"
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    return new Date(date).toLocaleDateString()
  }

  const renderConnectionDetails = (connection: Connection) => {
    switch (connection.type) {
      case "github":
        const github = connection as GitHubConnection
        return (
          <div className="text-xs text-theme-400 space-y-1">
            {github.username && <div>Account: @{github.username}</div>}
            {github.reposAccess && (
              <div>
                Access: {github.reposAccess === "all" ? "All repositories" : "Selected repos"}
              </div>
            )}
          </div>
        )
      case "google":
        const google = connection as GoogleConnection
        return (
          <div className="text-xs text-theme-400 space-y-1">
            {google.email && <div>Account: {google.email}</div>}
            {google.scopes.length > 0 && (
              <div className="flex gap-1 mt-1">
                {google.scopes.map((scope) => (
                  <span key={scope} className="px-1.5 py-0.5 bg-theme-700 rounded capitalize">
                    {scope}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      case "notion":
        const notion = connection as NotionConnection
        return (
          <div className="text-xs text-theme-400">
            {notion.workspaceName && <div>Workspace: {notion.workspaceName}</div>}
          </div>
        )
      case "obsidian":
        const obsidian = connection as ObsidianConnection
        return (
          <div className="text-xs text-theme-400">
            {obsidian.vaultPath && <div>Vault: {obsidian.vaultPath}</div>}
          </div>
        )
      case "linear":
        const linear = connection as LinearConnection
        return (
          <div className="text-xs text-theme-400">
            {linear.workspaceName && <div>Workspace: {linear.workspaceName}</div>}
          </div>
        )
      case "slack":
        const slack = connection as SlackConnection
        return (
          <div className="text-xs text-theme-400">
            {slack.workspaceName && <div>Workspace: {slack.workspaceName}</div>}
            <div>Type: {slack.connectionType === "oauth" ? "OAuth" : "Webhook"}</div>
          </div>
        )
      case "discord":
        const discord = connection as DiscordConnection
        return (
          <div className="text-xs text-theme-400">
            {discord.botUsername && <div>Bot: {discord.botUsername}</div>}
            {discord.guildCount !== undefined && <div>Servers: {discord.guildCount}</div>}
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {connectionTypes.map((type) => {
        const connection = getConnectionByType(type)
        const isConnected = connection?.status === "connected"
        const statusConfig = connection
          ? getStatusConfig(connection.status)
          : getStatusConfig("disconnected")

        return (
          <SectionCard key={type} className="p-0">
            <div className="p-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={classNames(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                    isConnected ? "bg-theme-600 text-white" : "bg-theme-700 text-theme-400"
                  )}
                >
                  {serviceIcons[type]}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-white">{serviceNames[type]}</h4>
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
                  <p className="text-xs text-theme-400 mb-2">{serviceDescriptions[type]}</p>

                  {/* Connection Details */}
                  {connection && isConnected && (
                    <div className="space-y-1">
                      {renderConnectionDetails(connection)}
                      <div className="text-xs text-theme-500 flex items-center gap-1 mt-2">
                        <Clock className="w-3 h-3" />
                        {formatLastSync(connection.lastSync)}
                      </div>
                      {connection.errorMessage && (
                        <div className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {connection.errorMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {connection && isConnected ? (
                    <>
                      <button
                        onClick={() => onTestConnection(connection.id)}
                        className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                        title="Test Connection"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onSyncNow(connection.id)}
                        className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                        title="Sync Now"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setConfigureConnection(connection)}
                        className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                        title="Configure"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDisconnect(connection.id)}
                      >
                        <Unlink className="w-4 h-4" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button variant="primary" size="sm" onClick={() => onConnect(type)}>
                      <ExternalLink className="w-4 h-4" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>
        )
      })}

      {/* Configure Modal */}
      {configureConnection && (
        <ConnectionConfigModal
          connection={configureConnection}
          onClose={() => setConfigureConnection(null)}
          onSave={(config) => {
            onConfigure(configureConnection.id, config)
            setConfigureConnection(null)
          }}
        />
      )}
    </div>
  )
}

// Configuration Modal Component
interface ConnectionConfigModalProps {
  connection: Connection
  onClose: () => void
  onSave: (config: Record<string, unknown>) => void
}

function ConnectionConfigModal({ connection, onClose, onSave }: ConnectionConfigModalProps) {
  const [config, setConfig] = useState<Record<string, unknown>>({})

  const renderConfigFields = () => {
    switch (connection.type) {
      case "github":
        const github = connection as GitHubConnection
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Repository Access
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig({ ...config, reposAccess: "all" })}
                  className={classNames(
                    "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    (config.reposAccess || github.reposAccess) === "all"
                      ? "border-theme-500 bg-theme-500/20 text-white"
                      : "border-theme-700 bg-theme-800 text-theme-400"
                  )}
                >
                  All Repositories
                </button>
                <button
                  onClick={() => setConfig({ ...config, reposAccess: "selected" })}
                  className={classNames(
                    "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    (config.reposAccess || github.reposAccess) === "selected"
                      ? "border-theme-500 bg-theme-500/20 text-white"
                      : "border-theme-700 bg-theme-800 text-theme-400"
                  )}
                >
                  Selected Only
                </button>
              </div>
            </div>
          </div>
        )

      case "google":
        const google = connection as GoogleConnection
        const scopes: GoogleScope[] = ["gmail", "calendar", "drive"]
        const selectedScopes = (config.scopes as GoogleScope[]) || google.scopes
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Enabled Services
              </label>
              <div className="space-y-2">
                {scopes.map((scope) => (
                  <Switch
                    key={scope}
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={(checked) => {
                      const newScopes = checked
                        ? [...selectedScopes, scope]
                        : selectedScopes.filter((s) => s !== scope)
                      setConfig({ ...config, scopes: newScopes })
                    }}
                    label={scope.charAt(0).toUpperCase() + scope.slice(1)}
                    description={`Enable ${scope} integration`}
                  />
                ))}
              </div>
            </div>
          </div>
        )

      case "notion":
        return (
          <div className="space-y-4">
            <FormInput
              label="Integration Token"
              value={(config.token as string) || ""}
              onChange={(value) => setConfig({ ...config, token: value })}
              type="password"
              placeholder="secret_..."
              description="Your Notion internal integration token"
            />
          </div>
        )

      case "obsidian":
        const obsidian = connection as ObsidianConnection
        return (
          <div className="space-y-4">
            <FormInput
              label="Vault Path"
              value={(config.vaultPath as string) || obsidian.vaultPath || ""}
              onChange={(value) => setConfig({ ...config, vaultPath: value })}
              placeholder="/path/to/your/vault"
              description="Full path to your Obsidian vault directory"
            />
          </div>
        )

      case "linear":
        return (
          <div className="space-y-4">
            <FormInput
              label="API Key"
              value={(config.apiKey as string) || ""}
              onChange={(value) => setConfig({ ...config, apiKey: value })}
              type="password"
              placeholder="lin_api_..."
              description="Your Linear API key"
            />
          </div>
        )

      case "slack":
        const slack = connection as SlackConnection
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Connection Type
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfig({ ...config, connectionType: "oauth" })}
                  className={classNames(
                    "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    (config.connectionType || slack.connectionType) === "oauth"
                      ? "border-theme-500 bg-theme-500/20 text-white"
                      : "border-theme-700 bg-theme-800 text-theme-400"
                  )}
                >
                  OAuth
                </button>
                <button
                  onClick={() => setConfig({ ...config, connectionType: "webhook" })}
                  className={classNames(
                    "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    (config.connectionType || slack.connectionType) === "webhook"
                      ? "border-theme-500 bg-theme-500/20 text-white"
                      : "border-theme-700 bg-theme-800 text-theme-400"
                  )}
                >
                  Webhook
                </button>
              </div>
            </div>
            {(config.connectionType || slack.connectionType) === "webhook" && (
              <FormInput
                label="Webhook URL"
                value={(config.webhookUrl as string) || slack.webhookUrl || ""}
                onChange={(value) => setConfig({ ...config, webhookUrl: value })}
                placeholder="https://hooks.slack.com/services/..."
                description="Your Slack incoming webhook URL"
              />
            )}
          </div>
        )

      case "discord":
        return (
          <div className="space-y-4">
            <FormInput
              label="Bot Token"
              value={(config.botToken as string) || ""}
              onChange={(value) => setConfig({ ...config, botToken: value })}
              type="password"
              placeholder="Your Discord bot token"
              description="The token for your Discord bot application"
            />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`Configure ${serviceNames[connection.type]}`}
      size="sm"
    >
      <div className="space-y-4">
        {renderConfigFields()}

        <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSave(config)}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  )
}
