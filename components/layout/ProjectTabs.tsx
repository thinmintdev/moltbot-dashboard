"use client"

import { useState, useRef, useEffect } from "react"
import { X, Plus, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import classNames from "classnames"

export interface ProjectTab {
  id: string
  name: string
  color?: string
  isActive?: boolean
}

interface ProjectTabsProps {
  tabs: ProjectTab[]
  activeTabId: string | null
  onSelectTab: (tabId: string) => void
  onCloseTab: (tabId: string) => void
  onAddTab: () => void
  onTabSettings?: (tabId: string) => void
}

export function ProjectTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onAddTab,
  onTabSettings,
}: ProjectTabsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll state
  const checkScroll = () => {
    const container = scrollContainerRef.current
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      )
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener("resize", checkScroll)
    return () => window.removeEventListener("resize", checkScroll)
  }, [tabs])

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: "smooth" })
    }
  }

  return (
    <div className="h-10 bg-[#0a0a0b] border-b border-[#27272a] flex items-stretch">
      {/* Scroll left button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="px-2 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkScroll}
        className="flex-1 flex items-stretch overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={classNames(
              "group flex items-center gap-2 px-4 min-w-[120px] max-w-[200px] border-r border-[#27272a] cursor-pointer transition-colors",
              tab.id === activeTabId
                ? "bg-[#18181b] text-[#fafafa]"
                : "bg-transparent text-[#71717a] hover:bg-[#111113] hover:text-[#a1a1aa]"
            )}
            onClick={() => onSelectTab(tab.id)}
          >
            {/* Color indicator */}
            {tab.color && (
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tab.color }}
              />
            )}

            {/* Tab name */}
            <span className="flex-1 truncate text-sm font-medium">
              {tab.name}
            </span>

            {/* Tab actions (visible on hover or when active) */}
            <div className={classNames(
              "flex items-center gap-1 transition-opacity",
              tab.id === activeTabId ? "opacity-100" : "opacity-0 group-hover:opacity-100"
            )}>
              {/* Settings button */}
              {onTabSettings && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onTabSettings(tab.id)
                  }}
                  className="p-0.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#fafafa] transition-colors"
                >
                  <Settings className="w-3 h-3" />
                </button>
              )}

              {/* Close button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseTab(tab.id)
                }}
                className="p-0.5 rounded hover:bg-[#27272a] text-[#71717a] hover:text-[#fafafa] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Scroll right button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="px-2 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {/* Add tab button */}
      <button
        onClick={onAddTab}
        className="px-3 text-[#71717a] hover:text-[#fafafa] hover:bg-[#18181b] border-l border-[#27272a] transition-colors"
        title="Add project"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

export default ProjectTabs
