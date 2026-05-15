"use client"

import { useCallback, useMemo, useState } from "react"
import ReactFlow, {
  Node, Edge, Background, Controls, MiniMap,
  useNodesState, useEdgesState, NodeProps, Handle, Position, MarkerType,
} from "reactflow"
import dagre from "@dagrejs/dagre"
import "reactflow/dist/style.css"
import type { ArchitectureMap } from "@/lib/types"

type Layer = ArchitectureMap["layers"][0]

export const BRAND_COLORS = ["#ff0000", "#008000", "#0000ff", "#7f00ff", "#ff6600", "#00aaff", "#ff0080"]

function getLayerColor(index: number): string {
  return BRAND_COLORS[index % BRAND_COLORS.length]
}

// ─── Dagre layout ─────────────────────────────────────────────────────────────

function layoutElements(nodes: Node[], edges: Edge[], nodeW = 230, nodeH = 140) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", ranksep: 120, nodesep: 50 })
  nodes.forEach((n) => g.setNode(n.id, { width: nodeW, height: Number(n.style?.height ?? nodeH) }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)
  return {
    nodes: nodes.map((n) => {
      const p = g.node(n.id)
      return { ...n, position: { x: p.x - nodeW / 2, y: p.y - Number(n.style?.height ?? nodeH) / 2 } }
    }),
    edges,
  }
}

// ─── Layer node ───────────────────────────────────────────────────────────────

type LayerNodeData = {
  layer: Layer
  color: string
  expanded: boolean
  highlighted: boolean
  dimmed: boolean
  onToggle: (id: string) => void
  onSelect: (layer: Layer) => void
  onFileClick: (file: string, layerName: string) => void
}

