import type { ArchitectureMap } from "@/lib/types"

type Props = {
  data: ArchitectureMap
}

function LayerCard({ layer, allLayers }: { layer: ArchitectureMap["layers"][0]; allLayers: ArchitectureMap["layers"] }) {
  const depNames = layer.internalDeps.map((id) => allLayers.find((l) => l.id === id)?.name ?? id)

  return (
    <div
      className="rounded-lg bg-gray-900 border border-gray-800 overflow-hidden"
      style={{ borderLeftColor: layer.color, borderLeftWidth: 4 }}
    >
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="font-semibold text-white text-base">{layer.name}</h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: layer.color + "22", color: layer.color }}
          >
            {layer.purpose}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-3">{layer.plain}</p>

        {/* File chips */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {layer.files.map((file) => (
            <span
              key={file}
              className={`text-xs px-2 py-0.5 rounded font-mono ${
                file === layer.mainFile
                  ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {file === layer.mainFile ? "★ " : ""}{file.split("/").pop()}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {layer.externalDeps.map((dep) => (
            <span key={dep} className="text-xs px-2 py-0.5 rounded bg-teal-900/40 text-teal-400 border border-teal-800">
              {dep}
            </span>
          ))}
          {depNames.map((name) => (
            <span key={name} className="text-xs px-2 py-0.5 rounded bg-amber-900/40 text-amber-400 border border-amber-800">
              → {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function ArchitectureMap({ data }: Props) {
  return (
    <div className="space-y-6">
      {/* Layers */}
      <div className="grid grid-cols-1 gap-4">
        {data.layers.map((layer) => (
          <LayerCard key={layer.id} layer={layer} allLayers={data.layers} />
        ))}
      </div>

      {/* Data flow */}
      <div>
        <h2 className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-4">Data Flow</h2>
        <div className="space-y-0">
          {data.dataFlow.map((step, i) => {
            const fromLayer = data.layers.find((l) => l.id === step.from)
            const toLayer = data.layers.find((l) => l.id === step.to)
            return (
              <div key={step.step} className="flex gap-4">
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center text-xs font-bold text-gray-300 shrink-0">
                    {step.step}
                  </div>
                  {i < data.dataFlow.length - 1 && (
                    <div className="w-0.5 bg-gray-700 flex-1 my-1" style={{ minHeight: 24 }} />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{step.title}</span>
                    <span className="text-xs text-gray-500">
                      {fromLayer?.name ?? step.from}
                      <span className="text-gray-600 mx-1">→</span>
                      {toLayer?.name ?? step.to}
                    </span>
                  </div>
                  <p className="text-gray-400 text-sm">{step.plain}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
