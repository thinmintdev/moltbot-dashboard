"use client"

import { useState, useMemo } from "react"
import { Bot, FileText, Code, File, Link as LinkIcon, Copy, CheckCircle, AlertCircle } from "lucide-react"
import classNames from "classnames"
import type { ContextDocument, ContextDocumentType } from "@/lib/stores/context-store"
import { estimateTokens } from "@/lib/stores/context-store"

// ============================================================================
// Helper Functions
// ============================================================================

function getTypeIcon(type: ContextDocumentType) {
  switch (type) {
    case "file":
      return File
    case "snippet":
      return Code
    case "note":
      return FileText
    case "link":
      return LinkIcon
    default:
      return FileText
  }
}

function getTypeColor(type: ContextDocumentType) {
  switch (type) {
    case "file":
      return "text-[#3b82f6]"
    case "snippet":
      return "text-[#a855f7]"
    case "note":
      return "text-[#22c55e]"
    case "link":
      return "text-[#f97316]"
    default:
      return "text-[#71717a]"
  }
}

function formatTokenCount(tokens: number): string {
  if (tokens < 1000) return tokens.toString()
  return `${(tokens / 1000).toFixed(1)}k`
}

// ============================================================================
// Component Props
// ============================================================================

interface ContextPreviewProps {
  documents: ContextDocument[]
  maxTokens?: number
}

// ============================================================================
// Component
// ============================================================================

export function ContextPreview({ documents, maxTokens = 100000 }: ContextPreviewProps) {
  const [copied, setCopied] = useState(false)

  // Calculate token estimates
  const tokenData = useMemo(() => {
    const items = documents.map((doc) => {
      const contentTokens = estimateTokens(doc.content)
      const titleTokens = estimateTokens(doc.title)
      const overhead = 10 // metadata overhead
      return {
        doc,
        tokens: contentTokens + titleTokens + overhead,
      }
    })

    const totalTokens = items.reduce((sum, item) => sum + item.tokens, 0)
    const percentage = (totalTokens / maxTokens) * 100

    return { items, totalTokens, percentage }
  }, [documents, maxTokens])

  // Format context for clipboard
  const formattedContext = useMemo(() => {
    if (documents.length === 0) return ""

    return documents
      .map((doc) => {
        const header = `### ${doc.title} (${doc.type})`
        const metadata = doc.path
          ? `Path: ${doc.path}`
          : doc.url
          ? `URL: ${doc.url}`
          : ""
        const tags = doc.tags.length > 0 ? `Tags: ${doc.tags.join(", ")}` : ""

        return [header, metadata, tags, "", doc.content].filter(Boolean).join("\n")
      })
      .join("\n\n---\n\n")
  }, [documents])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedContext)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const tokenPercentage = Math.min(tokenData.percentage, 100)
  const isOverLimit = tokenData.totalTokens > maxTokens

  return (
    <div className="h-full flex flex-col bg-[#111113] border border-[#27272a] rounded-lg overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-[#27272a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-[#f97316]" />
            <h3 className="text-[#fafafa] font-medium text-sm">AI Context Preview</h3>
          </div>
          <button
            onClick={handleCopy}
            disabled={documents.length === 0}
            className={classNames(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors",
              documents.length === 0
                ? "text-[#52525b] cursor-not-allowed"
                : copied
                ? "text-[#22c55e] bg-[#22c55e]/10"
                : "text-[#71717a] hover:text-[#fafafa] hover:bg-[#27272a]"
            )}
          >
            {copied ? (
              <>
                <CheckCircle size={12} />
                Copied
              </>
            ) : (
              <>
                <Copy size={12} />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Token Usage */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#71717a]">Token Usage</span>
            <span className={classNames(
              isOverLimit ? "text-[#ef4444]" : "text-[#a1a1aa]"
            )}>
              {formatTokenCount(tokenData.totalTokens)} / {formatTokenCount(maxTokens)}
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
            <div
              className={classNames(
                "h-full rounded-full transition-all",
                isOverLimit
                  ? "bg-[#ef4444]"
                  : tokenPercentage > 75
                  ? "bg-[#fbbf24]"
                  : "bg-gradient-to-r from-[#ef4444] to-[#f97316]"
              )}
              style={{ width: `${tokenPercentage}%` }}
            />
          </div>
          {isOverLimit && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[#ef4444]">
              <AlertCircle size={10} />
              Context exceeds token limit. Some content may be truncated.
            </div>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-y-auto p-4">
        {documents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center mb-3">
              <FileText size={20} className="text-[#52525b]" />
            </div>
            <p className="text-[#71717a] text-sm">No active documents</p>
            <p className="text-[#52525b] text-xs mt-1">
              Toggle documents to include them in AI context
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {tokenData.items.map(({ doc, tokens }) => {
              const Icon = getTypeIcon(doc.type)
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2 rounded bg-[#18181b] border border-[#27272a]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon size={14} className={getTypeColor(doc.type)} />
                    <span className="text-[#fafafa] text-xs truncate">
                      {doc.title}
                    </span>
                  </div>
                  <span className="text-[#52525b] text-[10px] font-mono shrink-0 ml-2">
                    ~{formatTokenCount(tokens)} tokens
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Content */}
      {documents.length > 0 && (
        <div className="shrink-0 border-t border-[#27272a]">
          <details className="group">
            <summary className="px-4 py-2 cursor-pointer text-xs text-[#71717a] hover:text-[#a1a1aa] transition-colors list-none flex items-center justify-between">
              <span>View Formatted Context</span>
              <span className="text-[10px] text-[#52525b] group-open:rotate-180 transition-transform">
                Show
              </span>
            </summary>
            <div className="max-h-48 overflow-y-auto px-4 pb-4">
              <pre className="text-[10px] text-[#71717a] font-mono whitespace-pre-wrap break-all bg-[#0a0a0b] p-3 rounded border border-[#27272a]">
                {formattedContext}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}

export default ContextPreview
