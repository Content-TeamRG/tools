"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Loader2,
  ExternalLink,
  Megaphone,
  Globe,
  Shield,
  Lightbulb,
  AlertTriangle,
  Target,
  ArrowRight,
} from "lucide-react";
import type { SerpResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SerpTabProps {
  result: SerpResult | null;
  loading: boolean;
  error: string | null;
  initialKeyword: string;
  onGenerate: (keyword: string) => void;
}

export function SerpTab({
  result,
  loading,
  error,
  initialKeyword,
  onGenerate,
}: SerpTabProps) {
  const [keyword, setKeyword] = useState(initialKeyword);

  useEffect(() => {
    if (!keyword) setKeyword(initialKeyword);
  }, [initialKeyword]);

  if (!result) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-md">
            <Search className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            SERP analysis
          </h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            We&apos;ll search Google for your keyword, surface who&apos;s
            running ads + which competitors rank organically (landing pages
            only — no blogs), and run a SWOT against the cluster.
          </p>

          <label className="block text-left text-sm font-medium text-gray-700 mb-2">
            Primary keyword
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. global payroll platform"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => onGenerate(keyword.trim())}
              disabled={loading || !keyword.trim()}
              className={cn(
                "inline-flex items-center gap-2 px-5 rounded-xl font-semibold text-sm transition-all shrink-0",
                loading || !keyword.trim()
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-lg shadow-violet-600/20",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  Run SERP analysis
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-left">
            Auto-detected from the URL slug. Edit if needed before running.
          </p>

          {error && (
            <div className="mt-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 text-left">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <div className="flex items-baseline gap-4 text-sm">
          <div>
            <span className="text-gray-500">Keyword:</span>{" "}
            <span className="font-semibold text-gray-900">
              &ldquo;{result.keyword_used}&rdquo;
            </span>
          </div>
          <div>
            <span className="text-gray-500">Competitors analyzed:</span>{" "}
            <span className="font-semibold text-gray-900 tabular-nums">
              {result.meta.competitors_fetched}
            </span>
            {result.meta.competitors_failed > 0 && (
              <span className="text-gray-400">
                {" "}
                ({result.meta.competitors_failed} blocked)
              </span>
            )}
          </div>
          <div>
            <span className="text-gray-500">Confidence:</span>{" "}
            <span
              className={cn(
                "font-semibold capitalize",
                result.search_confidence === "high"
                  ? "text-emerald-700"
                  : result.search_confidence === "medium"
                    ? "text-amber-700"
                    : "text-red-700",
              )}
            >
              {result.search_confidence}
            </span>
          </div>
        </div>
        <button
          onClick={() => onGenerate(result.keyword_used)}
          disabled={loading}
          className="text-xs font-medium text-violet-700 hover:text-violet-900 disabled:opacity-50"
        >
          Re-run
        </button>
      </div>

      {/* Ads */}
      {result.ads.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
            <Megaphone className="w-3.5 h-3.5 text-violet-600" />
            Bidding on this keyword ({result.ads.length})
          </h3>
          <div className="space-y-3">
            {result.ads.map((ad, i) => (
              <a
                key={i}
                href={ad.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Ad
                      </span>
                      <span className="text-xs font-medium text-gray-700">
                        {ad.advertiser}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-violet-700 transition-colors">
                      {ad.headline}
                    </div>
                    {ad.snippet && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {ad.snippet}
                      </p>
                    )}
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-1 group-hover:text-violet-600 transition-colors" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Organic competitors */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
          <Globe className="w-3.5 h-3.5 text-violet-600" />
          Competitors ranking organically ({result.organic_competitors.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.organic_competitors.map((c, i) => (
            <a
              key={i}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg border border-gray-200 hover:border-violet-300 hover:bg-violet-50/30 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                  {c.page_type.replace(/_/g, " ")}
                </span>
                <span className="text-xs font-medium text-gray-700">
                  {c.company}
                </span>
              </div>
              <div className="text-sm font-medium text-gray-900 group-hover:text-violet-700 transition-colors line-clamp-2">
                {c.title}
              </div>
              {c.snippet && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                  {c.snippet}
                </p>
              )}
            </a>
          ))}
        </div>
      </div>

      {/* SWOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SwotQuadrant
          label="Strengths"
          subtitle="What competitor pages do well"
          icon={Shield}
          tone="emerald"
          items={result.swot.strengths}
        />
        <SwotQuadrant
          label="Weaknesses"
          subtitle="Shared gaps across the cluster"
          icon={AlertTriangle}
          tone="red"
          items={result.swot.weaknesses}
        />
        <SwotQuadrant
          label="Opportunities"
          subtitle="Angles no competitor takes"
          icon={Lightbulb}
          tone="violet"
          items={result.swot.opportunities}
        />
        <SwotQuadrant
          label="Threats"
          subtitle="Hard-to-beat moats"
          icon={Target}
          tone="amber"
          items={result.swot.threats}
        />
      </div>

      {/* Your page position */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
          Your page vs the cluster
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-1.5">
              Where you match or beat
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {result.your_page_position.vs_cluster_strengths}
            </p>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-red-700 mb-1.5">
              Where you share the cluster&apos;s gaps
            </div>
            <p className="text-sm text-gray-700 leading-relaxed">
              {result.your_page_position.vs_cluster_gaps}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-violet-700 mb-2">
            Differentiation themes you can own
          </div>
          <ul className="space-y-2">
            {result.your_page_position.differentiation_themes.map((t, i) => (
              <li
                key={i}
                className="flex gap-2 text-sm text-gray-800 leading-relaxed"
              >
                <span className="text-violet-600 font-mono text-xs mt-0.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SwotQuadrant({
  label,
  subtitle,
  icon: Icon,
  tone,
  items,
}: {
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "emerald" | "red" | "violet" | "amber";
  items: string[];
}) {
  const toneClasses = {
    emerald: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-700",
      label: "text-emerald-700",
    },
    red: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-700",
      label: "text-red-700",
    },
    violet: {
      bg: "bg-violet-50",
      border: "border-violet-200",
      icon: "text-violet-700",
      label: "text-violet-700",
    },
    amber: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-700",
      label: "text-amber-700",
    },
  }[tone];
  return (
    <div className={cn("rounded-xl border p-5", toneClasses.border, toneClasses.bg)}>
      <div className="flex items-baseline gap-2 mb-1">
        <Icon className={cn("w-3.5 h-3.5", toneClasses.icon)} />
        <span
          className={cn(
            "text-xs font-bold uppercase tracking-wider",
            toneClasses.label,
          )}
        >
          {label}
        </span>
      </div>
      <p className="text-[11px] text-gray-500 mb-3">{subtitle}</p>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm text-gray-800 leading-relaxed flex gap-2"
          >
            <span className="text-gray-400 mt-0.5">·</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
