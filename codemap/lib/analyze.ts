import Anthropic from "@anthropic-ai/sdk"
import { unstable_cache } from "next/cache"
import { promises as fs } from "fs"
import path from "path"
import type { RepoSnapshot, ArchitectureMap } from "./types"

const DATA_PATH = process.env.DATA_PATH || path.join("/tmp", "codemap-latest-analysis.json")
const QUERIES_PATH = path.join("/tmp", "codemap-queries.json")

const FLAGGED_KEYWORDS = ["key", "secret", "token", "password", "env", "credential", "database",
  "ignore instructions", "developer mode", "bypass", "override", "jailbreak"]

export async function logChatQuery(query: string): Promise<void> {
  try {
    const lower = query.toLowerCase()
    const flagReason = FLAGGED_KEYWORDS.find((k) => lower.includes(k))
    const entry = {
      timestamp: new Date().toISOString(),
      query,
      flagged: !!flagReason,
      flagReason,
    }
    let existing: ArchitectureMap["chatQueries"] = []
    try {
      const raw = await fs.readFile(QUERIES_PATH, "utf-8")
      existing = JSON.parse(raw)
    } catch {}
    existing.push(entry)
    // Keep last 200 queries
    if (existing.length > 200) existing = existing.slice(-200)
    await fs.writeFile(QUERIES_PATH, JSON.stringify(existing), "utf-8")
  } catch {}
}

export async function loadChatQueries(): Promise<ArchitectureMap["chatQueries"]> {
  try {
    const raw = await fs.readFile(QUERIES_PATH, "utf-8")
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function computeHealthScore(analysis: ArchitectureMap, snapshot: RepoSnapshot): number {
  let score = 100
  score -= analysis.bugs.filter((b) => b.severity === "high").length * 10
  score -= analysis.bugs.filter((b) => b.severity === "med").length * 5
  score -= analysis.bugs.filter((b) => b.severity === "low").length * 2
  score -= Math.min(snapshot.secretsFound.length * 20, 30)
  score -= Math.min(snapshot.todos.length * 0.5, 10)
  score -= (analysis.securityFlags?.unprotectedRoutes?.length ?? 0) * 5
  score -= !snapshot.repoIsPrivate ? 25 : 0
  return Math.max(0, Math.min(100, Math.round(score)))
}

async function analyzeRepoUncached(snapshot: RepoSnapshot): Promise<ArchitectureMap> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY env var is not set")
  const client = new Anthropic({ apiKey })

  // Key files get full content, everything else gets a shorter excerpt.
  // This keeps quality high for important files while staying under token limits.
  const KEY_PATTERNS = [/route\.ts$/, /page\.tsx$/, /layout\.tsx$/, /middleware/, /api/, /lib\//, /utils?\//, /service/, /package\.json$/]
  const isKeyFile = (path: string) => KEY_PATTERNS.some((p) => p.test(path))

  const filesSummary = snapshot.files
    .map((f) => `### ${f.path}\n${f.content.slice(0, isKeyFile(f.path) ? 2000 : 400)}`)
    .join("\n\n---\n\n")

  const prompt = `You are a software architect. Analyze this codebase and return ONLY valid JSON (no markdown, no fences) matching this exact shape:

{
  "summary": {
    "name": string,
    "description": string,
    "techStack": string[],
    "lastAnalyzed": "${new Date().toISOString()}"
  },
  "layers": [{
    "id": string,
    "name": string,
    "color": string,
    "purpose": string,
    "plain": string,
    "files": string[],
    "mainFile": string,
    "externalDeps": string[],
    "internalDeps": string[]
  }],
  "fileGraph": [{
    "file": string,
    "layerId": string,
    "imports": string[],
    "externalImports": string[]
  }],
  "dataFlow": [{
    "step": number,
    "title": string,
    "plain": string,
    "from": string,
    "to": string
  }],
  "bugs": [{
    "id": string,
    "severity": "high"|"med"|"low",
    "title": string,
    "file": string,
    "description": string,
    "fix": string,
    "category": "security"|"performance"|"error-handling"|"type-safety"|"other"
  }],
  "stats": {
    "totalFiles": number,
    "tsFiles": number,
    "apiRoutes": number,
    "components": number,
    "linesEstimate": number
  },
  "codeHealth": {
    "score": 0,
    "deadFiles": string[],
    "complexityHotspots": [{ "file": string, "complexityScore": number, "reason": string }],
    "duplicateBlocks": [{ "description": string, "files": string[] }],
    "dependencyRisk": [{ "package": string, "issue": string, "severity": "high"|"med"|"low" }]
  },
  "securityFlags": {
    "secretsFound": [],
    "gitignoreMissing": [],
    "repoIsPrivate": true,
    "unprotectedRoutes": [{ "route": string, "issues": string[] }],
    "corsIssues": [{ "file": string, "issue": string }],
    "errorLeakage": [{ "file": string, "issue": string }]
  },
  "chatQueries": []
}

RULES for fileGraph: for each file, list only OTHER files in this repo that it imports (relative paths). Do not list npm packages in imports — put those in externalImports.

RULES for layers: assign colors from this palette in order: #ff0000, #008000, #0000ff, #7f00ff, #ff6600, #00aaff.

CODEBASE (fetched ${snapshot.fetchedAt}):

${filesSummary}

Return ONLY the JSON. No markdown fences.`

  const message = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
    max_tokens: 8096,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
  const result = JSON.parse(cleaned) as ArchitectureMap

  // Merge pre-computed data from snapshot (override AI placeholders)
  result.securityFlags.secretsFound = snapshot.secretsFound
  result.securityFlags.repoIsPrivate = snapshot.repoIsPrivate
  result.securityFlags.gitignoreMissing = (() => {
    const required = [".env", ".env.local", ".env.production", ".env.*", "*.pem", "*.key", "node_modules/", "/data/latest-analysis.json"]
    return required.filter((e) => !snapshot.gitignoreContent.includes(e))
  })()
  result.codeHealth.score = computeHealthScore(result, snapshot)
  result.chatQueries = []

  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
    await fs.writeFile(DATA_PATH, JSON.stringify(result, null, 2), "utf-8")
  } catch {}

  return result
}

export const analyzeRepo = unstable_cache(
  analyzeRepoUncached,
  ["arch-analysis"],
  { revalidate: 600, tags: ["arch-analysis"] }
)

export { analyzeRepoUncached }

export async function loadCachedAnalysis(): Promise<ArchitectureMap | null> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8")
    const data = JSON.parse(raw) as ArchitectureMap
    // Merge latest chat queries
    data.chatQueries = await loadChatQueries()
    return data
  } catch {
    return null
  }
}
