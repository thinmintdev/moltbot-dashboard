"use client"

export default function ChatTab({ currentModel }: { currentModel: string | null }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-theme-500">
        <p className="text-4xl mb-4">💬</p>
        <p>Chat component - Coming soon</p>
        <p className="text-sm mt-2">Model: {currentModel || "default"}</p>
      </div>
    </div>
  )
}
