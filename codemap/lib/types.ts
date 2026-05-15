export type RepoSnapshot = {
  fetchedAt: string
  files: Array<{
    path: string
    content: string
    size: number
  }>
  packageJson?: object
}

export type ArchitectureMap = {
  summary: {
    name: string
    description: string
    techStack: string[]
    lastAnalyzed: string
  }
  layers: Array<{
    id: string
    name: string
    color: string
    purpose: string
    plain: string
    files: string[]
    mainFile: string
    externalDeps: string[]
    internalDeps: string[]
  }>
  dataFlow: Array<{
    step: number
    title: string
    plain: string
    from: string
    to: string
  }>
  bugs: Array<{
    id: string
    severity: "high" | "med" | "low"
    title: string
    file: string
    description: string
    fix: string
    category: "security" | "performance" | "error-handling" | "type-safety" | "other"
  }>
  stats: {
    totalFiles: number
    tsFiles: number
    apiRoutes: number
    components: number
    linesEstimate: number
  }
}

export type Message = {
  role: "user" | "assistant"
  content: string
}
