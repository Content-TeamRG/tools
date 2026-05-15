import { NextRequest, NextResponse } from "next/server"
import { fetchRepoSnapshotUncached } from "@/lib/github"
import { analyzeRepoUncached } from "@/lib/analyze"

export async function GET(req: NextRequest) {

  try {
    const snapshot = await fetchRepoSnapshotUncached()
    const analysis = await analyzeRepoUncached(snapshot)
    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