function LayerNode({ data }: NodeProps<LayerNodeData>) {
  const { layer, color, expanded, highlighted, dimmed, onToggle, onSelect, onFileClick } = data
  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-150"
      style={{
        width: 230,
        border: `2px solid ${highlighted ? color : dimmed ? "#1f2937" : color + "99"}`,
        background: "#111827",
        opacity: dimmed ? 0.35 : 1,
        boxShadow: highlighted ? `0 0 24px ${color}55` : "none",
      }}
      onClick={() => onSelect(layer)}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, border: "none", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: color, border: "none", width: 8, height: 8 }} />

      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${color}33`, background: color + "11" }}>
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="font-bold text-white text-sm flex-1 truncate">{layer.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(layer.id) }}
          className="text-gray-600 hover:text-gray-300 text-xs"
        >{expanded ? "▲" : "▼"}</button>
      </div>

      <div className="px-3 py-2">
        <p className="text-xs text-gray-500 mb-2">{layer.purpose}</p>
        <div
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono border cursor-pointer hover:opacity-80"
          style={{ background: color + "22", color, borderColor: color + "55" }}
          onClick={(e) => { e.stopPropagation(); onFileClick(layer.mainFile, layer.name) }}
          title="Click to ask about this file"
        >
          ★ {layer.mainFile.split("/").pop()}
        </div>

        {expanded && (
          <div className="mt-2 space-y-1">
            {layer.files.filter((f) => f !== layer.mainFile).map((f) => (
              <div
                key={f}
                className="text-xs font-mono text-gray-500 px-2 py-0.5 rounded bg-gray-800/60 truncate cursor-pointer hover:text-gray-300 hover:bg-gray-700/60"
                onClick={(e) => { e.stopPropagation(); onFileClick(f, layer.name) }}
                title="Click to ask about this file"
              >
                {f.split("/").pop()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const nodeTypes = { layerNode: LayerNode }

// ─── Side panel ───────────────────────────────────────────────────────────────

function SidePanel({ layer, color, allLayers, onClose, onFileClick }: {
  layer: Layer; color: string; allLayers: Layer[]
  onClose: () => void; onFileClick: (f: string, l: string) => void
}) {
  const depNames = layer.internalDeps.map((id) => allLayers.find((l) => l.id === id)?.name ?? id)
  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-gray-950 border-l border-gray-800 z-10 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800" style={{ borderLeftColor: color, borderLeftWidth: 3 }}>
        <div>
          <h2 className="text-white font-bold text-sm">{layer.name}</h2>
          <p className="text-xs mt-0.5 font-medium" style={{ color }}>{layer.purpose}</p>
        </div>
        <button onClick={onClose} className="text-gray-600 hover:text-white text-xl leading-none">×</button>
      </div>
      <div className="p-4 space-y-4 flex-1">
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold mb-1">What it does</p>
          <p className="text-gray-300 text-sm leading-relaxed">{layer.plain}</p>
        </div>
        <div>
          <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Files <span className="text-gray-700 normal-case">(click to ask)</span></p>
          <div className="space-y-1">
            {layer.files.map((f) => (
              <div
                key={f}
                onClick={() => onFileClick(f, layer.name)}
                className={`text-xs font-mono px-2 py-1 rounded flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${
                  f === layer.mainFile ? "border" : "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80"
                }`}
                style={f === layer.mainFile ? { background: color + "22", color, borderColor: color + "55" } : {}}
              >
                {f === layer.mainFile && <span>★</span>} {f}
              </div>
            ))}
          </div>
        </div>
        {layer.externalDeps.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold mb-2">External packages</p>
            <div className="flex flex-wrap gap-1.5">
              {layer.externalDeps.map((d) => (
                <span key={d} className="text-xs px-2 py-0.5 rounded text-white" style={{ background: "#008000" + "44", border: "1px solid #00800066" }}>{d}</span>
              ))}
            </div>
          </div>
        )}
        {depNames.length > 0 && (
          <div>
            <p className="text-xs text-gray-600 uppercase font-semibold mb-2">Connects to</p>
            <div className="flex flex-wrap gap-1.5">
              {depNames.map((name) => (
                <span key={name} className="text-xs px-2 py-0.5 rounded text-white" style={{ background: "#7f00ff" + "33", border: "1px solid #7f00ff55" }}>→ {name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Props = { data: ArchitectureMap; onFileClick: (msg: string) => void }

export default function InteractiveMap({ data, onFileClick }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)

  const layersWithColor = useMemo(() =>
    data.layers.map((l, i) => ({ ...l, color: getLayerColor(i) })),
    [data.layers]
  )

  const toggle = useCallback((id: string) => {
    setExpandedIds((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  }, [])

  const selectLayer = useCallback((layer: Layer) => {
    setSelectedLayer((p) => p?.id === layer.id ? null : layer)
  }, [])

  const handleFileClick = useCallback((file: string, layerName: string) => {
    onFileClick(`What does \`${file}\` do? (it's in the ${layerName} layer)`)
  }, [onFileClick])

  const connectedIds = useMemo(() => {
    if (!selectedLayer) return new Set<string>()
    const ids = new Set([selectedLayer.id])
    selectedLayer.internalDeps.forEach((id) => ids.add(id))
    data.layers.forEach((l) => { if (l.internalDeps.includes(selectedLayer.id)) ids.add(l.id) })
    return ids
  }, [selectedLayer, data.layers])

  const rawNodes: Node[] = layersWithColor.map((layer) => ({
    id: layer.id,
    type: "layerNode",
    position: { x: 0, y: 0 },
    style: { width: 230, height: expandedIds.has(layer.id) ? 90 + layer.files.length * 26 : 110 },
    data: {
      layer,
      color: layer.color,
      expanded: expandedIds.has(layer.id),
      highlighted: selectedLayer ? connectedIds.has(layer.id) : false,
      dimmed: selectedLayer ? !connectedIds.has(layer.id) : false,
      onToggle: toggle,
      onSelect: selectLayer,
      onFileClick: handleFileClick,
    },
  }))

  const depEdges: Edge[] = []
  data.layers.forEach((layer, i) => {
    const color = getLayerColor(i)
    layer.internalDeps.forEach((depId) => {
      const isActive = selectedLayer ? connectedIds.has(layer.id) && connectedIds.has(depId) : false
      depEdges.push({
        id: `dep-${layer.id}-${depId}`,
        source: depId,
        target: layer.id,
        type: "smoothstep",
        animated: isActive,
        style: { stroke: isActive ? color : "#374151", strokeWidth: isActive ? 2.5 : 1, opacity: selectedLayer && !isActive ? 0.15 : 1 },
        markerEnd: { type: MarkerType.ArrowClosed, color: isActive ? color : "#374151" },
      })
    })
  })

  const flowEdges: Edge[] = data.dataFlow.map((step) => ({
    id: `flow-${step.step}`,
    source: step.from,
    target: step.to,
    label: `${step.step}`,
    labelStyle: { fill: "#6b7280", fontSize: 10 },
    labelBgStyle: { fill: "#111827" },
    type: "smoothstep",
    style: { stroke: "#1f2937", strokeWidth: 1, strokeDasharray: "4 3" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#374151" },
  }))

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => layoutElements(rawNodes, [...depEdges, ...flowEdges]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, expandedIds, selectedLayer]
  )

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  const selectedWithColor = selectedLayer
    ? layersWithColor.find((l) => l.id === selectedLayer.id)
    : null

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes} edges={edges}
        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2} maxZoom={2.5}
        onPaneClick={() => setSelectedLayer(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#0f172a" gap={24} />
        <Controls className="!bg-gray-900 !border-gray-700" />
        <MiniMap
          nodeColor={(n) => (n.data as LayerNodeData)?.color ?? "#374151"}
          maskColor="#00000099"
          className="!bg-gray-950 !border-gray-800"
        />
      </ReactFlow>

      {selectedWithColor && (
        <SidePanel
          layer={selectedWithColor}
          color={selectedWithColor.color}
          allLayers={data.layers}
          onClose={() => setSelectedLayer(null)}
          onFileClick={handleFileClick}
        />
      )}

      <div className="absolute bottom-4 left-4 bg-gray-950/90 border border-gray-800 rounded-lg px-3 py-2 text-xs text-gray-600 space-y-1 pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-5 border-t border-gray-500 inline-block" /> Dependency</div>
        <div className="flex items-center gap-2"><span className="w-5 border-t border-dashed border-gray-700 inline-block" /> Data flow step</div>
        <div className="mt-1 text-gray-700">Click layer or file to explore</div>
      </div>
    </div>
  )
}
