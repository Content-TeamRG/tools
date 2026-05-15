import type { ArchitectureMap } from "@/lib/types"

type Bug = ArchitectureMap["bugs"][0]

const SEV = {
  high: { label: "High", color: "#ff0000", bg: "#ff000011", border: "#ff000044" },
  med:  { label: "Med",  color: "#ff991c", bg: "#ff991c11", border: "#ff991c44" },
  low:  { label: "Low",  color: "#008000", bg: "#00800011", border: "#00800044" },
}

const CAT: Record<Bug["category"], string> = {
  security: "Security",
  performance: "Performance",
  "error-handling": "Error Handling",
  "type-safety": "Type Safety",
  other: "Other",
}

function BugCard({ bug }: { bug: Bug }) {
  const sev = SEV[bug.severity]
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="text-xs px-2.5 py-0.5 rounded-full font-bold border"
          style={{ color: sev.color, background: sev.bg, borderColor: sev.border }}
        >
          {sev.label}
        </span>
        <span className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-500">
          {CAT[bug.category]}
        </span>
        <span className="text-xs font-mono text-gray-600 ml-auto truncate max-w-[180px]">{bug.file}</span>
      </div>

      <div>
        <h3 className="text-white font-semibold text-sm mb-1">{bug.title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed">{bug.description}</p>
      </div>

      <div
        className="rounded-lg px-3 py-2.5 border"
        style={{ background: "#00800011", borderColor: "#00800044" }}
      >
        <p className="text-xs font-bold mb-1" style={{ color: "#008000" }}>Suggested Fix</p>
        <p className="text-sm text-gray-300">{bug.fix}</p>
      </div>
    </div>
  )
}

export default function BugTracker({ bugs }: { bugs: ArchitectureMap["bugs"] }) {
  const sorted = [...bugs].sort((a, b) => {
    const o = { high: 0, med: 1, low: 2 }
    return o[a.severity] - o[b.severity]
  })

  const counts = {
    high: bugs.filter((b) => b.severity === "high").length,
    med:  bugs.filter((b) => b.severity === "med").length,
    low:  bugs.filter((b) => b.severity === "low").length,
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex gap-3">
        {(["high", "med", "low"] as const).map((s) => (
          <div
            key={s}
            className="flex-1 rounded-xl border p-4 text-center"
            style={{ background: SEV[s].bg, borderColor: SEV[s].border }}
          >
            <div className="text-3xl font-black" style={{ color: SEV[s].color }}>{counts[s]}</div>
            <div className="text-xs font-semibold mt-1" style={{ color: SEV[s].color + "cc" }}>{SEV[s].label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((bug) => <BugCard key={bug.id} bug={bug} />)}
      </div>
    </div>
  )
}
