"use client"

import { useState } from "react"
import classNames from "classnames"
import { format } from "date-fns"
import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react"
import {
  type ChangelogEntry as ChangelogEntryType,
  type ChangeType,
  getChangeTypeConfig,
  getVersionType,
} from "@/lib/stores/changelog-store"

// ============================================================================
// Types
// ============================================================================

interface ChangelogEntryProps {
  entry: ChangelogEntryType
  onEdit: (entry: ChangelogEntryType) => void
  onDelete: (id: string) => void
  isFirst?: boolean
  isLast?: boolean
}

// ============================================================================
// Helper Components
// ============================================================================

function VersionBadge({ version }: { version: string }) {
  const versionType = getVersionType(version)

  const colors = {
    major: { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
    minor: { bg: 'rgba(249, 115, 22, 0.15)', border: '#f97316', text: '#f97316' },
    patch: { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#22c55e' },
  }

  const { bg, border, text } = colors[versionType]

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-mono font-semibold border"
      style={{ backgroundColor: bg, borderColor: border, color: text }}
    >
      v{version}
    </span>
  )
}

function ChangeBadge({ type }: { type: ChangeType }) {
  const config = getChangeTypeConfig(type)

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide"
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      {config.label}
    </span>
  )
}

// ============================================================================
// Component
// ============================================================================

export function ChangelogEntry({
  entry,
  onEdit,
  onDelete,
  isFirst = false,
  isLast = false,
}: ChangelogEntryProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showActions, setShowActions] = useState(false)

  const formattedDate = format(new Date(entry.date), "MMMM d, yyyy")

  return (
    <div
      className="relative flex gap-4"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Timeline connector */}
      <div className="relative flex flex-col items-center">
        {/* Line above */}
        {!isFirst && (
          <div className="absolute bottom-1/2 w-0.5 h-full bg-gradient-to-t from-[#f97316]/50 to-transparent" />
        )}

        {/* Dot */}
        <div className="relative z-10 w-4 h-4 rounded-full bg-[#f97316] border-2 border-[#18181b] shadow-[0_0_8px_rgba(249,115,22,0.5)]" />

        {/* Line below */}
        {!isLast && (
          <div className="absolute top-1/2 w-0.5 h-full bg-gradient-to-b from-[#f97316]/50 to-transparent" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 pb-8">
        <div className="bg-[#111113] border border-[#27272a] rounded-lg overflow-hidden hover:border-[#3f3f46] transition-colors">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-[#18181b]/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <VersionBadge version={entry.version} />
              <div>
                <h3 className="text-[#fafafa] font-medium">{entry.title}</h3>
                <p className="text-[#71717a] text-sm">{formattedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Change count badge */}
              <span className="px-2 py-0.5 bg-[#27272a] text-[#a1a1aa] rounded text-xs">
                {entry.changes.length} change{entry.changes.length !== 1 && 's'}
              </span>

              {/* Expand/collapse icon */}
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-[#71717a]" />
              ) : (
                <ChevronDown className="w-5 h-5 text-[#71717a]" />
              )}
            </div>
          </button>

          {/* Changes list */}
          {isExpanded && (
            <div className="border-t border-[#27272a] p-4">
              <ul className="space-y-2">
                {entry.changes.map((change, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <ChangeBadge type={change.type} />
                    <span className="text-[#a1a1aa] text-sm leading-relaxed">
                      {change.description}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Action buttons - shown on hover */}
        {showActions && (
          <div className="absolute top-4 right-4 flex items-center gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-1.5 rounded bg-[#27272a]/80 text-[#a1a1aa] hover:text-[#fafafa] hover:bg-[#3f3f46] transition-colors"
              title="Edit version"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(entry.id)}
              className="p-1.5 rounded bg-[#27272a]/80 text-[#a1a1aa] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
              title="Delete version"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChangelogEntry
