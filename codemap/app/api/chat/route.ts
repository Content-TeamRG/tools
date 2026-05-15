import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { loadCachedAnalysis } from "@/lib/analyze"
import type { Message } from "@/lib/types"

export async function POST(req: NextRequest) {
  const { message, history } = (await req.json()) as {
    message: string
    history: Message[]
  }

  const analysis = await loadCachedAnalysis()
  const architectureJSON = analysis ? JSON.stringify(analysis, null, 2) : "{}"

  const systemPrompt = `You are a friendly codebase assistant for a non-developer founder who vibe-coded their own tools.
You have full knowledge of their codebase architecture:

${architectureJSON}

Rules:
- Always answer in plain English, zero technical jargon
- Be concise (2-4 sentences unless they ask for more detail)
- When referencing files, use backticks
- Be encouraging — this person built something real
- If asked about bugs, explain them simply and always suggest the fix
- Never say "as an AI" or "I don't have access to" — you have the architecture data above`

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const messages: Anthropic.MessageParam[] = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ]

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
