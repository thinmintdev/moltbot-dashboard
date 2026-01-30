"use client"

import { useState, useMemo } from "react"
import classNames from "classnames"
import {
  Crown,
  Code2,
  Search,
  Map,
  FlaskConical,
  CheckCircle,
  Sparkles,
  Plus,
  X,
  Check,
  ChevronDown,
} from "lucide-react"
import { Modal } from "../ui/Modal"
import { Button } from "../ui/Button"
import {
  AgentType,
  AgentTypeInfo,
  AGENT_TYPES,
  AVAILABLE_SKILLS,
  AVAILABLE_MODELS,
} from "./types"

interface SpawnAgentModalProps {
  open: boolean
  onClose: () => void
  onSpawn: (config: SpawnAgentConfig) => void
  projects?: { id: string; name: string }[]
  tasks?: { id: string; name: string }[]
}

export interface SpawnAgentConfig {
  name: string
  type: AgentType
  model: string
  skills: string[]
  taskId?: string
  projectId?: string
}

const typeIcons: Record<AgentType, React.ReactNode> = {
  orchestrator: <Crown className="w-5 h-5" />,
  coder: <Code2 className="w-5 h-5" />,
  researcher: <Search className="w-5 h-5" />,
  planner: <Map className="w-5 h-5" />,
  tester: <FlaskConical className="w-5 h-5" />,
  reviewer: <CheckCircle className="w-5 h-5" />,
  custom: <Sparkles className="w-5 h-5" />,
}

const typeColors: Record<AgentType, string> = {
  orchestrator: "border-purple-500/50 bg-purple-500/10 hover:bg-purple-500/20",
  coder: "border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20",
  researcher: "border-cyan-500/50 bg-cyan-500/10 hover:bg-cyan-500/20",
  planner: "border-orange-500/50 bg-orange-500/10 hover:bg-orange-500/20",
  tester: "border-green-500/50 bg-green-500/10 hover:bg-green-500/20",
  reviewer: "border-pink-500/50 bg-pink-500/10 hover:bg-pink-500/20",
  custom: "border-theme-500/50 bg-theme-500/10 hover:bg-theme-500/20",
}

const typeSelectedColors: Record<AgentType, string> = {
  orchestrator: "border-purple-500 bg-purple-500/30 ring-2 ring-purple-500/30",
  coder: "border-blue-500 bg-blue-500/30 ring-2 ring-blue-500/30",
  researcher: "border-cyan-500 bg-cyan-500/30 ring-2 ring-cyan-500/30",
  planner: "border-orange-500 bg-orange-500/30 ring-2 ring-orange-500/30",
  tester: "border-green-500 bg-green-500/30 ring-2 ring-green-500/30",
  reviewer: "border-pink-500 bg-pink-500/30 ring-2 ring-pink-500/30",
  custom: "border-theme-500 bg-theme-500/30 ring-2 ring-theme-500/30",
}

const typeTextColors: Record<AgentType, string> = {
  orchestrator: "text-purple-400",
  coder: "text-blue-400",
  researcher: "text-cyan-400",
  planner: "text-orange-400",
  tester: "text-green-400",
  reviewer: "text-pink-400",
  custom: "text-theme-400",
}

