"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AnalyzeForm, type AnalyzeFormSubmit } from "@/components/AnalyzeForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { CompareResultsPanel } from "@/components/CompareResultsPanel";
import { SessionSidebar, type SessionEntry } from "@/components/SessionSidebar";
import type { AnalyzeResult } from "@/lib/types";

type Tab = "overview" | "findings" | "heatmap" | "rewrite" | "serp";

let idCounter = 0;
function nextId() {
  return `session-${++idCounter}`;
}

async function runAnalyze(payload: Record<string, unknown>): Promise<AnalyzeResult> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(
      (json.error || "Request failed") +
        (json.detail ? ` — ${json.detail}` : ""),
    );
  }
  return json as AnalyzeResult;
}

export default function HomePage() {
  const [sessions, setSessions] = useState<SessionEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // pending SERP keyword to auto-trigger after analysis
  const [pendingSerp, setPendingSerp] = useState<{
    keyword: string;
    initialTab: Tab;
  } | null>(null);

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  async function handleSubmit(data: AnalyzeFormSubmit) {
    setIsLoading(true);
    setError(null);
    try {
      if (data.analysisType === "compare") {
        if (!data.urlA || !data.urlB) {
          throw new Error("Both URLs are required for competitive analysis");
        }
        // Run both audits in parallel using the same /api/analyze logic.
        const [a, b] = await Promise.all([
          runAnalyze({ mode: "url", url: data.urlA }),
          runAnalyze({ mode: "url", url: data.urlB }),
        ]);
        const id = nextId();
        setSessions((prev) => [
          {
            id,
            kind: "compare",
            pair: { a, b },
            createdAt: Date.now(),
          },
          ...prev,
        ]);
        setActiveId(id);
        setPendingSerp(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const result = await runAnalyze({
        mode: data.mode,
        url: data.url,
        text: data.text,
        title: data.title,
      });
      const id = nextId();
      setSessions((prev) => [
        { id, kind: "single", result, createdAt: Date.now() },
        ...prev,
      ]);
      setActiveId(id);

      if (data.analysisType === "serp" && data.keyword) {
        setPendingSerp({ keyword: data.keyword, initialTab: "serp" });
      } else {
        setPendingSerp(null);
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleNewAnalysis() {
    setActiveId(null);
    setError(null);
    setPendingSerp(null);
  }

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar
        onLogoClick={handleNewAnalysis}
        onNewAnalysis={handleNewAnalysis}
      />

      <div className="flex flex-1 min-h-0">
        <SessionSidebar
          sessions={sessions}
          activeId={activeId}
          onSelect={setActiveId}
        />

        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeSession ? (
            activeSession.kind === "compare" ? (
              <CompareResultsPanel
                pair={activeSession.pair}
                onReset={handleNewAnalysis}
              />
            ) : (
              <ResultsPanel
                result={activeSession.result}
                onReset={handleNewAnalysis}
                initialTab={pendingSerp?.initialTab ?? null}
                autoSerpKeyword={pendingSerp?.keyword ?? null}
              />
            )
          ) : (
            <AnalyzeForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              compact={true}
            />
          )}
        </div>
      </div>
    </main>
  );
}
