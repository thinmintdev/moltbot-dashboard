"use client"

import { useState } from "react"
import classNames from "classnames"
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  Sparkles,
  Download,
  FileCode,
  Activity,
  Clock,
  Tag,
  FolderOpen,
} from "lucide-react"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { Switch } from "./Switch"
import { FormInput } from "./FormInput"
import { SectionCard } from "./SectionHeader"
import { Skill } from "./types"

interface SkillsSettingsProps {
  skills: Skill[]
  onToggleSkill: (skillId: string, enabled: boolean) => void
  onInstallSkill: (source: string) => void
  onCreateSkill: () => void
  onEditSkill: (skillId: string) => void
  onDeleteSkill: (skillId: string) => void
  onBrowseMoltHub: () => void
}

export function SkillsSettings({
  skills,
  onToggleSkill,
  onInstallSkill,
  onCreateSkill,
  onEditSkill,
  onDeleteSkill,
  onBrowseMoltHub,
}: SkillsSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showInstallModal, setShowInstallModal] = useState(false)
  const [installSource, setInstallSource] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Get all unique tags
  const allTags = Array.from(new Set(skills.flatMap((s) => s.tags)))

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTag = !selectedTag || skill.tags.includes(selectedTag)
    return matchesSearch && matchesTag
  })

  const handleInstall = () => {
    if (installSource.trim()) {
      onInstallSkill(installSource.trim())
      setInstallSource("")
      setShowInstallModal(false)
    }
  }

  const formatLastUsed = (date?: Date) => {
    if (!date) return "Never"
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return "Today"
    if (days === 1) return "Yesterday"
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return `${Math.floor(days / 30)} months ago`
  }

  const stats = {
    total: skills.length,
    enabled: skills.filter((s) => s.enabled).length,
    totalUsage: skills.reduce((sum, s) => sum + s.usageCount, 0),
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-theme-800/50 border border-theme-700 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-white">{stats.total}</div>
          <div className="text-xs text-theme-400">Total Skills</div>
        </div>
        <div className="bg-theme-500/10 border border-theme-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-theme-400">{stats.enabled}</div>
          <div className="text-xs text-theme-500">Enabled</div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
          <div className="text-2xl font-semibold text-amber-400">{stats.totalUsage}</div>
          <div className="text-xs text-amber-400/70">Total Uses</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-400" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-theme-800 border border-theme-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBrowseMoltHub}>
            <ExternalLink className="w-4 h-4" />
            Browse MoltHub
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowInstallModal(true)}>
            <Download className="w-4 h-4" />
            Install
          </Button>
          <Button variant="primary" size="sm" onClick={onCreateSkill}>
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Tag Filters */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={classNames(
              "px-3 py-1 rounded-full text-xs font-medium transition-colors",
              !selectedTag
                ? "bg-theme-500 text-white"
                : "bg-theme-800 text-theme-400 hover:bg-theme-700"
            )}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={classNames(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1",
                selectedTag === tag
                  ? "bg-theme-500 text-white"
                  : "bg-theme-800 text-theme-400 hover:bg-theme-700"
              )}
            >
              <Tag className="w-3 h-3" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Skills List */}
      <div className="space-y-3">
        {filteredSkills.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-theme-600 mx-auto mb-3" />
            <p className="text-theme-400">
              {searchQuery || selectedTag
                ? "No skills match your search"
                : "No skills installed"}
            </p>
            {!searchQuery && !selectedTag && (
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={onBrowseMoltHub}>
                  <ExternalLink className="w-4 h-4" />
                  Browse MoltHub
                </Button>
                <Button variant="primary" size="sm" onClick={onCreateSkill}>
                  <Plus className="w-4 h-4" />
                  Create Skill
                </Button>
              </div>
            )}
          </div>
        ) : (
          filteredSkills.map((skill) => (
            <SectionCard key={skill.id} className="p-0">
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Toggle */}
                  <div className="pt-1">
                    <Switch
                      checked={skill.enabled}
                      onCheckedChange={(checked) => onToggleSkill(skill.id, checked)}
                      size="sm"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {skill.name}
                      </h4>
                      <span className="text-xs text-theme-500">v{skill.version}</span>
                      {skill.author && (
                        <span className="text-xs text-theme-500">by {skill.author}</span>
                      )}
                    </div>
                    <p className="text-xs text-theme-400 line-clamp-2">
                      {skill.description}
                    </p>

                    {/* Tags */}
                    {skill.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {skill.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-1.5 py-0.5 bg-theme-700 rounded text-xs text-theme-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-theme-500">
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        {skill.usageCount} uses
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatLastUsed(skill.lastUsed)}
                      </span>
                      <span className="flex items-center gap-1 truncate">
                        <FolderOpen className="w-3 h-3" />
                        {skill.path}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditSkill(skill.id)}
                      className="p-2 text-theme-400 hover:text-white hover:bg-theme-700 rounded-lg transition-colors"
                      title="Edit SKILL.md"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteSkill(skill.id)}
                      className="p-2 text-theme-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))
        )}
      </div>

      {/* Install Modal */}
      <Modal
        open={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        title="Install Skill"
        size="sm"
      >
        <div className="space-y-4">
          <FormInput
            label="Source"
            value={installSource}
            onChange={setInstallSource}
            placeholder="URL or local path to skill"
            description="Enter a Git URL, direct download link, or local path"
          />

          <div className="bg-theme-700/50 rounded-lg p-3">
            <p className="text-xs text-theme-400">
              <strong className="text-white">Tip:</strong> Skills should contain a
              SKILL.md file describing the skill&apos;s capabilities and usage.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-theme-700">
            <Button variant="ghost" onClick={() => setShowInstallModal(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleInstall}
              disabled={!installSource.trim()}
            >
              <Download className="w-4 h-4" />
              Install
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
