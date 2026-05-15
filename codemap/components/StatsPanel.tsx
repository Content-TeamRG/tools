import type { ArchitectureMap } from "@/lib/types"

type Props = { data: ArchitectureMap }

function HealthScore({ score }: { score: number }) {
  const color = score >= 80 ? "#008000" : score >= 60 ? "#ff991c" : "#ff0000"
  const label = score >= 80 ? "Healthy" : score >= 60 ? "Needs Work" : "Critical"
  const pct = score
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 flex items-center gap-6">
      <div>
        <div className="text-6xl font-black" style={{ color }}>{score}</div>
        <div className="text-xs font-semibold mt-1" style={{ color }}>{label}</div>
        <div className="text-xs text-gray-600 mt-0.5">Health Score / 100</div>
      </div>
      <div className="flex-1">
        <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
        </div>
        <div className="flex justify-between text-xs text-gray-700 mt-1">
          <span>Critical</span><span>Healthy</span>
        </div>
      </div>
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-gray-500 text-xs uppercase tracking-widest font-semibold mt-6 mb-3">{title}</h3>
}

function StatCard({ label, value, color = "#ffffff" }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
      <div className="text-2xl font-bold" style={{ color }}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

function SecurityRow({ ok, label, detail }: { ok: boolean | null; label: string; detail?: string }) {
  const color = ok === null ? "#ff991c" : ok ? "#008000" : "#ff0000"
  const icon = ok === null ? "⚠" : ok ? "✓" : "✗"
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm font-bold mt-0.5 flex-shrink-0" style={{ color }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{label}</p>
        {detail && <p className="text-xs text-gray-600 mt-0.5">{detail}</p>}
      </div>
    </div>
  )
}

