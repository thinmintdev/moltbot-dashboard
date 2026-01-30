"use client"

interface SectionHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-theme-400 mt-0.5">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

interface SectionCardProps {
  children: React.ReactNode
  className?: string
}

export function SectionCard({ children, className }: SectionCardProps) {
  return (
    <div
      className={`bg-theme-800/50 border border-theme-700 rounded-xl p-4 ${className || ""}`}
    >
      {children}
    </div>
  )
}
