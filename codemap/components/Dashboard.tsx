"use client"

import { useState, useCallback } from "react"
import dynamic from "next/dynamic"
import type { ArchitectureMap } from "@/lib/types"
import BugTracker from "./BugTracker"
import StatsPanel from "./StatsPanel"
import ChatSidebar from "./ChatSidebar"
import RefreshButton from "./RefreshButton"

const InteractiveMap = dynamic(() => import("./InteractiveMap"), { ssr: false })
const InteractiveFilesMap = dynamic(() => import("./InteractiveFilesMap"), { ssr: false })

type Tab = "map" | "files" | "bugs" | "stats"

type Props = {
  data: ArchitectureMap
  repoName: string
  branch: string
}

export default function Dashboard({ data, repoName, branch }: Props) {
  const [tab, setTab] = useState<Tab>("map")
  const [prefillMessage, setPrefillMessage] = useState<string | undefined>()

  const handleFileClick = useCallback((msg: string) => {
    setPrefillMessage(undefined)
    // Small delay so useEffect in ChatSidebar fires even if same message
    setTimeout(() => setPrefillMessage(msg), 10)
  }, [])

  const tabs: { id: Tab; label: string }[] = [
    { id: "map", label: "Layers" },
    { id: "files", label: "Files" },
    { id: "bugs", label: `Bugs${data.bugs.length > 0 ? ` (${data.bugs.length})` : ""}` },
    { id: "stats", label: "Stats" },
  ]

  const isGraphTab = tab === "map" || tab === "files"

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Left panel */}
      <div className="flex flex-col min-w-0" style={{ width: "70%" }}>
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-3 border-b border-gray-800 shrink-0">
          <span className="font-mono text-lg font-black tracking-tight" style={{ color: "#ff0000" }}>Code</span>
          <span className="font-mono text-lg font-black tracking-tight text-white -ml-2">Map</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium">{repoName}</span>
          <span className="text-xs px-2 py-0.5 rounded-full border font-mono" style={{ background: "#0000ff22", color: "#0000ff", borderColor: "#0000ff55" }}>
            {branch}
          </span>
          <span className="text-xs text-gray-700 ml-1 hidden sm:block">
            {new Date(data.summary.lastAnalyzed).toLocaleString()}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <RefreshButton />
            <div className="flex gap-0.5 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className="px-3 py-1 rounded-md text-sm font-medium transition-colors"
                  style={tab === t.id
                    ? { background: "#ff0000", color: "#ffffff" }
                    : { color: "#6b7280" }
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Summary */}
        <div className="px-6 py-2.5 bg-gray-900/40 border-b border-gray-800 shrink-0">
          <p className="text-gray-400 text-sm">{data.summary.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {data.summary.techStack.map((tech) => (
              <span key={tech} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500">{tech}</span>
            ))}
          </div>
        </div>

        {/* Tab content */}
        {isGraphTab ? (
          <div className="flex-1 min-h-0">
            {tab === "map" && <InteractiveMap data={data} onFileClick={handleFileClick} />}
            {tab === "files" && <InteractiveFilesMap data={data} onFileClick={handleFileClick} />}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {tab === "bugs" && <BugTracker bugs={data.bugs} />}
            {tab === "stats" && <StatsPanel data={data} />}
          </div>
        )}
      </div>

      {/* Right chat panel */}
      <div className="shrink-0 border-l border-gray-800" style={{ width: "30%" }}>
        <ChatSidebar
          repoName={repoName}
          prefillMessage={prefillMessage}
          onPrefillConsumed={() => setPrefillMessage(undefined)}
        />
      </div>
    </div>
  )
}
