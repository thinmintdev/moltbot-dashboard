"use client"

import { useState } from "react"
import { Sun, Moon, Monitor, FolderOpen, Bell, Clock, Users, Archive } from "lucide-react"
import classNames from "classnames"
import { Switch } from "./Switch"
import { FormInput, FormNumberInput } from "./FormInput"
import { SectionHeader, SectionCard } from "./SectionHeader"
import { GeneralSettings as GeneralSettingsType, ThemeMode } from "./types"

interface GeneralSettingsProps {
  settings: GeneralSettingsType
  onChange: (settings: GeneralSettingsType) => void
}

export function GeneralSettings({ settings, onChange }: GeneralSettingsProps) {
  const updateSetting = <K extends keyof GeneralSettingsType>(
    key: K,
    value: GeneralSettingsType[K]
  ) => {
    onChange({ ...settings, [key]: value })
  }

  const updateNotification = (
    key: keyof GeneralSettingsType["notifications"],
    value: boolean
  ) => {
    onChange({
      ...settings,
      notifications: { ...settings.notifications, [key]: value },
    })
  }

  const themes: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
    { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <SectionCard>
        <SectionHeader
          title="Appearance"
          description="Customize how MoltBot looks on your device"
        />
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-white mb-2 block">
              Theme
            </label>
            <div className="flex gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => updateSetting("theme", theme.value)}
                  className={classNames(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                    settings.theme === theme.value
                      ? "border-theme-500 bg-theme-500/20 text-white"
                      : "border-theme-700 bg-theme-800 text-theme-400 hover:border-theme-600"
                  )}
                >
                  {theme.icon}
                  <span className="text-sm font-medium">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Workspace Settings */}
      <SectionCard>
        <SectionHeader
          title="Workspace"
          description="Configure your default workspace and storage settings"
        />
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <FormInput
                label="Default Workspace Path"
                value={settings.defaultWorkspacePath}
                onChange={(value) => updateSetting("defaultWorkspacePath", value)}
                placeholder="/home/user/moltbot-workspace"
                description="The default directory for new projects"
              />
            </div>
            <div className="flex items-end">
              <button className="px-3 py-2 bg-theme-700 hover:bg-theme-600 rounded-lg text-sm text-white transition-colors">
                <FolderOpen className="w-4 h-4" />
              </button>
            </div>
          </div>

          <FormNumberInput
            label="Auto-save Interval"
            value={settings.autoSaveInterval}
            onChange={(value) => updateSetting("autoSaveInterval", value)}
            min={5}
            max={300}
            step={5}
            unit="seconds"
            description="How often to automatically save changes (5-300 seconds)"
          />
        </div>
      </SectionCard>

      {/* Notification Settings */}
      <SectionCard>
        <SectionHeader
          title="Notifications"
          description="Control how and when you receive notifications"
        />
        <div className="space-y-4">
          <Switch
            checked={settings.notifications.enabled}
            onCheckedChange={(checked) => updateNotification("enabled", checked)}
            label="Enable Notifications"
            description="Receive desktop notifications for important events"
          />

          {settings.notifications.enabled && (
            <div className="pl-4 border-l-2 border-theme-700 space-y-4 ml-2">
              <Switch
                checked={settings.notifications.sound}
                onCheckedChange={(checked) => updateNotification("sound", checked)}
                label="Sound Alerts"
                description="Play a sound for notifications"
              />

              <Switch
                checked={settings.notifications.taskComplete}
                onCheckedChange={(checked) =>
                  updateNotification("taskComplete", checked)
                }
                label="Task Completion"
                description="Notify when tasks are completed"
              />

              <Switch
                checked={settings.notifications.agentError}
                onCheckedChange={(checked) =>
                  updateNotification("agentError", checked)
                }
                label="Agent Errors"
                description="Notify when an agent encounters an error"
              />

              <Switch
                checked={settings.notifications.newMessage}
                onCheckedChange={(checked) =>
                  updateNotification("newMessage", checked)
                }
                label="New Messages"
                description="Notify when you receive new chat messages"
              />
            </div>
          )}
        </div>
      </SectionCard>

      {/* Performance Settings */}
      <SectionCard>
        <SectionHeader
          title="Performance"
          description="Configure system resource usage"
        />
        <div className="space-y-4">
          <FormNumberInput
            label="Agent Concurrency Limit"
            value={settings.agentConcurrencyLimit}
            onChange={(value) => updateSetting("agentConcurrencyLimit", value)}
            min={1}
            max={20}
            unit="agents"
            description="Maximum number of agents that can run simultaneously (1-20)"
          />

          <FormNumberInput
            label="Log Retention"
            value={settings.logRetentionDays}
            onChange={(value) => updateSetting("logRetentionDays", value)}
            min={1}
            max={365}
            unit="days"
            description="How long to keep agent logs before automatic cleanup"
          />
        </div>
      </SectionCard>
    </div>
  )
}
