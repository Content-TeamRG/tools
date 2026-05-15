import Anthropic from "@anthropic-ai/sdk"
import { unstable_cache } from "next/cache"
import { promises as fs } from "fs"
import path from "path"
import type { RepoSnapshot, ArchitectureMap } from "./types"

const DATA_PATH = path.join(process.cwd(), "data", "latest-analysis.json")

async function analyzeRepoUncached(snapshot: RepoSnapshot): Promise<ArchitectureMap> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const filesSummary = snapshot.files
    .map((f) => `### ${f.path}\n${f.content.slice(0, 3000)}`)
    .join("\n\n---\n\n")

  const prompt = `You are a software architect. Analyze this codebase and return ONLY valid JSON (no markdown fences, no explanation) matching this exact TypeScript type:

{
  summary: {
    name: string,           // the tool/app name
    description: string,    // 2-3 sentences, plain English, no jargon
    techStack: string[],    // e.g. ["Next.js 14", "TypeScript", "Prisma"]
    lastAnalyzed: string    // ISO timestamp: "${new Date().toISOString()}"
  },
  layers: Array<{
    id: string,
    name: string,           // e.g. "Frontend", "API Routes", "Database", "Config"
    color: string,          // hex color code
    purpose: string,        // one short phrase
    plain: string,          // 1-2 sentences plain English
    files: string[],        // key file paths
    mainFile: string,       // single most important file
    externalDeps: string[], // npm packages used
    internalDeps: string[]  // other layer ids this depends on
  }>,
  dataFlow: Array<{
    step: number,
    title: string,
    plain: string,          // plain English explanation
    from: string,           // layer id
    to: string              // layer id
  }>,
  bugs: Array<{
    id: string,
    severity: "high" | "med" | "low",
    title: string,
    file: string,
    description: string,    // plain English
    fix: string,            // plain English suggestion
    category: "security" | "performance" | "error-handling" | "type-safety" | "other"
  }>,
  stats: {
    totalFiles: number,
    tsFiles: number,
    apiRoutes: number,
    components: number,
    linesEstimate: number
  }
}

CODEBASE FILES (fetched at ${snapshot.fetchedAt}):

${filesSummary}

Return ONLY the JSON object. No markdown, no explanation.`

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : ""

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```(?:json)?\n?/m, "").replace(/\n?```$/m, "").trim()
  const result = JSON.parse(cleaned) as ArchitectureMap

  // Persist fallback
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
    await fs.writeFile(DATA_PATH, JSON.stringify(result, null, 2), "utf-8")
  } catch {}

  return result
}

export const analyzeRepo = unstable_cache(
  analyzeRepoUncached,
  ["arch-analysis"],
  {
    revalidate: 600, // 10 minutes
    tags: ["arch-analysis"],
  }
)

export { analyzeRepoUncached }

export async function loadCachedAnalysis(): Promise<ArchitectureMap | null> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8")
    return JSON.parse(raw) as ArchitectureMap
  } catch {
    return null
  }
}
