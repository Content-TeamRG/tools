"use client"

import { useMemo, useState } from "react"
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, NodeProps, Handle, Position, MarkerType,
} from "reactflow"
import dagre from "@dagrejs/dagre"
import "reactflow/dist/style.css"
import type { ArchitectureMap } from "@/lib/types"
import { BRAND_COLORS } from "./InteractiveMap"

type FileEntry = ArchitectureMap["fileGraph"][0]

// ─── Path normalisation ───────────────────────────────────────────────────────
// Claude returns imports like "./lib/auth", "../components/Button", "lib/auth.ts"
// We normalise to bare path without leading ./ or extension so we can fuzzy-match

function normPath(p: string): string {
  return p
    .replace(/^\.\.?\//g, "")   // strip leading ./ or ../
    .replace(/\.(ts|tsx|js|jsx)$/, "")  // strip extension
    .toLowerCase()
}

function buildFileIndex(fileGraph: FileEntry[]): Map<string, string> {
  const m = new Map<string, string>()
  fileGraph.forEach((f) => {
    m.set(normPath(f.file), f.file)
    // also index by basename alone
    const base = f.file.split("/").pop() ?? ""
    m.set(normPath(base), f.file)
  })
  return m
}

function resolveImport(imp: string, index: Map<string, string>): string | null {
  return index.get(normPath(imp)) ?? index.get(normPath(imp.split("/").pop() ?? "")) ?? null
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function layoutElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 28 })
  nodes.forEach((n) => g.setNode(n.id, { width: 160, height: 44 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return {
    nodes: nodes.map((n) => {
      const p = g.node(n.id)
      return { ...n, position: { x: p.x - 80, y: p.y - 22 } }
    }),
    edges,
  }
}

// ─── Node ─────────────────────────────────────────────────────────────────────

type FileNodeData = {
  file: string
  color: string
  layerName: string
  selected: boolean
  dimmed: boolean
  onClick: (file: string) => void
}

function FileNodeComponent({ data }: NodeProps<FileNodeData>) {
  const { file, color, layerName, selected, dimmed, onClick } = data
  const name = file.split("/").pop() ?? file
  return (
    <div
      onClick={() => onClick(file)}
      className="rounded-lg cursor-pointer transition-all duration-150 flex items-center px-3"
      style={{
        width: 160, height: 44,
        border: `2px solid ${selected ? color : dimmed ? "#e5e7eb" : color + "77"}`,
        background: selected ? color + "15" : "#ffffff",
        opacity: dimmed ? 0.3 : 1,
        boxShadow: selected ? `0 0 14px ${color}33` : "0 1px 3px rgba(0,0,0,0.08)",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: "none", width: 7, height: 7 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: "none", width: 7, height: 7 }} />
      <div className="overflow-hidden w-full">
        <div className="text-xs font-mono font-semibold text-gray-900 truncate">{name}</div>
        <div className="text-xs truncate mt-0.5 font-medium" style={{ color: color, opacity: 0.75 }}>{layerName}</div>
      </div>
    </div>
  )
}

const nodeTypes = { fileNode: FileNodeComponent }

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = { data: ArchitectureMap; onFileClick: (msg: string) => void }

export default function InteractiveFilesMap({ data, onFileClick }: Props) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  const layerColorMap = useMemo(() => {
    const m: Record<string, string> = {}
    data.layers.forEach((l, i) => { m[l.id] = BRAND_COLORS[i % BRAND_COLORS.length] })
    return m
  }, [data.layers])

  const layerNameMap = useMemo(() => {
    const m: Record<string, string> = {}
    data.layers.forEach((l) => { m[l.id] = l.name })
    return m
  }, [data.layers])

  const fileIndex = useMemo(() => buildFileIndex(data.fileGraph ?? []), [data.fileGraph])

  const connectedFiles = useMemo(() => {
    if (!selectedFile) return new Set<string>()
    const s = new Set([selectedFile])
    const node = (data.fileGraph ?? []).find((f) => f.file === selectedFile)
    node?.imports.forEach((imp) => {
      const resolved = resolveImport(imp, fileIndex)
      if (resolved) s.add(resolved)
    })
    ;(data.fileGraph ?? []).forEach((f) => {
      f.imports.forEach((imp) => {
        const resolved = resolveImport(imp, fileIndex)
        if (resolved === selectedFile) s.add(f.file)
      })
    })
    return s
  }, [selectedFile, data.fileGraph, fileIndex])

  const handleNodeClick = (file: string) => {
    setSelectedFile((prev) => prev === file ? null : file)
  }

  const rawNodes: Node[] = (data.fileGraph ?? []).map((f) => ({
    id: f.file,
    type: "fileNode",
    position: { x: 0, y: 0 },
    data: {
      file: f.file,
      color: layerColorMap[f.layerId] ?? "#6b7280",
      layerName: layerNameMap[f.layerId] ?? f.layerId,
      selected: f.file === selectedFile,
      dimmed: selectedFile ? !connectedFiles.has(f.file) : false,
      onClick: handleNodeClick,
    },
  }))

  const rawEdges: Edge[] = []
  ;(data.fileGraph ?? []).forEach((f) => {
    f.imports.forEach((imp) => {
      const target = resolveImport(imp, fileIndex)
      if (!target || target === f.file) return
      const isActive = selectedFile ? connectedFiles.has(f.file) && connectedFiles.has(target) : false
      const color = layerColorMap[f.layerId] ?? "#374151"
      const edgeId = `${target}→${f.file}`
      // deduplicate
      if (rawEdges.find((e) => e.id === edgeId)) return
      rawEdges.push({
        id: edgeId,
        source: target,
        target: f.file,
        type: "smoothstep",
        animated: isActive,
        style: {
          stroke: isActive ? color : "#d1d5db",
          strokeWidth: isActive ? 2.5 : 1,
          opacity: selectedFile && !isActive ? 0.15 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? color : "#9ca3af" },
      })
    })
  })

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => layoutElements(rawNodes, rawEdges),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, selectedFile]
  )

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  const selectedInfo = selectedFile ? (data.fileGraph ?? []).find((f) => f.file === selectedFile) : null

  const importedBy = selectedFile
    ? (data.fileGraph ?? []).filter((f) =>
        f.imports.some((imp) => resolveImport(imp, fileIndex) === selectedFile)
      )
    : []

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1} maxZoom={3}
        nodesDraggable={false}
        onPaneClick={() => setSelectedFile(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e5e7eb" gap={20} style={{ background: "#ffffff" }} />
        <Controls />
        <MiniMap
          nodeColor={(n) => (n.data as FileNodeData)?.color ?? "#d1d5db"}
          maskColor="#ffffff88"
          className="!border-gray-200"
        />
      </ReactFlow>

      {/* Layer legend */}
      <div className="absolute top-3 left-3 bg-white/90 border border-gray-200 rounded-xl px-3 py-2 space-y-1.5 pointer-events-none shadow-sm">
        {data.layers.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: BRAND_COLORS[i % BRAND_COLORS.length] }} />
            <span className="text-xs text-gray-600 font-medium">{l.name}</span>
          </div>
        ))}
      </div>

      {/* File detail panel */}
      {selectedInfo && (
        <div className="absolute top-0 right-0 h-full w-64 bg-white border-l border-gray-200 z-10 overflow-y-auto flex flex-col shadow-xl">
          <div
            className="flex items-center justify-between px-4 py-3 border-b border-gray-200"
            style={{ borderLeftColor: layerColorMap[selectedInfo.layerId] ?? "#6b7280", borderLeftWidth: 3 }}
          >
            <div className="overflow-hidden">
              <p className="text-gray-900 font-mono text-sm font-semibold truncate">{selectedFile!.split("/").pop()}</p>
              <p className="text-xs mt-0.5 font-medium" style={{ color: layerColorMap[selectedInfo.layerId] ?? "#6b7280" }}>
                {layerNameMap[selectedInfo.layerId]}
              </p>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-gray-900 text-xl ml-2">×</button>
          </div>

          <div className="p-4 space-y-3 flex-1">
            <p className="text-xs font-mono text-gray-400 break-all">{selectedFile}</p>

            {selectedInfo.externalImports.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1.5">Packages</p>
                <div className="flex flex-wrap gap-1">
                  {selectedInfo.externalImports.map((p) => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded font-mono text-white"
                      style={{ background: "#00800099" }}>{p}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedInfo.imports.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1.5">Imports ({selectedInfo.imports.length})</p>
                <div className="space-y-1">
                  {selectedInfo.imports.map((imp) => {
                    const resolved = resolveImport(imp, fileIndex)
                    return (
                      <div
                        key={imp}
                        onClick={() => resolved && setSelectedFile(resolved)}
                        className={`text-xs font-mono px-2 py-1 rounded bg-gray-100 truncate ${resolved ? "cursor-pointer hover:bg-gray-200 text-gray-700" : "text-gray-400"}`}
                      >
                        {(resolved ?? imp).split("/").pop()}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {importedBy.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 uppercase font-semibold mb-1.5">Used by ({importedBy.length})</p>
                <div className="space-y-1">
                  {importedBy.map((f) => (
                    <div
                      key={f.file}
                      onClick={() => setSelectedFile(f.file)}
                      className="text-xs font-mono px-2 py-1 rounded bg-gray-100 text-gray-700 truncate cursor-pointer hover:bg-gray-200"
                    >
                      {f.file.split("/").pop()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => onFileClick(`What does \`${selectedFile}\` do? (it's in the ${layerNameMap[selectedInfo.layerId]} layer)`)}
              className="w-full py-2 rounded-lg text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: layerColorMap[selectedInfo.layerId] ?? "#374151" }}
            >
              Ask about this file →
            </button>
          </div>
        </div>
      )}

      {(data.fileGraph ?? []).length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 text-center shadow-sm">
            <p className="text-gray-500 text-sm">Re-run analysis to generate the file graph.</p>
            <p className="text-gray-400 text-xs mt-1">Hit the Refresh button above.</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 bg-white/90 border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-400 pointer-events-none shadow-sm">
        Click a file to see connections
      </div>
    </div>
  )
}
