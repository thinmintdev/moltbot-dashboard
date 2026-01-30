import classNames from "classnames"

interface StatusBadgeProps {
  online: boolean
  label?: string
}

export function StatusBadge({ online, label }: StatusBadgeProps) {
  return (
    <span
      className={classNames(
        "px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1",
        online
          ? "bg-emerald-500/20 text-emerald-400"
          : "bg-rose-500/20 text-rose-400"
      )}
    >
      <span
        className={classNames(
          "w-1.5 h-1.5 rounded-full",
          online ? "bg-emerald-400" : "bg-rose-400"
        )}
      />
      {label || (online ? "Online" : "Offline")}
    </span>
  )
}
