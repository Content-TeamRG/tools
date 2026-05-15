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

type FileNode = ArchitectureMap["fileGraph"][0]

function layoutElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", ranksep: 80, nodesep: 30 })
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

type FileNodeData = {
  file: string
  color: string
  layerName: string
  selected: boolean
  dimmed: boolean
  onClick: (file: string, layerName: string) => void
}

function FileNodeComponent({ data }: NodeProps<FileNodeData>) {
  const { file, color, layerName, selected, dimmed, onClick } = data
  const name = file.split("/").pop() ?? file
  return (
    <div
      onClick={() => onClick(file, layerName)}
      className="rounded-lg cursor-pointer transition-all duration-150 flex items-center px-3"
      style={{
        width: 160,
        height: 44,
        border: `1.5px solid ${selected ? color : dimmed ? "#1f2937" : color + "66"}`,
        background: selected ? color + "22" : "#111827",
        opacity: dimmed ? 0.25 : 1,
        boxShadow: selected ? `0 0 16px ${color}44` : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: "none", width: 6, height: 6 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: "none", width: 6, height: 6 }} />
      <div className="overflow-hidden">
        <div className="text-xs font-mono font-semibold text-white truncate" style={{ maxWidth: 130 }}>{name}</div>
        <div className="text-xs truncate mt-0.5" style={{ color: color + "aa", maxWidth: 130 }}>{layerName}</div>
      </div>
    </div>
  )
}

const nodeTypes = { fileNode: FileNodeComponent }

type Props = { data: ArchitectureMap; onFileClick: (msg: string) => void }

export default function InteractiveFilesMap({ data, onFileClick }: Props) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  // Build color map: layerId → color
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

  // Build set of files that connect to/from selected
  const connectedFiles = useMemo(() => {
    if (!selectedFile) return new Set<string>()
    const s = new Set([selectedFile])
    const node = data.fileGraph.find((f) => f.file === selectedFile)
    node?.imports.forEach((i) => s.add(i))
    data.fileGraph.forEach((f) => { if (f.imports.includes(selectedFile)) s.add(f.file) })
    return s
  }, [selectedFile, data.fileGraph])

  const handleNodeClick = (file: string, layerName: string) => {
    if (selectedFile === file) {
      setSelectedFile(null)
    } else {
      setSelectedFile(file)
    }
  }

  const handleAskClick = () => {
    if (!selectedFile) return
    const layer = data.fileGraph.find((f) => f.file === selectedFile)
    const layerName = layer ? (layerNameMap[layer.layerId] ?? "") : ""
    onFileClick(`What does \`${selectedFile}\` do? (it's in the ${layerName} layer)`)
  }

  const rawNodes: Node[] = data.fileGraph.map((f) => ({
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
  data.fileGraph.forEach((f) => {
    f.imports.forEach((imp) => {
      // Only draw edge if target exists in fileGraph
      if (!data.fileGraph.find((g) => g.file === imp)) return
      const isActive = selectedFile ? connectedFiles.has(f.file) && connectedFiles.has(imp) : false
      const color = layerColorMap[f.layerId] ?? "#374151"
      rawEdges.push({
        id: `${f.file}→${imp}`,
        source: imp,
        target: f.file,
        type: "smoothstep",
        animated: isActive,
        style: { stroke: isActive ? color : "#1f2937", strokeWidth: isActive ? 2 : 1, opacity: selectedFile && !isActive ? 0.1 : 0.6 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? color : "#374151" },
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

  const selectedInfo = selectedFile ? data.fileGraph.find((f) => f.file === selectedFile) : null

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.15 }}
        minZoom={0.15} maxZoom={3}
        onPaneClick={() => setSelectedFile(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#0a0f1a" gap={20} />
        <Controls className="!bg-gray-900 !border-gray-700" />
        <MiniMap
          nodeColor={(n) => (n.data as FileNodeData)?.color ?? "#374151"}
          maskColor="#00000099"
          className="!bg-gray-950 !border-gray-800"
        />
      </ReactFlow>

      {/* Legend: layer colors */}
      <div className="absolute top-4 left-4 bg-gray-950/90 border border-gray-800 rounded-lg px-3 py-2 space-y-1.5 pointer-events-none">
        {data.layers.map((l, i) => (
          <div key={l.id} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: BRAND_COLORS[i % BRAND_COLORS.length] }} />
            <span className="text-xs text-gray-400">{l.name}</span>
          </div>
        ))}
      </div>

      {/* File detail panel */}
      {selectedInfo && (
        <div className="absolute top-0 right-0 h-full w-64 bg-gray-950 border-l border-gray-800 z-10 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800"
            style={{ borderLeftColor: layerColorMap[selectedInfo.layerId] ?? "#6b7280", borderLeftWidth: 3 }}>
            <div>
              <p className="text-white font-mono text-sm font-semibold truncate">{selectedFile!.split("/").pop()}</p>
              <p className="text-xs mt-0.5" style={{ color: layerColorMap[selectedInfo.layerId] ?? "#6b7280" }}>
                {layerNameMap[selectedInfo.layerId]}
              </p>
            </div>
            <button onClick={() => setSelectedFile(null)} className="text-gray-600 hover:text-white text-xl">×</button>
          </div>
          <div className="p-4 space-y-3 flex-1">
            <p className="text-xs font-mono text-gray-500 break-all">{selectedFile}</p>
            {selectedInfo.externalImports.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5">Packages used</p>
                <div className="flex flex-wrap gap-1">
                  {selectedInfo.externalImports.map((p) => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded font-mono text-white" style={{ background: "#00800033", border: "1px solid #00800055" }}>{p}</span>
                  ))}
                </div>
              </div>
            )}
            {selectedInfo.imports.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5">Imports from</p>
                <div className="space-y-1">
                  {selectedInfo.imports.map((f) => (
                    <div key={f} onClick={() => setSelectedFile(f)} className="text-xs font-mono text-gray-400 hover:text-white cursor-pointer px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-700/60 truncate">
                      {f.split("/").pop()}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {data.fileGraph.filter((f) => f.imports.includes(selectedFile!)).length > 0 && (
              <div>
                <p className="text-xs text-gray-600 uppercase font-semibold mb-1.5">Imported by</p>
                <div className="space-y-1">
                  {data.fileGraph.filter((f) => f.imports.includes(selectedFile!)).map((f) => (
                    <div key={f.file} onClick={() => setSelectedFile(f.file)} className="text-xs font-mono text-gray-400 hover:text-white cursor-pointer px-2 py-1 rounded bg-gray-800/60 hover:bg-gray-700/60 truncate">
                      {f.file.split("/").pop()}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={handleAskClick}
              className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: layerColorMap[selectedInfo.layerId] ?? "#374151" }}
            >
              Ask about this file →
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-gray-950/90 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-gray-700 pointer-events-none">
        Click a file to see connections • Click again to ask in chat
      </div>
    </div>
  )
}
