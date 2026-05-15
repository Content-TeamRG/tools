import { fetchRepoSnapshot } from "@/lib/github"
import { analyzeRepo, loadCachedAnalysis } from "@/lib/analyze"
import Dashboard from "@/components/Dashboard"

export const dynamic = "force-dynamic"

export default async function Home() {
  const repoName = process.env.GITHUB_REPO ?? "your-repo"
  const branch = process.env.GITHUB_BRANCH ?? "main"

  let analysis = await loadCachedAnalysis()

  if (!analysis) {
    try {
      const snapshot = await fetchRepoSnapshot()
      analysis = await analyzeRepo(snapshot)
    } catch (err) {
      console.error("Analysis failed:", err)
    }
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950 text-gray-400">
        <div className="text-center space-y-3">
          <div className="font-mono text-2xl font-bold text-white">CodeMap</div>
          <p>No analysis found. Configure your env vars and trigger <code className="text-blue-400">/api/analyze</code>.</p>
        </div>
      </div>
    )
  }

  return <Dashboard data={analysis} repoName={repoName} branch={branch} />
}