export default function StatsPanel({ data }: Props) {
  const { stats, codeHealth, securityFlags, bugs, chatQueries } = data

  const highBugs = bugs.filter((b) => b.severity === "high").length
  const medBugs = bugs.filter((b) => b.severity === "med").length
  const lowBugs = bugs.filter((b) => b.severity === "low").length

  const flaggedQueries = (chatQueries ?? []).filter((q) => q.flagged)
  const todoCount = data.stats?.totalFiles ? (codeHealth?.deadFiles?.length ?? 0) : 0

  // File type chart
  const fileTypes = [
    { label: ".ts / .tsx", count: stats.tsFiles, color: "#0000ff" },
    { label: "API Routes", count: stats.apiRoutes, color: "#008000" },
    { label: "Components", count: stats.components, color: "#7f00ff" },
    { label: "Other", count: Math.max(0, stats.totalFiles - stats.tsFiles), color: "#374151" },
  ]
  const maxCount = Math.max(...fileTypes.map((t) => t.count), 1)

  return (
    <div className="space-y-2 pb-8">
      {/* Health Score */}
      <HealthScore score={codeHealth?.score ?? 0} />

      {/* Core stats */}
      <SectionHeader title="Code Metrics" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Total Files" value={stats.totalFiles} color="#ffffff" />
        <StatCard label="TypeScript Files" value={stats.tsFiles} color="#0000ff" />
        <StatCard label="API Routes" value={stats.apiRoutes} color="#008000" />
        <StatCard label="Components" value={stats.components} color="#7f00ff" />
        <StatCard label="Lines (est.)" value={stats.linesEstimate.toLocaleString()} color="#ff6600" />
        <StatCard label="Dead Files" value={codeHealth?.deadFiles?.length ?? 0} color={codeHealth?.deadFiles?.length ? "#ff0000" : "#008000"} />
      </div>

      {/* Bugs by severity */}
      <SectionHeader title="Bug Summary" />
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: "#ff000066", background: "#ff000011" }}>
          <div className="text-2xl font-bold" style={{ color: "#ff0000" }}>{highBugs}</div>
          <div className="text-xs mt-0.5" style={{ color: "#ff000088" }}>High</div>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: "#ff991c66", background: "#ff991c11" }}>
          <div className="text-2xl font-bold" style={{ color: "#ff991c" }}>{medBugs}</div>
          <div className="text-xs mt-0.5" style={{ color: "#ff991c88" }}>Medium</div>
        </div>
        <div className="rounded-lg border p-3 text-center" style={{ borderColor: "#00800066", background: "#00800011" }}>
          <div className="text-2xl font-bold" style={{ color: "#008000" }}>{lowBugs}</div>
          <div className="text-xs mt-0.5" style={{ color: "#00800088" }}>Low</div>
        </div>
      </div>

      {/* File type chart */}
      <SectionHeader title="File Distribution" />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
        {fileTypes.map((t) => (
          <div key={t.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">{t.label}</span>
              <span className="text-gray-600">{t.count}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(t.count / maxCount) * 100}%`, background: t.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* TODO/FIXME */}
      {codeHealth?.deadFiles && (
        <>
          <SectionHeader title="Dead Files" />
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            {codeHealth.deadFiles.length === 0 ? (
              <p className="text-sm text-gray-500">No dead files found — everything is imported somewhere.</p>
            ) : (
              <div className="space-y-1">
                {codeHealth.deadFiles.map((f) => (
                  <div key={f} className="text-xs font-mono px-2 py-1 rounded bg-gray-200 text-gray-400 flex items-center gap-2">
                    <span style={{ color: "#ff0000" }}>⊘</span> {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Complexity hotspots */}
      {codeHealth?.complexityHotspots?.length > 0 && (
        <>
          <SectionHeader title="Complexity Hotspots" />
          <div className="space-y-2">
            {codeHealth.complexityHotspots.map((h) => (
              <div key={h.file} className="rounded-lg border border-gray-200 bg-white shadow-sm p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-700">{h.file}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: "#ff000022", color: "#ff0000" }}>
                    Score {h.complexityScore}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{h.reason}</p>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Dependency risk */}
      {codeHealth?.dependencyRisk?.length > 0 && (
        <>
          <SectionHeader title="Dependency Risk" />
          <div className="space-y-2">
            {codeHealth.dependencyRisk.map((d, i) => {
              const color = d.severity === "high" ? "#ff0000" : d.severity === "med" ? "#ff991c" : "#008000"
              return (
                <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm p-3 flex items-start gap-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded capitalize flex-shrink-0" style={{ background: color + "22", color }}>
                    {d.severity}
                  </span>
                  <div>
                    <p className="text-xs font-mono text-gray-700">{d.package}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{d.issue}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Duplicate blocks */}
      {codeHealth?.duplicateBlocks?.length > 0 && (
        <>
          <SectionHeader title="Duplicate Code" />
          <div className="space-y-2">
            {codeHealth.duplicateBlocks.map((d, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white shadow-sm p-3">
                <p className="text-xs text-gray-400 mb-1">{d.description}</p>
                <div className="flex flex-wrap gap-1">
                  {d.files.map((f) => (
                    <span key={f} className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-200 text-gray-500">{f}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Security flags */}
      <SectionHeader title="Security" />
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
        <SecurityRow
          ok={securityFlags?.repoIsPrivate ?? true}
          label={securityFlags?.repoIsPrivate ? "Repo is private" : "Repo is PUBLIC — anyone can read your code!"}
          detail={!securityFlags?.repoIsPrivate ? "Go to GitHub → Settings → Danger Zone → Change visibility" : undefined}
        />
        <SecurityRow
          ok={securityFlags?.secretsFound?.length === 0}
          label={securityFlags?.secretsFound?.length
            ? `${securityFlags.secretsFound.length} potential secret(s) found in code`
            : "No hardcoded secrets detected"}
          detail={securityFlags?.secretsFound?.length
            ? securityFlags.secretsFound.map((s) => `${s.file}:${s.lineNum} (${s.patternType})`).join(", ")
            : undefined}
        />
        <SecurityRow
          ok={securityFlags?.gitignoreMissing?.length === 0}
          label={securityFlags?.gitignoreMissing?.length
            ? `Missing from .gitignore: ${securityFlags.gitignoreMissing.join(", ")}`
            : ".gitignore covers all sensitive file patterns"}
        />
        <SecurityRow
          ok={securityFlags?.unprotectedRoutes?.length === 0}
          label={securityFlags?.unprotectedRoutes?.length
            ? `${securityFlags.unprotectedRoutes.length} unprotected API route(s)`
            : "All API routes have auth checks"}
          detail={securityFlags?.unprotectedRoutes?.map((r) => r.route).join(", ")}
        />
        <SecurityRow
          ok={securityFlags?.errorLeakage?.length === 0}
          label={securityFlags?.errorLeakage?.length
            ? `${securityFlags.errorLeakage.length} route(s) leak raw error objects`
            : "No raw error objects returned to clients"}
          detail={securityFlags?.errorLeakage?.map((e) => e.file).join(", ")}
        />
        <SecurityRow
          ok={securityFlags?.corsIssues?.length === 0}
          label={securityFlags?.corsIssues?.length
            ? `${securityFlags.corsIssues.length} CORS issue(s) found`
            : "No wildcard CORS issues detected"}
        />
      </div>

      {/* Chatbot query log */}
      {chatQueries && chatQueries.length > 0 && (
        <>
          <SectionHeader title="Chatbot Queries" />
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">{chatQueries.length} total queries</span>
              {flaggedQueries.length > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ background: "#ff000022", color: "#ff0000" }}>
                  {flaggedQueries.length} flagged
                </span>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...chatQueries].reverse().map((q, i) => (
                <div key={i} className={`rounded px-3 py-2 text-xs ${q.flagged ? "border" : "bg-gray-200/60"}`}
                  style={q.flagged ? { borderColor: "#ff000055", background: "#ff000011" } : {}}>
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-gray-500">{new Date(q.timestamp).toLocaleTimeString()}</span>
                    {q.flagged && <span style={{ color: "#ff0000" }}>⚑ {q.flagReason}</span>}
                  </div>
                  <p className="text-gray-700 truncate">{q.query}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
