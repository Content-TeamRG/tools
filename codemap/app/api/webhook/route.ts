import { NextRequest, NextResponse } from "next/server"
import { revalidateTag } from "next/cache"
import crypto from "crypto"

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(payload).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: "WEBHOOK_SECRET not configured" }, { status: 500 })
  }

  const signature = req.headers.get("x-hub-signature-256") ?? ""
  const event = req.headers.get("x-github-event") ?? ""
  const body = await req.text()

  if (!verifySignature(body, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  if (event !== "push") {
    return NextResponse.json({ ok: true, message: "Event ignored" })
  }

  revalidateTag("repo-snapshot")
  revalidateTag("arch-analysis")

  // Trigger background re-analysis
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  fetch(`${appUrl}/api/analyze`, {
    headers: { "x-codemap-secret": secret },
  }).catch(() => {})

  return NextResponse.json({ ok: true, message: "Cache busted, re-analysis triggered" })
}
