"use client"

import { useState } from "react"
import type { ArchitectureMap } from "@/lib/types"
import ArchitectureMapComponent from "./ArchitectureMap"
import BugTracker from "./BugTracker"
import StatsPanel from "./StatsPanel"
import ChatSidebar from "./ChatSidebar"
import RefreshButton from "./RefreshButton"

type Props = {
  data: ArchitectureMap
  repoName: string
  branch: string
}

type Tab = "map" | "bugs" | "stats"

export default function Dashboard({ data, repoName, branch }: Props) {
  const [tab, setTab] = useState<Tab>("map")

  const tabs: { id: Tab; label: string }[] = [
    { id: "map", label: "Map" },
    { id: "bugs", label: `Bugs ${data.bugs.length > 0 ? `(${data.bugs.length})` : ""}` },
    { id: "stats", label: "Stats" },
  ]

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Left panel */}
      <div className="flex flex-col flex-1 min-w-0" style={{ width: "70%" }}>
        {/* Header */}
        <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-800 shrink-0">
          <span className="font-mono text-xl font-bold text-white tracking-tight">CodeMap</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-medium">
            {repoName}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400 border border-blue-800 font-mono">
            {branch}
          </span>
          <span className="text-xs text-gray-600 ml-2">
            Analyzed {new Date(data.summary.lastAnalyzed).toLocaleString()}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <RefreshButton />
            <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-gray-700 text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Summary banner */}
        <div className="px-6 py-3 bg-gray-900/50 border-b border-gray-800 shrink-0">
          <p className="text-gray-400 text-sm">{data.summary.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {data.summary.techStack.map((tech) => (
              <span key={tech} className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {tab === "map" && <ArchitectureMapComponent data={data} />}
          {tab === "bugs" && <BugTracker bugs={data.bugs} />}
          {tab === "stats" && <StatsPanel stats={data.stats} />}
        </div>
      </div>

      {/* Right chat panel */}
      <div className="shrink-0 border-l border-gray-800" style={{ width: "30%" }}>
        <ChatSidebar repoName={repoName} />
      </div>
    </div>
  )
}
