"use client"

import { useState } from "react"
import classNames from "classnames"
import {
  Plus,
  Settings,
  Trash2,
  RefreshCw,
  Star,
  CheckCircle,
  AlertCircle,
  Search,
  DollarSign,
  Zap,
  Globe,
  Key,
  TestTube,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { Switch } from "./Switch"
import { FormInput, FormSelect, FormNumberInput } from "./FormInput"
import { SectionHeader, SectionCard } from "./SectionHeader"
import { Model, ModelProvider, CustomModelProvider } from "./types"

interface ModelsSettingsProps {
  models: Model[]
  customProviders: CustomModelProvider[]
  onSetDefaultModel: (modelId: string, scope: "global" | "project") => void
  onAddCustomProvider: (provider: Omit<CustomModelProvider, "id">) => void
  onRemoveCustomProvider: (providerId: string) => void
  onUpdateApiKey: (providerId: ModelProvider | string, apiKey: string) => void
  onTestConnection: (modelId: string) => void
  onToggleCostTracking: (enabled: boolean) => void
  costTrackingEnabled: boolean
}

const providerLogos: Record<ModelProvider, React.ReactNode> = {
  anthropic: (
    <div className="w-5 h-5 rounded bg-[#d4a27f] flex items-center justify-center text-white text-xs font-bold">
      A
    </div>
  ),
  openai: (
    <div className="w-5 h-5 rounded bg-[#10a37f] flex items-center justify-center text-white text-xs font-bold">
      O
    </div>
  ),
  google: (
    <div className="w-5 h-5 rounded bg-[#4285f4] flex items-center justify-center text-white text-xs font-bold">
      G
    </div>
  ),
  custom: (
    <div className="w-5 h-5 rounded bg-theme-600 flex items-center justify-center text-white text-xs font-bold">
      C
    </div>
  ),
}

const providerNames: Record<ModelProvider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google AI",
  custom: "Custom",
}

