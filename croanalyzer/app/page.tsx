"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { AnalyzeForm, type AnalyzeFormSubmit } from "@/components/AnalyzeForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { SessionSidebar, type SessionEntry } from "@/components/SessionSidebar";
import type { AnalyzeResult } from "@/lib/types";

type Tab = "overview" | "findings" | "heatmap" | "rewrite" | "serp";

let idCounter = 0;
function nextId() {
  return `session-${++idCounter}`;
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
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: data.mode,
          url: data.url,
          text: data.text,
          title: data.title,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          (json.error || "Request failed") +
            (json.detail ? ` — ${json.detail}` : ""),
        );
      }
      const result = json as AnalyzeResult;
      const id = nextId();
      setSessions((prev) => [
        { id, result, createdAt: Date.now() },
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

  const hasSessions = sessions.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar
        onLogoClick={hasSessions ? handleNewAnalysis : undefined}
        onNewAnalysis={hasSessions ? handleNewAnalysis : undefined}
      />

      <div className="flex flex-1 min-h-0">
        {hasSessions && (
          <SessionSidebar
            sessions={sessions}
            activeId={activeId}
            onSelect={setActiveId}
          />
        )}

        <div className="flex-1 min-w-0 overflow-y-auto">
          {activeSession ? (
            <ResultsPanel
              result={activeSession.result}
              onReset={handleNewAnalysis}
              initialTab={pendingSerp?.initialTab ?? null}
              autoSerpKeyword={pendingSerp?.keyword ?? null}
            />
          ) : (
            <AnalyzeForm
              onSubmit={handleSubmit}
              isLoading={isLoading}
              error={error}
              compact={hasSessions}
            />
          )}
        </div>
      </div>
    </main>
  );
}
