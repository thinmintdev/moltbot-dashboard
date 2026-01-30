export type AgentStatus = "running" | "paused" | "error" | "idle"

export type AgentType = "orchestrator" | "coder" | "researcher" | "planner" | "tester" | "reviewer" | "custom"

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface Agent {
  id: string
  name: string
  type: AgentType
  status: AgentStatus
  model: string
  currentTask?: string
  taskId?: string
  progress: number
  tokensUsed: number
  maxTokens: number
  createdAt: Date
  projectId?: string
  skills: string[]
}

export interface LogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  agentId: string
  agentName: string
  taskId?: string
  message: string
}

export interface AgentTypeInfo {
  type: AgentType
  label: string
  description: string
  icon: string
  defaultSkills: string[]
}

export const AGENT_TYPES: AgentTypeInfo[] = [
  {
    type: "orchestrator",
    label: "Orchestrator",
    description: "Coordinates other agents and manages workflow execution",
    icon: "Crown",
    defaultSkills: ["coordination", "task-delegation", "workflow-management"],
  },
  {
    type: "coder",
    label: "Coder",
    description: "Writes and refactors code, implements features",
    icon: "Code2",
    defaultSkills: ["code-generation", "refactoring", "debugging"],
  },
  {
    type: "researcher",
    label: "Researcher",
    description: "Gathers information and analyzes requirements",
    icon: "Search",
    defaultSkills: ["web-search", "documentation", "analysis"],
  },
  {
    type: "planner",
    label: "Planner",
    description: "Creates task breakdowns and project plans",
    icon: "Map",
    defaultSkills: ["task-planning", "estimation", "prioritization"],
  },
  {
    type: "tester",
    label: "Tester",
    description: "Writes and runs tests, validates implementations",
    icon: "FlaskConical",
    defaultSkills: ["test-generation", "test-execution", "coverage-analysis"],
  },
  {
    type: "reviewer",
    label: "Reviewer",
    description: "Reviews code and provides feedback",
    icon: "CheckCircle",
    defaultSkills: ["code-review", "best-practices", "security-audit"],
  },
  {
    type: "custom",
    label: "Custom",
    description: "A custom agent with user-defined skills",
    icon: "Sparkles",
    defaultSkills: [],
  },
]

export const AVAILABLE_SKILLS = [
  "code-generation",
  "refactoring",
  "debugging",
  "test-generation",
  "test-execution",
  "coverage-analysis",
  "code-review",
  "best-practices",
  "security-audit",
  "web-search",
  "documentation",
  "analysis",
  "task-planning",
  "estimation",
  "prioritization",
  "coordination",
  "task-delegation",
  "workflow-management",
  "file-operations",
  "git-operations",
  "shell-commands",
]

export const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4", provider: "Anthropic" },
  { id: "claude-opus-4-20250514", name: "Claude Opus 4", provider: "Anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "llama-3.1-70b", name: "Llama 3.1 70B", provider: "Meta" },
]
