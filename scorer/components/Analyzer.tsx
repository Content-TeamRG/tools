'use client';

import { useState } from 'react';
import type { ScoreReport } from '@/lib/scorer/types';
import { Globe, FileText, Loader2, AlertCircle, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyzerProps {
  onReport: (report: ScoreReport) => void;
}

export function Analyzer({ onReport }: AnalyzerProps) {
  const [mode, setMode] = useState<'url' | 'text'>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = mode === 'url' ? { url } : { text };
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Analysis failed');
        return;
      }

      onReport(data);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  const features = [
    '29 LLM-readiness criteria',
    'Grade A–D scoring (0–40 pts)',
    'Critical failure detection',
    'Exact remediation steps',
    'Section-by-section breakdown',
    'Sentence length heatmap',
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-6">
          <Zap className="w-3 h-3" />
          AI Engine Optimization Scorer
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 leading-tight">
          Will your content get cited
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-500">
            by ChatGPT & Perplexity?
          </span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
          Score any article against 29 proven criteria. Get an A–D grade, identify what&apos;s blocking
          AI citations, and get exact steps to fix it — in seconds.
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 max-w-2xl mx-auto">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2 text-sm text-zinc-400">
            <CheckCircle className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            {f}
          </div>
        ))}
      </div>

      {/* Analyzer card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 max-w-2xl mx-auto shadow-2xl">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-zinc-950 rounded-lg mb-6 w-fit">
          <button
            onClick={() => setMode('url')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              mode === 'url'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Globe className="w-4 h-4" />
            URL
          </button>
          <button
            onClick={() => setMode('text')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
              mode === 'text'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <FileText className="w-4 h-4" />
            Paste text
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'url' ? (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Article URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/your-article"
                required
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all"
              />
              <p className="text-xs text-zinc-600 mt-1.5">
                We&apos;ll fetch and analyze the page content directly
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Content (Markdown or plain text)
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`# What Is Variable Sales Compensation and How Does It Work?\n\nTL;DR: Variable sales compensation links rep pay directly...\n\n## What Are the Core Components of Variable Sales Compensation?\n\n...`}
                required
                rows={12}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all font-mono text-sm resize-none scrollbar-thin"
              />
              <p className="text-xs text-zinc-600 mt-1.5">
                Use # for H1, ## for H2. Paste your draft markdown for instant scoring.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (mode === 'url' ? !url : !text)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all',
              loading || (mode === 'url' ? !url : !text)
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-500 hover:to-purple-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing content…
              </>
            ) : (
              <>
                Score my content
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Stats bar */}
      <div className="flex items-center justify-center gap-8 mt-12 text-center">
        {[
          { value: '29', label: 'Criteria checked' },
          { value: '40', label: 'Max score' },
          { value: '6', label: 'Sections scored' },
          { value: '100%', label: 'Free forever' },
        ].map(({ value, label }) => (
          <div key={label}>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
