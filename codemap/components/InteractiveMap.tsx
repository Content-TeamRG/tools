"use client"

import { useCallback, useMemo, useState } from "react"
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  MarkerType,
} from "reactflow"
import dagre from "@dagrejs/dagre"
import "reactflow/dist/style.css"
import type { ArchitectureMap } from "@/lib/types"

type Layer = ArchitectureMap["layers"][0]
type DataFlowStep = ArchitectureMap["dataFlow"][0]

// ─── Dagre layout ────────────────────────────────────────────────────────────

function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "LR", ranksep: 100, nodesep: 40, marginx: 40, marginy: 40 })

  nodes.forEach((n) => g.setNode(n.id, { width: n.style?.width ?? 220, height: n.style?.height ?? 160 }))
  edges.forEach((e) => g.setEdge(e.source, e.target))
  dagre.layout(g)

  return {
    nodes: nodes.map((n) => {
      const pos = g.node(n.id)
      return { ...n, position: { x: pos.x - (Number(n.style?.width ?? 220) / 2), y: pos.y - (Number(n.style?.height ?? 160) / 2) } }
    }),
    edges,
  }
}

// ─── Custom layer node ────────────────────────────────────────────────────────

type LayerNodeData = {
  layer: Layer
  expanded: boolean
  onToggle: (id: string) => void
  onSelect: (layer: Layer) => void
  highlighted: boolean
  dimmed: boolean
}

