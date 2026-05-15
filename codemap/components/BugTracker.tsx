import type { ArchitectureMap } from "@/lib/types"

type Bug = ArchitectureMap["bugs"][0]

const severityConfig = {
  high: { label: "High", bg: "bg-red-900/40", text: "text-red-400", border: "border-red-800" },
  med: { label: "Med", bg: "bg-amber-900/40", text: "text-amber-400", border: "border-amber-800" },
  low: { label: "Low", bg: "bg-teal-900/40", text: "text-teal-400", border: "border-teal-800" },
}

const categoryLabels: Record<Bug["category"], string> = {
  security: "Security",
  performance: "Performance",
  "error-handling": "Error Handling",
  "type-safety": "Type Safety",
  other: "Other",
}

function BugCard({ bug }: { bug: Bug }) {
  const sev = severityConfig[bug.severity]
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${sev.bg} ${sev.text} ${sev.border}`}>
          {sev.label}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400">
          {categoryLabels[bug.category]}
        </span>
        <span className="text-xs font-mono text-gray-500 ml-auto">{bug.file}</span>
      </div>
      <div>
        <h3 className="text-white font-medium text-sm mb-1">{bug.title}</h3>
        <p className="text-gray-400 text-sm">{bug.description}</p>
      </div>
      <div className="rounded bg-gray-800/80 border border-gray-700 px-3 py-2">
        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Suggested Fix</p>
        <p className="text-gray-300 text-sm">{bug.fix}</p>
      </div>
    </div>
  )
}

type Props = {
  bugs: ArchitectureMap["bugs"]
}

export default function BugTracker({ bugs }: Props) {
  const sorted = [...bugs].sort((a, b) => {
    const order = { high: 0, med: 1, low: 2 }
    return order[a.severity] - order[b.severity]
  })

  const counts = {
    high: bugs.filter((b) => b.severity === "high").length,
    med: bugs.filter((b) => b.severity === "med").length,
    low: bugs.filter((b) => b.severity === "low").length,
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex gap-3">
        <div className="flex-1 rounded-lg bg-red-900/20 border border-red-900 p-3 text-center">
          <div className="text-2xl font-bold text-red-400">{counts.high}</div>
          <div className="text-xs text-red-500 mt-0.5">High</div>
        </div>
        <div className="flex-1 rounded-lg bg-amber-900/20 border border-amber-900 p-3 text-center">
          <div className="text-2xl font-bold text-amber-400">{counts.med}</div>
          <div className="text-xs text-amber-500 mt-0.5">Medium</div>
        </div>
        <div className="flex-1 rounded-lg bg-teal-900/20 border border-teal-900 p-3 text-center">
          <div className="text-2xl font-bold text-teal-400">{counts.low}</div>
          <div className="text-xs text-teal-500 mt-0.5">Low</div>
        </div>
      </div>

      {/* Bug cards */}
      <div className="space-y-3">
        {sorted.map((bug) => (
          <BugCard key={bug.id} bug={bug} />
        ))}
      </div>
    </div>
  )
}
