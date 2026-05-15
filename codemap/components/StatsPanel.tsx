import type { ArchitectureMap } from "@/lib/types"

type Props = {
  stats: ArchitectureMap["stats"]
  files: ArchitectureMap["layers"][0]["files"][]
}

const statCards = [
  { key: "totalFiles", label: "Total Files", color: "text-blue-400" },
  { key: "tsFiles", label: "TypeScript Files", color: "text-purple-400" },
  { key: "apiRoutes", label: "API Routes", color: "text-green-400" },
  { key: "components", label: "Components", color: "text-pink-400" },
  { key: "linesEstimate", label: "Lines (est.)", color: "text-amber-400" },
] as const

type FileTypeEntry = { label: string; count: number; color: string }

export default function StatsPanel({ stats }: { stats: ArchitectureMap["stats"] }) {
  const fileTypes: FileTypeEntry[] = [
    { label: ".ts / .tsx", count: stats.tsFiles, color: "#818cf8" },
    { label: "API Routes", count: stats.apiRoutes, color: "#34d399" },
    { label: "Components", count: stats.components, color: "#f472b6" },
    { label: "Other", count: Math.max(0, stats.totalFiles - stats.tsFiles), color: "#64748b" },
  ]

  const max = Math.max(...fileTypes.map((t) => t.count), 1)

  return (
    <div className="space-y-6">
      {/* Metric cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {statCards.map(({ key, label, color }) => (
          <div key={key} className="rounded-lg bg-gray-900 border border-gray-800 p-4">
            <div className={`text-2xl font-bold ${color}`}>
              {stats[key].toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* File type bar chart */}
      <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
        <h3 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-4">
          File Distribution
        </h3>
        <div className="space-y-3">
          {fileTypes.map((type) => (
            <div key={type.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-400">{type.label}</span>
                <span className="text-gray-500">{type.count}</span>
              </div>
              <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(type.count / max) * 100}%`,
                    backgroundColor: type.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
