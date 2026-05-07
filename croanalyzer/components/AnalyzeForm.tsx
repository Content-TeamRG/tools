"use client";

import { useState } from "react";
import {
  Globe,
  FileText,
  Loader2,
  AlertCircle,
  Zap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "url" | "text";

export interface AnalyzeFormSubmit {
  mode: Mode;
  url?: string;
  text?: string;
  title?: string;
}

const FEATURES = [
  "100-point CRO rubric",
  "Score across 6 modules",
  "Sentence-level heatmap",
  "Page-context grounded reasoning",
  "Specific rewrite suggestions",
  "Text-only PDF export",
];

export function AnalyzeForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (data: AnalyzeFormSubmit) => void;
  isLoading: boolean;
  error: string | null;
}) {
  const [mode, setMode] = useState<Mode>("url");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLoading) return;
    if (mode === "url") {
      if (!url.trim()) return;
      onSubmit({ mode: "url", url: url.trim() });
    } else {
      if (!text.trim()) return;
      onSubmit({ mode: "text", text: text.trim(), title: title.trim() });
    }
  }

  const disabled = isLoading || (mode === "url" ? !url.trim() : !text.trim());

  return (
    <div className="hero-backdrop">
      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium mb-6">
            <Zap className="w-3 h-3" />
            Conversion Rate Optimization Audit
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight text-balance">
            Why isn&apos;t your landing page
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
              converting?
            </span>
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto text-balance leading-relaxed">
            Audit any landing page against a 100-point CRO rubric. Get a score,
            find your highest-leverage gaps, and read suggestions written in{" "}
            <em>your</em> industry&apos;s language — not template CRO.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 max-w-2xl mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <CheckCircle className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              {f}
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-xl shadow-gray-200/50">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-6 w-fit">
            <button
              type="button"
              onClick={() => setMode("url")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mode === "url"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <Globe className="w-4 h-4" />
              URL
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                mode === "text"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-900",
              )}
            >
              <FileText className="w-4 h-4" />
              Paste text
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "url" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Landing page URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-landing-page"
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-50"
                />
                <p className="text-xs text-gray-500 mt-1.5">
                  We&apos;ll fetch and analyze the page content directly.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page title (optional)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Helps the analyzer extract the page profile"
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page copy
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your landing page copy — headline, subhead, body, CTAs, testimonials, form labels..."
                    required
                    rows={10}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all resize-none scrollbar-thin disabled:opacity-50"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={disabled}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all",
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20 hover:shadow-violet-600/30",
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing page…
                </>
              ) : (
                <>
                  Score my page
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="flex items-center justify-center gap-12 mt-12 text-center">
          {[
            { value: "100", label: "Total points" },
            { value: "6", label: "Modules scored" },
            { value: "21", label: "Sub-dimensions" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-gray-900 tabular-nums">
                {value}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
