import classNames from "classnames"

interface TabProps {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  badge?: number
}

export function Tab({ active, onClick, children, badge }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        "px-5 py-3 text-sm font-medium transition-colors border-b-2 relative",
        active
          ? "border-theme-500 text-white"
          : "border-transparent text-theme-400 hover:text-white hover:border-theme-600"
      )}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-theme-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  )
}
