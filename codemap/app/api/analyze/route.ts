import { NextRequest, NextResponse } from "next/server"
import { fetchRepoSnapshotUncached } from "@/lib/github"
import { analyzeRepoUncached } from "@/lib/analyze"

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.WEBHOOK_SECRET
  const header = req.headers.get("x-codemap-secret")
  const host = req.headers.get("host") ?? ""
  const isLocalhost = host.startsWith("localhost") || host.startsWith("127.0.0.1")

  if (isLocalhost) return true
  if (secret && header === secret) return true
  return false
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const snapshot = await fetchRepoSnapshotUncached()
    const analysis = await analyzeRepoUncached(snapshot)
    return NextResponse.json(analysis)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
