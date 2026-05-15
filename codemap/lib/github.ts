import { Octokit } from "@octokit/rest"
import { unstable_cache } from "next/cache"
import type { RepoSnapshot, TodoItem, SecretMatch } from "./types"

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", "package.json", "tsconfig.json", ".env.example", "README.md", ".gitignore"]
const SKIP_DIRS = ["node_modules", ".next", "dist", ".git"]
const MAX_FILE_SIZE = 100 * 1024

// Never fetch secret-bearing files
const SKIP_FILE_PATTERNS = [
  /^\.env$/,
  /^\.env\./,
  /\.env\.local$/,
  /\.env\.production$/,
  /\.env\.staging$/,
  /secret/i,
  /credential/i,
  /certificate/i,
  /\.pem$/,
  /\.key$/,
  /\.p12$/,
  /\.pfx$/,
]

// Patterns to redact from file contents
const REDACT_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /AKIA[0-9A-Z]{16}/g, label: "AWS_KEY" },
  { re: /sk_live_[a-zA-Z0-9]+/g, label: "STRIPE_SECRET" },
  { re: /pk_live_[a-zA-Z0-9]+/g, label: "STRIPE_PUBLIC" },
  { re: /sk-[a-zA-Z0-9\-_]{20,}/g, label: "OPENAI_KEY" },
  { re: /ghp_[a-zA-Z0-9]{36}/g, label: "GITHUB_TOKEN" },
  { re: /ghs_[a-zA-Z0-9]{36}/g, label: "GITHUB_APP_TOKEN" },
  { re: /-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----/g, label: "PRIVATE_KEY" },
  { re: /postgresql:\/\/[^\s'"]+/g, label: "POSTGRES_URL" },
  { re: /mysql:\/\/[^\s'"]+/g, label: "MYSQL_URL" },
  { re: /redis:\/\/[^\s'"]+/g, label: "REDIS_URL" },
  { re: /(JWT_SECRET|NEXTAUTH_SECRET)\s*[=:]\s*['"]?\S+['"]?/gi, label: "JWT_SECRET" },
  { re: /(API_KEY|SECRET|PASSWORD|TOKEN|DSN)\s*[=:]\s*['"][^'"]{6,}['"]/gi, label: "CREDENTIAL" },
]

const TODO_PATTERN = /\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)/g

const GITIGNORE_REQUIRED = [
  ".env",
  ".env.local",
  ".env.production",
  ".env.*",
  "*.pem",
  "*.key",
  "node_modules/",
  "/data/latest-analysis.json",
]

function shouldFetchFile(filePath: string, subdir: string): boolean {
  if (subdir && !filePath.startsWith(subdir + "/")) {
    // Always allow .gitignore at repo root
    if (filePath === ".gitignore") return true
    return false
  }

  const relative = subdir ? filePath.slice(subdir.length + 1) : filePath
  const basename = relative.split("/").pop() ?? ""

  if (SKIP_DIRS.some((d) => relative.startsWith(d + "/") || relative === d)) return false
  if (SKIP_FILE_PATTERNS.some((p) => p.test(basename) || p.test(relative))) return false

  return ALLOWED_EXTENSIONS.some((ext) => {
    if (ext.startsWith(".")) return relative.endsWith(ext)
    return relative.endsWith("/" + ext) || relative === ext
  })
}

function stripSecrets(content: string, filePath: string): { clean: string; found: Array<{ lineNum: number; patternType: string }> } {
  const found: Array<{ lineNum: number; patternType: string }> = []
  let clean = content

  for (const { re, label } of REDACT_PATTERNS) {
    re.lastIndex = 0
    clean = clean.replace(re, (match) => {
      // Find line number of match in original
      const idx = content.indexOf(match)
      const lineNum = idx >= 0 ? content.slice(0, idx).split("\n").length : 0
      found.push({ lineNum, patternType: label })
      console.log(`[REDACT] ${label} in ${filePath}:${lineNum}`)
      return `[REDACTED:${label}]`
    })
  }

  return { clean, found }
}

function extractTodos(content: string, filePath: string): TodoItem[] {
  const todos: TodoItem[] = []
  const lines = content.split("\n")
  lines.forEach((line, i) => {
    const match = line.match(/\b(TODO|FIXME|HACK|XXX)\b[:\s]*(.*)/)
    if (match) {
      todos.push({
        file: filePath,
        line: i + 1,
        text: match[2].trim(),
        type: match[1] as TodoItem["type"],
      })
    }
  })
  return todos
}

function auditGitignore(content: string): string[] {
  return GITIGNORE_REQUIRED.filter((entry) => !content.includes(entry))
}

async function fetchRepoSnapshotUncached(): Promise<RepoSnapshot> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const subdir = (process.env.GITHUB_PATH ?? "").replace(/\/$/, "")

  if (!token) throw new Error("GITHUB_TOKEN env var is not set")
  if (!owner) throw new Error("GITHUB_OWNER env var is not set")
  if (!repo) throw new Error("GITHUB_REPO env var is not set")

  const octokit = new Octokit({ auth: token })

  // Check repo visibility
  let repoIsPrivate = true
  try {
    const repoInfo = await octokit.repos.get({ owner, repo })
    repoIsPrivate = repoInfo.data.private
    if (!repoIsPrivate) {
      console.warn("[SECURITY] Repository is PUBLIC — anyone can read your code!")
    }
  } catch {}

  const treeResponse = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: "HEAD",
    recursive: "true",
  })

  const eligibleFiles = treeResponse.data.tree.filter(
    (item) =>
      item.type === "blob" &&
      item.path &&
      shouldFetchFile(item.path, subdir) &&
      (item.size ?? 0) <= MAX_FILE_SIZE
  )

  const allTodos: TodoItem[] = []
  const allSecrets: SecretMatch[] = []
  let gitignoreContent = ""

  const fileContents = await Promise.all(
    eligibleFiles.map(async (item) => {
      try {
        const response = await octokit.repos.getContent({ owner, repo, path: item.path! })
        const data = response.data as { content?: string; encoding?: string }
        const rawContent = data.encoding === "base64" && data.content
          ? Buffer.from(data.content, "base64").toString("utf-8")
          : ""

        const cleanPath = subdir && item.path!.startsWith(subdir + "/")
          ? item.path!.slice(subdir.length + 1)
          : item.path!

        // Capture .gitignore
        if (item.path === ".gitignore" || cleanPath === ".gitignore") {
          gitignoreContent = rawContent
        }

        // Extract TODOs before stripping
        const todos = extractTodos(rawContent, cleanPath)
        allTodos.push(...todos)

        // Strip secrets
        const { clean, found } = stripSecrets(rawContent, cleanPath)
        found.forEach((f) => allSecrets.push({ file: cleanPath, ...f }))

        return { path: cleanPath, content: clean, size: item.size ?? 0 }
      } catch {
        return null
      }
    })
  )

  const files = fileContents.filter(Boolean) as RepoSnapshot["files"]

  let packageJson: object | undefined
  const pkgFile = files.find((f) => f.path === "package.json")
  if (pkgFile) {
    try { packageJson = JSON.parse(pkgFile.content) } catch {}
  }

  return {
    fetchedAt: new Date().toISOString(),
    files,
    packageJson,
    todos: allTodos,
    secretsFound: allSecrets,
    repoIsPrivate,
    gitignoreContent,
  }
}

export const fetchRepoSnapshot = unstable_cache(
  fetchRepoSnapshotUncached,
  ["repo-snapshot"],
  { revalidate: 300, tags: ["repo-snapshot"] }
)

export { fetchRepoSnapshotUncached }