export function ModelsSettings({
  models,
  customProviders,
  onSetDefaultModel,
  onAddCustomProvider,
  onRemoveCustomProvider,
  onUpdateApiKey,
  onTestConnection,
  onToggleCostTracking,
  costTrackingEnabled,
}: ModelsSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | "all">("all")
  const [showAddProviderModal, setShowAddProviderModal] = useState(false)
  const [showApiKeyModal, setShowApiKeyModal] = useState<ModelProvider | string | null>(null)
  const [newApiKey, setNewApiKey] = useState("")
  const [newProvider, setNewProvider] = useState({
    name: "",
    baseUrl: "",
    models: "",
  })

  const filteredModels = models.filter((model) => {
    const matchesSearch =
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.provider.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesProvider =
      selectedProvider === "all" || model.provider === selectedProvider
    return matchesSearch && matchesProvider
  })

  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {} as Record<string, Model[]>)

  const handleAddProvider = () => {
    if (newProvider.name && newProvider.baseUrl) {
      onAddCustomProvider({
        name: newProvider.name,
        baseUrl: newProvider.baseUrl,
        apiKeyConfigured: false,
        models: newProvider.models.split(",").map((m) => m.trim()).filter(Boolean),
      })
      setNewProvider({ name: "", baseUrl: "", models: "" })
      setShowAddProviderModal(false)
    }
  }

  const handleSaveApiKey = () => {
    if (showApiKeyModal && newApiKey) {
      onUpdateApiKey(showApiKeyModal, newApiKey)
      setNewApiKey("")
      setShowApiKeyModal(null)
    }
  }

  const formatCost = (cost: number) => {
    if (cost < 0.001) return `$${(cost * 1000000).toFixed(2)}/M tokens`
    return `$${cost.toFixed(4)}/1K tokens`
  }

  // Get unique providers
  const providers: (ModelProvider | "all")[] = ["all", "anthropic", "openai", "google", "custom"]

  return (
    <div className="space-y-6">
      {/* Cost Tracking */}
      <SectionCard>
        <SectionHeader
          title="Cost Tracking"
          description="Monitor API usage and spending across all models"
        />
        <Switch
          checked={costTrackingEnabled}
          onCheckedChange={onToggleCostTracking}
          label="Enable Cost Tracking"
          description="Track token usage and estimated costs for all API calls"
        />
      </SectionCard>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-theme-800 border border-theme-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
          />
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowAddProviderModal(true)}>
          <Plus className="w-4 h-4" />
          Add Provider
        </Button>
      </div>

      {/* Provider Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {providers.map((provider) => (
          <button
            key={provider}
            onClick={() => setSelectedProvider(provider)}
            className={classNames(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap",
              selectedProvider === provider
                ? "bg-theme-600 text-white"
                : "bg-theme-800 text-theme-400 hover:bg-theme-700"
            )}
          >
            {provider !== "all" && providerLogos[provider]}
            {provider === "all" ? "All Providers" : providerNames[provider]}
          </button>
        ))}
      </div>

      {/* API Keys Section */}
      <SectionCard>
        <SectionHeader
          title="API Keys"
          description="Configure API keys for each provider"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["anthropic", "openai", "google"] as ModelProvider[]).map((provider) => {
            const hasKey = models.some(
              (m) => m.provider === provider && m.apiKeyConfigured
            )
            return (
              <div
                key={provider}
                className="flex items-center justify-between p-3 bg-theme-800 rounded-lg border border-theme-700"
              >
                <div className="flex items-center gap-3">
                  {providerLogos[provider]}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {providerNames[provider]}
                    </div>
                    <div className="text-xs text-theme-400">
                      {hasKey ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle className="w-3 h-3" />
                          Configured
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertCircle className="w-3 h-3" />
                          Not configured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKeyModal(provider)}
                >
                  <Key className="w-4 h-4" />
                  {hasKey ? "Update" : "Add"} Key
                </Button>
              </div>
            )
          })}
        </div>
      </SectionCard>

      {/* Custom Providers */}
      {customProviders.length > 0 && (
        <SectionCard>
          <SectionHeader
            title="Custom Providers"
            description="OpenAI-compatible API endpoints"
          />
          <div className="space-y-3">
            {customProviders.map((provider) => (
              <div
                key={provider.id}
                className="flex items-center justify-between p-3 bg-theme-800 rounded-lg border border-theme-700"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-theme-400" />
                  <div>
                    <div className="text-sm font-medium text-white">{provider.name}</div>
                    <div className="text-xs text-theme-500">{provider.baseUrl}</div>
                    <div className="text-xs text-theme-400 mt-1">
                      Models: {provider.models.join(", ") || "None specified"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowApiKeyModal(provider.id)}
                  >
                    <Key className="w-4 h-4" />
                  </Button>
                  <button
                    onClick={() => onRemoveCustomProvider(provider.id)}
                    className="p-2 text-theme-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Models List */}
      {Object.entries(groupedModels).map(([provider, providerModels]) => (
        <SectionCard key={provider}>
          <SectionHeader
            title={providerNames[provider as ModelProvider] || provider}
            description={`${providerModels.length} models available`}
          />
          <div className="space-y-2">
            {providerModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center gap-4 p-3 bg-theme-800 rounded-lg border border-theme-700 hover:border-theme-600 transition-colors"
              >
                {/* Default Star */}
                <button
                  onClick={() => onSetDefaultModel(model.id, "global")}
                  className={classNames(
                    "p-1.5 rounded transition-colors",
                    model.isGlobalDefault
                      ? "text-amber-400 bg-amber-500/20"
                      : "text-theme-500 hover:text-amber-400 hover:bg-amber-500/10"
                  )}
                  title={model.isGlobalDefault ? "Global default" : "Set as global default"}
                >
                  <Star className="w-4 h-4" fill={model.isGlobalDefault ? "currentColor" : "none"} />
                </button>

                {/* Model Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{model.name}</span>
                    {model.isDefault && (
                      <span className="px-1.5 py-0.5 bg-theme-600 rounded text-xs text-theme-300">
                        Project Default
                      </span>
                    )}
                    {!model.apiKeyConfigured && (
                      <span className="px-1.5 py-0.5 bg-rose-500/20 rounded text-xs text-rose-400">
                        No API Key
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-theme-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {(model.contextWindow / 1000).toFixed(0)}K context
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {formatCost(model.costPerInputToken)} input
                    </span>
                  </div>
                  {model.capabilities.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {model.capabilities.slice(0, 3).map((cap) => (
                        <span
                          key={cap}
                          className="px-1.5 py-0.5 bg-theme-700 rounded text-xs text-theme-400"
                        >
                          {cap}
                        </span>
                      ))}
                      {model.capabilities.length > 3 && (
                        <span className="px-1.5 py-0.5 bg-theme-700 rounded text-xs text-theme-400">
                          +{model.capabilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onTestConnection(model.id)}
                    className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                    title="Test Connection"
                  >
                    <TestTube className="w-4 h-4" />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSetDefaultModel(model.id, "project")}
                    disabled={model.isDefault}
                  >
                    Set Default
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ))}

      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-theme-600 mx-auto mb-3" />
          <p className="text-theme-400">No models match your search</p>
        </div>
      )}

      {/* Add Provider Modal */}
      <Modal
        open={showAddProviderModal}
        onClose={() => setShowAddProviderModal(false)}
        title="Add Custom Provider"
        size="sm"
      >
        <div className="space-y-4">
          <FormInput
            label="Provider Name"
            value={newProvider.name}
            onChange={(value) => setNewProvider({ ...newProvider, name: value })}
            placeholder="My Custom Provider"
            required
          />

          <FormInput
            label="Base URL"
            value={newProvider.baseUrl}
            onChange={(value) => setNewProvider({ ...newProvider, baseUrl: value })}
            placeholder="https://api.example.com/v1"
            description="OpenAI-compatible API endpoint"
            required
          />

          <FormInput
            label="Model Names"
            value={newProvider.models}
            onChange={(value) => setNewProvider({ ...newProvider, models: value })}
            placeholder="model-1, model-2"
            description="Comma-separated list of available model names"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button variant="ghost" onClick={() => setShowAddProviderModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleAddProvider}
              disabled={!newProvider.name || !newProvider.baseUrl}
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </Button>
          </div>
        </div>
      </Modal>

      {/* API Key Modal */}
      <Modal
        open={!!showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(null)
          setNewApiKey("")
        }}
        title={`Configure API Key`}
        size="sm"
      >
        <div className="space-y-4">
          <FormInput
            label="API Key"
            value={newApiKey}
            onChange={setNewApiKey}
            type="password"
            placeholder="sk-..."
            description="Your API key will be stored securely"
            required
          />

          <div className="bg-theme-700/50 rounded-lg p-3">
            <p className="text-xs text-theme-400">
              <strong className="text-white">Security Note:</strong> API keys are stored
              locally and encrypted. They are never sent to any external servers except
              the configured API endpoints.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button
              variant="ghost"
              onClick={() => {
                setShowApiKeyModal(null)
                setNewApiKey("")
              }}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveApiKey} disabled={!newApiKey}>
              <Key className="w-4 h-4" />
              Save Key
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
