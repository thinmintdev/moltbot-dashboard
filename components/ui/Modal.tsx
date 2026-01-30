import classNames from "classnames"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  if (!open) return null

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={classNames(
          "bg-[#18181b] rounded-xl border border-[#27272a] w-full max-h-[90vh] flex flex-col",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[#27272a] shrink-0">
          <h3 className="text-lg font-semibold text-[#fafafa]">{title}</h3>
          <button
            onClick={onClose}
            className="text-[#71717a] hover:text-[#fafafa] text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