export function SpawnAgentModal({
  open,
  onClose,
  onSpawn,
  projects = [],
  tasks = [],
}: SpawnAgentModalProps) {
  const [selectedType, setSelectedType] = useState<AgentType | null>(null)
  const [name, setName] = useState("")
  const [model, setModel] = useState(AVAILABLE_MODELS[0].id)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [taskId, setTaskId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [showSkillsDropdown, setShowSkillsDropdown] = useState(false)
  const [skillSearch, setSkillSearch] = useState("")

  // Get selected type info
  const selectedTypeInfo = useMemo(() => {
    return AGENT_TYPES.find((t) => t.type === selectedType)
  }, [selectedType])

  // Reset form when modal closes
  const handleClose = () => {
    setSelectedType(null)
    setName("")
    setModel(AVAILABLE_MODELS[0].id)
    setSelectedSkills([])
    setTaskId("")
    setProjectId("")
    onClose()
  }

  // Handle type selection
  const handleTypeSelect = (type: AgentType) => {
    setSelectedType(type)
    const typeInfo = AGENT_TYPES.find((t) => t.type === type)
    if (typeInfo) {
      setSelectedSkills(typeInfo.defaultSkills)
      // Generate default name
      const count = Math.floor(Math.random() * 1000)
      setName(`${typeInfo.label}-${count}`)
    }
  }

  // Toggle skill
  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    )
  }

  // Filter skills by search
  const filteredSkills = useMemo(() => {
    if (!skillSearch) return AVAILABLE_SKILLS
    return AVAILABLE_SKILLS.filter((skill) =>
      skill.toLowerCase().includes(skillSearch.toLowerCase())
    )
  }, [skillSearch])

  // Handle spawn
  const handleSpawn = () => {
    if (!selectedType || !name || !model) return
    onSpawn({
      name,
      type: selectedType,
      model,
      skills: selectedSkills,
      taskId: taskId || undefined,
      projectId: projectId || undefined,
    })
    handleClose()
  }

  const canSpawn = selectedType && name.trim() && model

  return (
    <Modal open={open} onClose={handleClose} title="Spawn New Agent" size="lg">
      <div className="flex flex-col gap-6">
        {/* Agent Type Selection */}
        <div>
          <label className="block text-sm font-medium text-theme-300 mb-3">
            Select Agent Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {AGENT_TYPES.map((typeInfo) => (
              <button
                key={typeInfo.type}
                onClick={() => handleTypeSelect(typeInfo.type)}
                className={classNames(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                  selectedType === typeInfo.type
                    ? typeSelectedColors[typeInfo.type]
                    : typeColors[typeInfo.type]
                )}
              >
                <span className={typeTextColors[typeInfo.type]}>
                  {typeIcons[typeInfo.type]}
                </span>
                <span className="text-sm font-medium text-white">
                  {typeInfo.label}
                </span>
              </button>
            ))}
          </div>
          {selectedTypeInfo && (
            <p className="mt-2 text-sm text-theme-400">
              {selectedTypeInfo.description}
            </p>
          )}
        </div>

        {selectedType && (
          <>
            {/* Agent Name */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-2">
                Agent Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter agent name..."
                className="w-full bg-theme-900 border border-theme-700 rounded-lg px-4 py-2 text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
              />
            </div>

            {/* Model Selection */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-2">
                Model
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-theme-900 border border-theme-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-theme-500 appearance-none cursor-pointer"
              >
                {AVAILABLE_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.provider})
                  </option>
                ))}
              </select>
            </div>

            {/* Skills Selection */}
            <div>
              <label className="block text-sm font-medium text-theme-300 mb-2">
                Skills
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSkillsDropdown(!showSkillsDropdown)}
                  className="w-full flex items-center justify-between bg-theme-900 border border-theme-700 rounded-lg px-4 py-2 text-left focus:outline-none focus:border-theme-500"
                >
                  <span className="text-theme-400">
                    {selectedSkills.length === 0
                      ? "Select skills..."
                      : `${selectedSkills.length} skill${selectedSkills.length > 1 ? "s" : ""} selected`}
                  </span>
                  <ChevronDown
                    className={classNames(
                      "w-4 h-4 text-theme-400 transition-transform",
                      showSkillsDropdown && "rotate-180"
                    )}
                  />
                </button>

                {showSkillsDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSkillsDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-theme-800 border border-theme-700 rounded-xl shadow-xl z-20 max-h-60 overflow-hidden flex flex-col">
                      {/* Search */}
                      <div className="p-2 border-b border-theme-700">
                        <input
                          type="text"
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          placeholder="Search skills..."
                          className="w-full bg-theme-900 border border-theme-700 rounded-lg px-3 py-1.5 text-sm text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
                        />
                      </div>
                      {/* Skills List */}
                      <div className="overflow-y-auto p-1">
                        {filteredSkills.map((skill) => (
                          <button
                            key={skill}
                            onClick={() => toggleSkill(skill)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-theme-700 rounded-lg text-left"
                          >
                            <span
                              className={classNames(
                                "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                                selectedSkills.includes(skill)
                                  ? "bg-theme-500 border-theme-500"
                                  : "border-theme-600"
                              )}
                            >
                              {selectedSkills.includes(skill) && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </span>
                            <span className="text-white">{skill}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Selected Skills Tags */}
              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-theme-700 rounded-lg text-sm text-theme-300"
                    >
                      {skill}
                      <button
                        onClick={() => toggleSkill(skill)}
                        className="hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Optional: Project Assignment */}
            {projects.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-theme-900 border border-theme-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-theme-500 appearance-none cursor-pointer"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Optional: Task Assignment */}
            {tasks.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-theme-300 mb-2">
                  Assign to Task (Optional)
                </label>
                <select
                  value={taskId}
                  onChange={(e) => setTaskId(e.target.value)}
                  className="w-full bg-theme-900 border border-theme-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-theme-500 appearance-none cursor-pointer"
                >
                  <option value="">No task</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-theme-700">
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSpawn}
            disabled={!canSpawn}
          >
            <Plus className="w-4 h-4" />
            Spawn Agent
          </Button>
        </div>
      </div>
    </Modal>
  )
}
