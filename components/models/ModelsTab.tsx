"use client"

interface ModelsTabProps {
  currentModel: string | null
  onModelChange: (model: string) => void
}

export default function ModelsTab({ currentModel, onModelChange }: ModelsTabProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center text-theme-500">
        <p className="text-4xl mb-4">🤖</p>
        <p>Models component - Coming soon</p>
        <p className="text-sm mt-2">Current: {currentModel || "Not set"}</p>
      </div>
    </div>
  )
}
