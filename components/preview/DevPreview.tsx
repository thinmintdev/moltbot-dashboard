"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import classNames from "classnames"
import {
  RefreshCw,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Globe,
  Loader2,
  AlertCircle,
  Play,
  ExternalLink,
  PanelBottomClose,
  PanelBottom,
  Maximize2,
  Minimize2,
} from "lucide-react"
import { Button } from "../ui/Button"
import {
  ViewportSelector,
  Viewport,
  PRESET_VIEWPORTS,
} from "./ViewportSelector"
import {
  DevServerControl,
  ServerState,
  DetectedProject,
  ServerStatus,
} from "./DevServerControl"
import { ConsolePanel, LogEntry, LogLevel } from "./ConsolePanel"

// Common development server ports to check
const COMMON_PORTS = [3000, 3001, 5173, 5174, 8080, 8000, 4200, 4000]

interface DevPreviewProps {
  projectPath?: string
  initialUrl?: string
  className?: string
}

type PreviewState = "loading" | "ready" | "error" | "no-server"

export function DevPreview({
  projectPath = "/mnt/dev/repos/moltbot-dashboard",
  initialUrl,
  className,
}: DevPreviewProps) {
  // Preview state
  const [previewState, setPreviewState] = useState<PreviewState>("no-server")
  const [currentUrl, setCurrentUrl] = useState(initialUrl || "")
  const [urlInput, setUrlInput] = useState(initialUrl || "")
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Viewport state
  const [selectedViewport, setSelectedViewport] = useState<Viewport>(
    PRESET_VIEWPORTS[0]
  )
  const [isRotated, setIsRotated] = useState(false)
  const [scale, setScale] = useState(100)

  // Server state
  const [serverState, setServerState] = useState<ServerState>({
    status: "stopped",
    port: null,
    pid: null,
    startTime: null,
    uptime: 0,
  })
  const [detectedProject, setDetectedProject] = useState<DetectedProject | null>(
    null
  )

  // Console state
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [consolePreview, setConsolePreview] = useState<string[]>([])
  const [showConsole, setShowConsole] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Calculate viewport dimensions
  const viewportWidth = isRotated ? selectedViewport.height : selectedViewport.width
  const viewportHeight = isRotated ? selectedViewport.width : selectedViewport.height
  const scaledWidth = (viewportWidth * scale) / 100
  const scaledHeight = (viewportHeight * scale) / 100

  // Auto-detect running dev server
  const checkForRunningServer = useCallback(async () => {
    for (const port of COMMON_PORTS) {
      try {
        // In a real implementation, this would check if a server is running
        // For now, we simulate detection
        const url = `http://localhost:${port}`

        // Set the detected server
        if (port === 3000) {
          setServerState({
            status: "running",
            port,
            pid: null,
            startTime: new Date(),
            uptime: 0,
          })
          setCurrentUrl(url)
          setUrlInput(url)
          setPreviewState("ready")
          return true
        }
      } catch {
        // Port not available, continue checking
      }
    }
    return false
  }, [])

  // Detect project type on mount
  useEffect(() => {
    // In a real implementation, we would read the file system
    // For now, set Next.js as detected since this is a Next.js project
    setDetectedProject({
      type: "nextjs",
      name: "Next.js",
      command: "npm run dev",
      port: 3000,
      icon: null,
      configFile: "next.config.js",
    })
  }, [projectPath])

  // Update uptime counter
  useEffect(() => {
    if (serverState.status !== "running" || !serverState.startTime) return

    const interval = setInterval(() => {
      const seconds = Math.floor(
        (Date.now() - serverState.startTime!.getTime()) / 1000
      )
      setServerState((prev) => ({ ...prev, uptime: seconds }))
    }, 1000)

    return () => clearInterval(interval)
  }, [serverState.status, serverState.startTime])

  // Navigation handlers
  const handleNavigate = useCallback(
    (url: string) => {
      if (!url.startsWith("http")) {
        url = `http://${url}`
      }
      setCurrentUrl(url)
      setUrlInput(url)
      setHistory((prev) => [...prev.slice(0, historyIndex + 1), url])
      setHistoryIndex((prev) => prev + 1)
      setPreviewState("loading")
    },
    [historyIndex]
  )

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleNavigate(urlInput)
  }

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      const url = history[newIndex]
      setCurrentUrl(url)
      setUrlInput(url)
    }
  }

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      const url = history[newIndex]
      setCurrentUrl(url)
      setUrlInput(url)
    }
  }

  const handleRefresh = () => {
    if (iframeRef.current) {
      iframeRef.current.src = currentUrl
      setPreviewState("loading")
    }
  }

  // Server control handlers
  const handleStartServer = useCallback(() => {
    setServerState((prev) => ({ ...prev, status: "starting" }))

    // Simulate server startup
    addLog("info", "Starting development server...")
    addLog("log", `$ ${detectedProject?.command || "npm run dev"}`)

    setTimeout(() => {
      const port = detectedProject?.port || 3000
      addLog("info", `Server running on http://localhost:${port}`)
      setServerState({
        status: "running",
        port,
        pid: Math.floor(Math.random() * 10000),
        startTime: new Date(),
        uptime: 0,
      })
      const url = `http://localhost:${port}`
      setCurrentUrl(url)
      setUrlInput(url)
      setPreviewState("ready")
    }, 2000)
  }, [detectedProject])

  const handleStopServer = useCallback(() => {
    addLog("info", "Stopping server...")
    setServerState({
      status: "stopped",
      port: null,
      pid: null,
      startTime: null,
      uptime: 0,
    })
    setPreviewState("no-server")
    addLog("info", "Server stopped")
  }, [])

  const handleRestartServer = useCallback(() => {
    handleStopServer()
    setTimeout(() => handleStartServer(), 500)
  }, [handleStopServer, handleStartServer])

  const handleOpenInBrowser = useCallback(() => {
    if (currentUrl) {
      window.open(currentUrl, "_blank")
    }
  }, [currentUrl])

  // Console handlers
  const addLog = (level: LogLevel, message: string) => {
    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      level,
      message,
    }
    setLogs((prev) => [...prev, entry])
    setConsolePreview((prev) => [...prev.slice(-9), message])
  }

  const clearLogs = () => {
    setLogs([])
    setConsolePreview([])
  }

  // Iframe load handlers
  const handleIframeLoad = () => {
    setPreviewState("ready")
  }

  const handleIframeError = () => {
    setPreviewState("error")
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else if (document.fullscreenElement) {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={classNames(
        "flex flex-col bg-theme-950 rounded-xl overflow-hidden border border-theme-800",
        className
      )}
    >
      {/* Browser Chrome / URL Bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-theme-900 border-b border-theme-800">
        {/* Navigation Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleBack}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded text-theme-400 hover:text-white hover:bg-theme-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={handleForward}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded text-theme-400 hover:text-white hover:bg-theme-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={handleRefresh}
            disabled={previewState === "no-server"}
            className="p-1.5 rounded text-theme-400 hover:text-white hover:bg-theme-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={16} className={previewState === "loading" ? "animate-spin" : ""} />
          </button>
        </div>

        {/* URL Bar */}
        <form onSubmit={handleUrlSubmit} className="flex-1 flex items-center">
          <div className="flex-1 relative">
            <Globe
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-500"
            />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-theme-800 border border-theme-700 rounded-lg text-white placeholder-theme-500 focus:outline-none focus:border-theme-500"
            />
          </div>
        </form>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={classNames(
              "p-1.5 rounded transition-colors",
              showConsole
                ? "bg-theme-600 text-white"
                : "text-theme-400 hover:text-white hover:bg-theme-700"
            )}
            title={showConsole ? "Hide console" : "Show console"}
          >
            {showConsole ? <PanelBottomClose size={16} /> : <PanelBottom size={16} />}
          </button>
          <button
            onClick={handleOpenInBrowser}
            disabled={!currentUrl}
            className="p-1.5 rounded text-theme-400 hover:text-white hover:bg-theme-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Open in browser"
          >
            <ExternalLink size={16} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded text-theme-400 hover:text-white hover:bg-theme-700 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Viewport Selector Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-theme-900/50 border-b border-theme-800">
        <ViewportSelector
          selectedViewport={selectedViewport}
          onViewportChange={setSelectedViewport}
          isRotated={isRotated}
          onRotate={() => setIsRotated(!isRotated)}
          scale={scale}
          onScaleChange={setScale}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Preview Container */}
        <div
          className="flex-1 flex items-center justify-center bg-theme-950 p-4 overflow-auto"
          style={{ minHeight: "400px" }}
        >
          {previewState === "no-server" ? (
            // No server running
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-theme-800 flex items-center justify-center">
                <AlertCircle size={32} className="text-theme-500" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">
                  No Dev Server Running
                </h3>
                <p className="text-sm text-theme-400 max-w-sm">
                  Start a development server to preview your application.
                  {detectedProject && (
                    <span className="block mt-1 text-theme-500">
                      Detected: {detectedProject.name} project
                    </span>
                  )}
                </p>
              </div>
              <Button onClick={handleStartServer} variant="success">
                <Play size={16} />
                Start Server
              </Button>
            </div>
          ) : previewState === "loading" ? (
            // Loading state
            <div className="flex flex-col items-center justify-center gap-3">
              <Loader2 size={32} className="text-theme-500 animate-spin" />
              <span className="text-sm text-theme-400">Loading preview...</span>
            </div>
          ) : previewState === "error" ? (
            // Error state
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertCircle size={32} className="text-rose-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">
                  Failed to Load Preview
                </h3>
                <p className="text-sm text-theme-400 max-w-sm">
                  The page could not be loaded. Check if the server is running
                  correctly.
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRefresh} variant="secondary">
                  <RefreshCw size={16} />
                  Retry
                </Button>
                <Button onClick={handleRestartServer} variant="ghost">
                  <RotateCw size={16} />
                  Restart Server
                </Button>
              </div>
            </div>
          ) : (
            // Preview iframe
            <div
              className="relative bg-white rounded-lg shadow-2xl shadow-black/50 overflow-hidden"
              style={{
                width: scaledWidth,
                height: scaledHeight,
                maxWidth: "100%",
                maxHeight: "100%",
              }}
            >
              <iframe
                ref={iframeRef}
                src={currentUrl}
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                className="w-full h-full border-0"
                style={{
                  width: viewportWidth,
                  height: viewportHeight,
                  transform: `scale(${scale / 100})`,
                  transformOrigin: "top left",
                }}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                title="Development Preview"
              />
            </div>
          )}
        </div>

        {/* Console Panel (Collapsible) */}
        {showConsole && (
          <div className="border-t border-theme-800">
            <ConsolePanel
              logs={logs}
              onClear={clearLogs}
              maxHeight="200px"
            />
          </div>
        )}
      </div>

      {/* Server Control Panel (Bottom) */}
      <div className="border-t border-theme-800">
        <DevServerControl
          projectPath={projectPath}
          serverState={serverState}
          detectedProject={detectedProject}
          consolePreview={consolePreview}
          onStart={handleStartServer}
          onStop={handleStopServer}
          onRestart={handleRestartServer}
          onOpenInBrowser={handleOpenInBrowser}
        />
      </div>
    </div>
  )
}
