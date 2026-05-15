"use client"

import { useState, useRef, useEffect } from "react"
import type { Message } from "@/lib/types"

const QUICK_ASKS = [
  "What does this tool do?",
  "What's the riskiest bug?",
  "How does a request flow through the app?",
  "What should I refactor first?",
  "Which file is most important?",
]

type Props = {
  repoName: string
  prefillMessage?: string
  onPrefillConsumed?: () => void
}

export default function ChatSidebar({ repoName, prefillMessage, onPrefillConsumed }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Hey! I've mapped your **${repoName}** codebase. Ask me anything — what a file does, how data flows, what to fix first, anything.`,
    },
  ])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Auto-send prefill messages from map clicks
  useEffect(() => {
    if (prefillMessage && !streaming) {
      sendMessage(prefillMessage)
      onPrefillConsumed?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillMessage])

  async function sendMessage(text: string) {
    if (!text.trim() || streaming) return
    const userMsg: Message = { role: "user", content: text }
    const history = messages
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setStreaming(true)

    const assistantMsg: Message = { role: "assistant", content: "" }
    setMessages((prev) => [...prev, assistantMsg])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })

      if (!res.body) throw new Error("No stream")
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: "assistant",
            content: updated[updated.length - 1].content + chunk,
          }
          return updated
        })
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev]
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        }
        return updated
      })
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200" style={{ borderTopColor: "#ff0000", borderTopWidth: 3 }}>
        <p className="text-gray-900 font-bold text-sm">Codebase Chat</p>
        <p className="text-gray-400 text-xs mt-0.5">Ask anything about your code</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "text-white rounded-br-sm"
                  : "bg-white text-gray-800 rounded-bl-sm border border-gray-200 shadow-sm"
              }`}
              style={msg.role === "user" ? { background: "#ff0000" } : {}}
            >
              {msg.content}
              {streaming && i === messages.length - 1 && msg.role === "assistant" && (
                <span className="inline-block w-1.5 h-3.5 bg-gray-400 ml-0.5 align-middle animate-pulse" />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Quick ask chips */}
      <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-gray-200 bg-white">
        {QUICK_ASKS.map((q) => (
          <button
            key={q}
            onClick={() => sendMessage(q)}
            disabled={streaming}
            className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40 bg-white"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        className="px-4 py-3 border-t border-gray-200 flex gap-2 bg-white"
        onSubmit={(e) => { e.preventDefault(); sendMessage(input) }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your codebase…"
          disabled={streaming}
          className="flex-1 bg-gray-50 text-gray-900 text-sm rounded-lg px-3 py-2 outline-none border border-gray-200 placeholder-gray-400 focus:ring-2 focus:border-transparent disabled:opacity-50"
          style={{ ["--tw-ring-color" as string]: "#ff0000" }}
        />
        <button
          type="submit"
          disabled={!input.trim() || streaming}
          className="px-3 py-2 rounded-lg text-white text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "#ff0000" }}
        >
          Send
        </button>
      </form>
    </div>
  )
}
