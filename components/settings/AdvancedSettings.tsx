"use client"

import { useState } from "react"
import {
  AlertTriangle,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Terminal,
  Database,
  Shield,
  Bug,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { Switch } from "./Switch"
import { FormInput, FormNumberInput } from "./FormInput"
import { SectionHeader, SectionCard } from "./SectionHeader"

interface AdvancedSettingsProps {
  debugMode: boolean
  onToggleDebugMode: (enabled: boolean) => void
  telemetryEnabled: boolean
  onToggleTelemetry: (enabled: boolean) => void
  onExportSettings: () => void
  onImportSettings: (file: File) => void
  onResetSettings: () => void
  onClearCache: () => void
  onClearLogs: () => void
}

export function AdvancedSettings({
  debugMode,
  onToggleDebugMode,
  telemetryEnabled,
  onToggleTelemetry,
  onExportSettings,
  onImportSettings,
  onResetSettings,
  onClearCache,
  onClearLogs,
}: AdvancedSettingsProps) {
  const [showResetModal, setShowResetModal] = useState(false)
  const [showClearCacheModal, setShowClearCacheModal] = useState(false)
  const [showClearLogsModal, setShowClearLogsModal] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState("")

  const handleImportClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ".json"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onImportSettings(file)
      }
    }
    input.click()
  }

  const handleReset = () => {
    if (resetConfirmText === "RESET") {
      onResetSettings()
      setShowResetModal(false)
      setResetConfirmText("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug Mode */}
      <SectionCard>
        <SectionHeader
          title="Developer Options"
          description="Settings for debugging and development"
        />
        <div className="space-y-4">
          <Switch
            checked={debugMode}
            onCheckedChange={onToggleDebugMode}
            label="Debug Mode"
            description="Enable verbose logging and debug information"
          />

          <Switch
            checked={telemetryEnabled}
            onCheckedChange={onToggleTelemetry}
            label="Usage Telemetry"
            description="Send anonymous usage data to help improve MoltBot"
          />
        </div>
      </SectionCard>

      {/* Data Management */}
      <SectionCard>
        <SectionHeader
          title="Data Management"
          description="Export, import, and manage your settings data"
        />
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" onClick={onExportSettings}>
              <Download className="w-4 h-4" />
              Export Settings
            </Button>
            <Button variant="secondary" onClick={handleImportClick}>
              <Upload className="w-4 h-4" />
              Import Settings
            </Button>
          </div>
          <p className="text-xs text-theme-400">
            Export your settings to a JSON file for backup or to transfer to another device.
          </p>
        </div>
      </SectionCard>

      {/* Cache & Storage */}
      <SectionCard>
        <SectionHeader
          title="Cache & Storage"
          description="Manage cached data and temporary files"
        />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-theme-800 rounded-lg border border-theme-700">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-theme-400" />
              <div>
                <div className="text-sm font-medium text-white">Application Cache</div>
                <div className="text-xs text-theme-400">
                  Temporary files, API responses, and cached data
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowClearCacheModal(true)}>
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>

          <div className="flex items-center justify-between p-3 bg-theme-800 rounded-lg border border-theme-700">
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5 text-theme-400" />
              <div>
                <div className="text-sm font-medium text-white">Agent Logs</div>
                <div className="text-xs text-theme-400">
                  Historical logs from all agent sessions
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowClearLogsModal(true)}>
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Danger Zone */}
      <SectionCard className="border-rose-500/30">
        <SectionHeader
          title="Danger Zone"
          description="Irreversible actions that affect your settings"
        />
        <div className="flex items-center justify-between p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <div>
              <div className="text-sm font-medium text-white">Reset All Settings</div>
              <div className="text-xs text-rose-400/70">
                This will restore all settings to their default values
              </div>
            </div>
          </div>
          <Button variant="danger" size="sm" onClick={() => setShowResetModal(true)}>
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        </div>
      </SectionCard>

      {/* Reset Modal */}
      <Modal
        open={showResetModal}
        onClose={() => {
          setShowResetModal(false)
          setResetConfirmText("")
        }}
        title="Reset All Settings"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-400">
              <strong>Warning:</strong> This action cannot be undone. All your settings,
              API keys, and configurations will be permanently deleted.
            </div>
          </div>

          <FormInput
            label="Type RESET to confirm"
            value={resetConfirmText}
            onChange={setResetConfirmText}
            placeholder="RESET"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button
              variant="ghost"
              onClick={() => {
                setShowResetModal(false)
                setResetConfirmText("")
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReset}
              disabled={resetConfirmText !== "RESET"}
            >
              <RefreshCw className="w-4 h-4" />
              Reset All Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Cache Modal */}
      <Modal
        open={showClearCacheModal}
        onClose={() => setShowClearCacheModal(false)}
        title="Clear Cache"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-400">
            This will clear all cached data including temporary files and API responses.
            This action cannot be undone.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button variant="ghost" onClick={() => setShowClearCacheModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onClearCache()
                setShowClearCacheModal(false)
              }}
            >
              <Trash2 className="w-4 h-4" />
              Clear Cache
            </Button>
          </div>
        </div>
      </Modal>

      {/* Clear Logs Modal */}
      <Modal
        open={showClearLogsModal}
        onClose={() => setShowClearLogsModal(false)}
        title="Clear Logs"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-theme-400">
            This will permanently delete all agent logs. You will not be able to recover
            historical session data.
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button variant="ghost" onClick={() => setShowClearLogsModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onClearLogs()
                setShowClearLogsModal(false)
              }}
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
