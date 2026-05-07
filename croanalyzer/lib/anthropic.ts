import Anthropic from "@anthropic-ai/sdk";
import type { SystemBlock } from "./prompts";

const client = new Anthropic({
  apiKey: process.env.GETTHIS,
});

const HAIKU = "claude-haiku-4-5-20251001";
const SONNET = "claude-sonnet-4-6";

export async function callExtraction(system: string, user: string) {
  const res = await client.messages.create({
    model: HAIKU,
    max_tokens: 1500,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in extraction response");
  }
  return { text: block.text, usage: res.usage };
}

export async function callScoring(
  systemBlocks: SystemBlock[],
  user: string,
  maxTokens = 8000,
) {
  const res = await client.messages.create({
    model: SONNET,
    max_tokens: maxTokens,
    system: systemBlocks,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "max_tokens") {
    throw new Error(
      "Response was truncated by max_tokens — output was too long for the budget",
    );
  }
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in scoring response");
  }
  return { text: block.text, usage: res.usage };
}

export async function callRewrite(
  systemBlocks: SystemBlock[],
  user: string,
  maxTokens = 12000,
) {
  const res = await client.messages.create({
    model: SONNET,
    max_tokens: maxTokens,
    system: systemBlocks,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "max_tokens") {
    throw new Error(
      "Rewrite was truncated by max_tokens — try again or analyze a shorter page",
    );
  }
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in rewrite response");
  }
  return { text: block.text, usage: res.usage };
}

// Server-side web search via Anthropic. Tool runs on Anthropic's side; the
// response includes web_search_tool_use + web_search_tool_result blocks plus
// Claude's final text. We return the LAST text block, which is the synthesis.
export async function callSerpSearch(system: string, user: string) {
  const res = await client.messages.create({
    model: SONNET,
    max_tokens: 4000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      } as any,
    ],
    system,
    messages: [{ role: "user", content: user }],
  });
  const textBlocks = res.content.filter(
    (b): b is Extract<typeof b, { type: "text" }> => b.type === "text",
  );
  const last = textBlocks[textBlocks.length - 1];
  if (!last) throw new Error("No text block in SERP search response");
  return { text: last.text, usage: res.usage };
}

export async function callSwot(
  systemBlocks: SystemBlock[],
  user: string,
  maxTokens = 4000,
) {
  const res = await client.messages.create({
    model: SONNET,
    max_tokens: maxTokens,
    system: systemBlocks,
    messages: [{ role: "user", content: user }],
  });
  if (res.stop_reason === "max_tokens") {
    throw new Error("SWOT response was truncated by max_tokens");
  }
  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("No text block in SWOT response");
  }
  return { text: block.text, usage: res.usage };
}

// Extract and parse the first complete JSON object from a model response.
// Handles: code-fenced JSON, prose preceding the JSON, prose / citations
// following the JSON, and strings containing { or } characters.
export function parseJson<T>(s: string): T {
  let text = s
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  const start = text.indexOf("{");
  if (start === -1) {
    return JSON.parse(text) as T;
  }

  let depth = 0;
  let inString = false;
  let escape = false;
  let end = -1;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inString) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  if (end !== -1) {
    text = text.slice(start, end + 1);
  } else {
    text = text.slice(start);
  }

  return JSON.parse(text) as T;
}
