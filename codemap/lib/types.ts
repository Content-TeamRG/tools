// ─── Snapshot (fetched from GitHub) ──────────────────────────────────────────

export type TodoItem = {
  file: string
  line: number
  text: string
  type: "TODO" | "FIXME" | "HACK" | "XXX"
}

export type SecretMatch = {
  file: string
  lineNum: number
  patternType: string
}

export type RepoSnapshot = {
  fetchedAt: string
  files: Array<{
    path: string
    content: string
    size: number
  }>
  packageJson?: object
  todos: TodoItem[]
  secretsFound: SecretMatch[]
  repoIsPrivate: boolean
  gitignoreContent: string
}

// ─── Analysis (AI + computed) ─────────────────────────────────────────────────

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

  fileGraph: Array<{
    file: string
    layerId: string
    imports: string[]        // other files this imports (relative paths)
    externalImports: string[] // npm packages
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

  codeHealth: {
    score: number           // 0–100 computed
    deadFiles: string[]
    complexityHotspots: Array<{
      file: string
      complexityScore: number
      reason: string
    }>
    duplicateBlocks: Array<{
      description: string
      files: string[]
    }>
    dependencyRisk: Array<{
      package: string
      issue: string
      severity: "high" | "med" | "low"
    }>
  }

  securityFlags: {
    // pre-computed
    secretsFound: SecretMatch[]
    gitignoreMissing: string[]
    repoIsPrivate: boolean
    // AI-computed
    unprotectedRoutes: Array<{ route: string; issues: string[] }>
    corsIssues: Array<{ file: string; issue: string }>
    errorLeakage: Array<{ file: string; issue: string }>
  }

  chatQueries: Array<{
    timestamp: string
    query: string
    flagged: boolean
    flagReason?: string
  }>
}

export type Message = {
  role: "user" | "assistant"
  content: string
}
