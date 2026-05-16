"use client";

import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import {
  AnalyzeForm,
  type AnalyzeFormSubmit,
} from "@/components/AnalyzeForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import type { AnalyzeResult } from "@/lib/types";

type Tab = "overview" | "findings" | "heatmap" | "rewrite" | "serp";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialTab, setInitialTab] = useState<Tab | null>(null);
  const [autoSerpKeyword, setAutoSerpKeyword] = useState<string | null>(null);

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
      setResult(json as AnalyzeResult);
      setInitialTab(data.analysisType === "serp" ? "serp" : "overview");
      setAutoSerpKeyword(
        data.analysisType === "serp" && data.keyword ? data.keyword : null,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    setInitialTab(null);
    setAutoSerpKeyword(null);
  }

  return (
    <main className="min-h-screen bg-white">
      <NavBar onReset={handleReset} />
      {result ? (
        <ResultsPanel
          result={result}
          onReset={handleReset}
          initialTab={initialTab}
          autoSerpKeyword={autoSerpKeyword}
        />
      ) : (
        <AnalyzeForm
          onSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
        />
      )}
    </main>
  );
}
