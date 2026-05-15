import { Octokit } from "@octokit/rest"
import { unstable_cache } from "next/cache"
import type { RepoSnapshot } from "./types"

const ALLOWED_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", "package.json", "tsconfig.json", ".env.example", "README.md"]
const SKIP_DIRS = ["node_modules", ".next", "dist", ".git"]
const MAX_FILE_SIZE = 100 * 1024 // 100KB

function shouldFetchFile(filePath: string, subdir: string): boolean {
  // If a subdirectory filter is set, only include files under that path
  if (subdir && !filePath.startsWith(subdir + "/")) return false

  const relative = subdir ? filePath.slice(subdir.length + 1) : filePath

  if (SKIP_DIRS.some((dir) => relative.startsWith(dir + "/") || relative === dir)) return false

  return ALLOWED_EXTENSIONS.some((ext) => {
    if (ext.startsWith(".")) return relative.endsWith(ext)
    return relative.endsWith("/" + ext) || relative === ext
  })
}

async function fetchRepoSnapshotUncached(): Promise<RepoSnapshot> {
  const token = process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER
  const repo = process.env.GITHUB_REPO
  const subdir = (process.env.GITHUB_PATH ?? "").replace(/\/$/, "") // e.g. "croanalyzer"

  if (!token) throw new Error("GITHUB_TOKEN env var is not set")
  if (!owner) throw new Error("GITHUB_OWNER env var is not set")
  if (!repo) throw new Error("GITHUB_REPO env var is not set")

  const octokit = new Octokit({ auth: token })

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

  const fileContents = await Promise.all(
    eligibleFiles.map(async (item) => {
      try {
        const response = await octokit.repos.getContent({
          owner,
          repo,
          path: item.path!,
        })
        const data = response.data as { content?: string; encoding?: string }
        const content = data.encoding === "base64" && data.content
          ? Buffer.from(data.content, "base64").toString("utf-8")
          : ""
        // Strip the subdir prefix from paths so the AI sees clean relative paths
        const cleanPath = subdir ? item.path!.slice(subdir.length + 1) : item.path!
        return {
          path: cleanPath,
          content,
          size: item.size ?? 0,
        }
      } catch {
        return null
      }
    })
  )

  const files = fileContents.filter(Boolean) as RepoSnapshot["files"]

  let packageJson: object | undefined
  const pkgFile = files.find((f) => f.path === "package.json")
  if (pkgFile) {
    try {
      packageJson = JSON.parse(pkgFile.content)
    } catch {}
  }

  return {
    fetchedAt: new Date().toISOString(),
    files,
    packageJson,
  }
}

export const fetchRepoSnapshot = unstable_cache(
  fetchRepoSnapshotUncached,
  ["repo-snapshot"],
  {
    revalidate: 300,
    tags: ["repo-snapshot"],
  }
)

export { fetchRepoSnapshotUncached }
