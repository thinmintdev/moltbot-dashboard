"use client"

import { useState } from "react"
import classNames from "classnames"
import {
  Monitor,
  Laptop,
  Tablet,
  Smartphone,
  RotateCw,
  Maximize2,
} from "lucide-react"
import { Button } from "../ui/Button"

export interface Viewport {
  name: string
  width: number
  height: number
  icon: React.ReactNode
}

export const PRESET_VIEWPORTS: Viewport[] = [
  { name: "Desktop", width: 1920, height: 1080, icon: <Monitor size={16} /> },
  { name: "Laptop", width: 1366, height: 768, icon: <Laptop size={16} /> },
  { name: "Tablet", width: 768, height: 1024, icon: <Tablet size={16} /> },
  { name: "Mobile", width: 375, height: 667, icon: <Smartphone size={16} /> },
]

interface ViewportSelectorProps {
  selectedViewport: Viewport
  onViewportChange: (viewport: Viewport) => void
  isRotated: boolean
  onRotate: () => void
  scale: number
  onScaleChange: (scale: number) => void
  className?: string
}

export function ViewportSelector({
  selectedViewport,
  onViewportChange,
  isRotated,
  onRotate,
  scale,
  onScaleChange,
  className,
}: ViewportSelectorProps) {
  const [customWidth, setCustomWidth] = useState(selectedViewport.width)
  const [customHeight, setCustomHeight] = useState(selectedViewport.height)
  const [showCustom, setShowCustom] = useState(false)

  const handleCustomApply = () => {
    onViewportChange({
      name: "Custom",
      width: customWidth,
      height: customHeight,
      icon: <Maximize2 size={16} />,
    })
  }

  const displayWidth = isRotated ? selectedViewport.height : selectedViewport.width
  const displayHeight = isRotated ? selectedViewport.width : selectedViewport.height

  return (
    <div className={classNames("flex items-center gap-3", className)}>
      {/* Preset Viewports */}
      <div className="flex items-center gap-1 bg-theme-800 rounded-lg p-1">
        {PRESET_VIEWPORTS.map((viewport) => (
          <button
            key={viewport.name}
            onClick={() => {
              onViewportChange(viewport)
              setShowCustom(false)
            }}
            className={classNames(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
              selectedViewport.name === viewport.name && !showCustom
                ? "bg-theme-600 text-white"
                : "text-theme-400 hover:text-white hover:bg-theme-700"
            )}
            title={`${viewport.width}x${viewport.height}`}
          >
            {viewport.icon}
            <span className="hidden sm:inline">{viewport.name}</span>
          </button>
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={classNames(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
            showCustom
              ? "bg-theme-600 text-white"
              : "text-theme-400 hover:text-white hover:bg-theme-700"
          )}
        >
          <Maximize2 size={16} />
          <span className="hidden sm:inline">Custom</span>
        </button>
      </div>

      {/* Custom Size Input */}
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={customWidth}
            onChange={(e) => setCustomWidth(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs bg-theme-800 border border-theme-700 rounded text-white focus:outline-none focus:border-theme-500"
            placeholder="Width"
            min={320}
            max={3840}
          />
          <span className="text-theme-500">x</span>
          <input
            type="number"
            value={customHeight}
            onChange={(e) => setCustomHeight(Number(e.target.value))}
            className="w-16 px-2 py-1 text-xs bg-theme-800 border border-theme-700 rounded text-white focus:outline-none focus:border-theme-500"
            placeholder="Height"
            min={320}
            max={2160}
          />
          <Button size="sm" onClick={handleCustomApply}>
            Apply
          </Button>
        </div>
      )}

      {/* Rotate Button */}
      <button
        onClick={onRotate}
        className={classNames(
          "p-2 rounded-lg transition-colors",
          isRotated
            ? "bg-theme-600 text-white"
            : "bg-theme-800 text-theme-400 hover:text-white hover:bg-theme-700"
        )}
        title="Rotate viewport"
      >
        <RotateCw size={16} className={isRotated ? "rotate-90" : ""} />
      </button>

      {/* Current Dimensions Display */}
      <span className="text-xs text-theme-500 tabular-nums">
        {displayWidth} x {displayHeight}
      </span>

      {/* Scale Slider */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-theme-500">Scale:</span>
        <input
          type="range"
          min={25}
          max={100}
          value={scale}
          onChange={(e) => onScaleChange(Number(e.target.value))}
          className="w-20 h-1.5 bg-theme-700 rounded-lg appearance-none cursor-pointer accent-theme-500"
        />
        <span className="text-xs text-theme-400 w-8 tabular-nums">{scale}%</span>
      </div>
    </div>
  )
}
