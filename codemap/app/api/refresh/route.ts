import { NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import { fetchRepoSnapshotUncached } from "@/lib/github"
import { analyzeRepoUncached } from "@/lib/analyze"

export async function POST() {
  try {
    revalidateTag("repo-snapshot")
    revalidateTag("arch-analysis")
    const snapshot = await fetchRepoSnapshotUncached()
    const analysis = await analyzeRepoUncached(snapshot)
    return NextResponse.json({ ok: true, lastAnalyzed: analysis.summary.lastAnalyzed })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