function LayerNode({ data }: NodeProps<LayerNodeData>) {
  const { layer, expanded, onToggle, onSelect, highlighted, dimmed } = data

  return (
    <div
      onClick={() => onSelect(layer)}
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        width: 220,
        border: `2px solid ${highlighted ? layer.color : dimmed ? "#374151" : layer.color + "88"}`,
        background: dimmed ? "#111827" : "#1f2937",
        opacity: dimmed ? 0.4 : 1,
        boxShadow: highlighted ? `0 0 20px ${layer.color}44` : "none",
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: layer.color, border: "none", width: 8, height: 8 }} />
      <Handle type="source" position={Position.Right} style={{ background: layer.color, border: "none", width: 8, height: 8 }} />

      {/* Header */}
      <div className="px-3 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${layer.color}44` }}>
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: layer.color }} />
        <span className="font-semibold text-white text-sm truncate flex-1">{layer.name}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(layer.id) }}
          className="text-gray-500 hover:text-gray-300 text-xs flex-shrink-0 ml-1"
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {/* Purpose */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-400 mb-2">{layer.purpose}</p>

        {/* Main file always visible */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-blue-900/40 text-blue-300 border border-blue-800/50">
          ★ {layer.mainFile.split("/").pop()}
        </div>

        {/* Expanded: show all files */}
        {expanded && (
          <div className="mt-2 space-y-1">
            {layer.files.filter((f) => f !== layer.mainFile).map((f) => (
              <div key={f} className="text-xs font-mono text-gray-500 px-2 py-0.5 rounded bg-gray-800/60 truncate">
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

// ─── Side panel ──────────────────────────────────────────────────────────────

function SidePanel({ layer, allLayers, onClose }: { layer: Layer; allLayers: Layer[]; onClose: () => void }) {
  const depNames = layer.internalDeps.map((id) => allLayers.find((l) => l.id === id)?.name ?? id)

  return (
    <div className="absolute top-0 right-0 h-full w-72 bg-gray-900 border-l border-gray-700 z-10 overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700" style={{ borderLeftColor: layer.color, borderLeftWidth: 3 }}>
        <div>
          <h2 className="text-white font-semibold text-sm">{layer.name}</h2>
          <p className="text-xs mt-0.5" style={{ color: layer.color }}>{layer.purpose}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-lg leading-none">×</button>
      </div>

      <div className="p-4 space-y-4 flex-1">
        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-1">What it does</p>
          <p className="text-gray-300 text-sm leading-relaxed">{layer.plain}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Files</p>
          <div className="space-y-1">
            {layer.files.map((f) => (
              <div key={f} className={`text-xs font-mono px-2 py-1 rounded flex items-center gap-1.5 ${f === layer.mainFile ? "bg-blue-900/40 text-blue-300 border border-blue-800/50" : "bg-gray-800 text-gray-400"}`}>
                {f === layer.mainFile && <span className="text-yellow-400">★</span>}
                {f}
              </div>
            ))}
          </div>
        </div>

        {layer.externalDeps.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">External packages</p>
            <div className="flex flex-wrap gap-1.5">
              {layer.externalDeps.map((d) => (
                <span key={d} className="text-xs px-2 py-0.5 rounded bg-teal-900/40 text-teal-400 border border-teal-800/50">{d}</span>
              ))}
            </div>
          </div>
        )}

        {depNames.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase font-semibold mb-2">Connects to</p>
            <div className="flex flex-wrap gap-1.5">
              {depNames.map((name) => (
                <span key={name} className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800/50">→ {name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

type Props = { data: ArchitectureMap }

export default function InteractiveMap({ data }: Props) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [selectedLayer, setSelectedLayer] = useState<Layer | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const selectLayer = useCallback((layer: Layer) => {
    setSelectedLayer((prev) => prev?.id === layer.id ? null : layer)
  }, [])

  // Which layer ids are connected to selected layer
  const connectedIds = useMemo(() => {
    if (!selectedLayer) return new Set<string>()
    const ids = new Set<string>()
    ids.add(selectedLayer.id)
    selectedLayer.internalDeps.forEach((id) => ids.add(id))
    data.layers.forEach((l) => { if (l.internalDeps.includes(selectedLayer.id)) ids.add(l.id) })
    return ids
  }, [selectedLayer, data.layers])

  const rawNodes: Node[] = data.layers.map((layer) => ({
    id: layer.id,
    type: "layerNode",
    position: { x: 0, y: 0 },
    style: { width: 220, height: expandedIds.has(layer.id) ? 80 + layer.files.length * 24 : 100 },
    data: {
      layer,
      expanded: expandedIds.has(layer.id),
      onToggle: toggleExpand,
      onSelect: selectLayer,
      highlighted: selectedLayer ? connectedIds.has(layer.id) : false,
      dimmed: selectedLayer ? !connectedIds.has(layer.id) : false,
    },
  }))

  // Dependency edges
  const depEdges: Edge[] = []
  data.layers.forEach((layer) => {
    layer.internalDeps.forEach((depId) => {
      depEdges.push({
        id: `dep-${layer.id}-${depId}`,
        source: depId,
        target: layer.id,
        type: "smoothstep",
        animated: selectedLayer ? (connectedIds.has(layer.id) && connectedIds.has(depId)) : false,
        style: {
          stroke: selectedLayer
            ? connectedIds.has(layer.id) && connectedIds.has(depId) ? "#818cf8" : "#374151"
            : "#4b5563",
          strokeWidth: selectedLayer && connectedIds.has(layer.id) && connectedIds.has(depId) ? 2 : 1,
          opacity: selectedLayer && !(connectedIds.has(layer.id) && connectedIds.has(depId)) ? 0.2 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed, color: selectedLayer && connectedIds.has(layer.id) ? "#818cf8" : "#4b5563" },
      })
    })
  })

  // Data flow edges (numbered)
  const flowEdges: Edge[] = data.dataFlow.map((step) => ({
    id: `flow-${step.step}`,
    source: step.from,
    target: step.to,
    label: `${step.step}`,
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
    labelBgStyle: { fill: "#1f2937" },
    type: "smoothstep",
    style: { stroke: "#334155", strokeWidth: 1, strokeDasharray: "4 3" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#334155" },
  }))

  const allEdges = [...depEdges, ...flowEdges]
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(rawNodes, allEdges),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, expandedIds, selectedLayer]
  )

  const [nodes, , onNodesChange] = useNodesState(layoutedNodes)
  const [edges, , onEdgesChange] = useEdgesState(layoutedEdges)

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={2}
        onPaneClick={() => setSelectedLayer(null)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e293b" gap={20} />
        <Controls className="!bg-gray-800 !border-gray-700 !text-gray-300" />
        <MiniMap
          nodeColor={(n) => (n.data as LayerNodeData)?.layer?.color ?? "#374151"}
          maskColor="#00000088"
          className="!bg-gray-900 !border-gray-700"
        />
      </ReactFlow>

      {selectedLayer && (
        <SidePanel
          layer={selectedLayer}
          allLayers={data.layers}
          onClose={() => setSelectedLayer(null)}
        />
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/90 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 space-y-1 pointer-events-none">
        <div className="flex items-center gap-2"><span className="w-6 border-t border-indigo-500 inline-block" /> Dependency</div>
        <div className="flex items-center gap-2"><span className="w-6 border-t border-dashed border-slate-500 inline-block" /> Data flow</div>
        <div className="text-gray-600 mt-1">Click a layer for details</div>
      </div>
    </div>
  )
}
