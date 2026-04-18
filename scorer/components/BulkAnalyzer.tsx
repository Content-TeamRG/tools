'use client';

import { useState } from 'react';
import type { ScoreReport } from '@/lib/scorer/types';
import { cn, gradeColor, gradeBg, scorePercent } from '@/lib/utils';
import { Loader2, AlertCircle, Download, CheckCircle, XCircle } from 'lucide-react';

interface BulkResult {
  url: string;
  success: boolean;
  report: ScoreReport | null;
  error: string | null;
}

export function BulkAnalyzer() {
  const [urls, setUrls] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setResults([]);

    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.startsWith('http'));

    if (urlList.length === 0) {
      setError('No valid URLs found. Add one URL per line, starting with http.');
      setLoading(false);
      return;
    }

    if (urlList.length > 20) {
      setError('Maximum 20 URLs. Remove some and try again.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlList }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Bulk analysis failed');
        return;
      }

      setResults(data.reports);
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const rows = [
      ['URL', 'Score', 'Grade', 'Passed', 'Failed', 'Critical Failures', 'Publishable'],
      ...results
        .filter((r) => r.success && r.report)
        .map((r) => {
          const rep = r.report!;
          return [
            r.url,
            `${rep.total_score}/40`,
            rep.grade,
            rep.criteria_passed,
            rep.criteria_failed,
            rep.critical_failures.join(';'),
            rep.is_publishable ? 'Yes' : 'No',
          ];
        }),
    ];

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk-llm-scores-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const successful = results.filter((r) => r.success && r.report);
  const avgScore = successful.length > 0
    ? Math.round(successful.reduce((s, r) => s + r.report!.total_score, 0) / successful.length)
    : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-white mb-2">Bulk URL Analyzer</h1>
      <p className="text-zinc-400 text-sm mb-8">Paste up to 20 URLs (one per line) to get batch LLM readiness scores.</p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <textarea
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          placeholder={`https://example.com/article-one\nhttps://example.com/article-two\nhttps://example.com/article-three`}
          rows={8}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-xl text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all font-mono text-sm resize-none"
        />
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || !urls.trim()}
            className={cn(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all',
              loading || !urls.trim()
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                : 'bg-violet-600 hover:bg-violet-500 text-white'
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Analyzing…' : 'Analyze all'}
          </button>
          {results.length > 0 && (
            <button
              type="button"
              onClick={exportCsv}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{results.length}</div>
              <div className="text-xs text-zinc-500">URLs analyzed</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-white">{avgScore}/40</div>
              <div className="text-xs text-zinc-500">Average score</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-emerald-400">
                {successful.filter((r) => r.report!.is_publishable).length}
              </div>
              <div className="text-xs text-zinc-500">Publishable</div>
            </div>
          </div>

          {/* Ranked results */}
          <div className="space-y-2">
            {[...results]
              .sort((a, b) => (b.report?.total_score || 0) - (a.report?.total_score || 0))
              .map((result, idx) => (
                <BulkResultRow key={result.url} result={result} rank={idx + 1} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BulkResultRow({ result, rank }: { result: BulkResult; rank: number }) {
  const [expanded, setExpanded] = useState(false);

  if (!result.success || !result.report) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl">
        <span className="text-xs text-zinc-600 w-5">#{rank}</span>
        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        <span className="text-sm text-zinc-400 font-mono truncate flex-1">{result.url}</span>
        <span className="text-xs text-red-400">{result.error}</span>
      </div>
    );
  }

  const r = result.report;
  const pct = scorePercent(r.total_score, r.max_score);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left"
      >
        <span className="text-xs text-zinc-600 w-5 shrink-0">#{rank}</span>
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0', gradeBg(r.grade))}>
          {r.grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-zinc-300 truncate font-mono">{result.url}</div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 max-w-[100px] bg-zinc-800 rounded-full h-1">
              <div className={cn('h-1 rounded-full', gradeBg(r.grade))} style={{ width: `${pct}%` }} />
            </div>
            <span className={cn('text-xs font-bold', gradeColor(r.grade))}>{r.total_score}/40</span>
            <span className="text-xs text-zinc-600">{r.criteria_passed}/{r.results.length} passed</span>
          </div>
        </div>
        <div className={cn('w-2 h-2 rounded-full shrink-0', r.is_publishable ? 'bg-emerald-500' : 'bg-red-500')} />
        {r.critical_failures.length > 0 && (
          <span className="text-xs text-red-400 shrink-0">{r.critical_failures.length} critical</span>
        )}
        {r.critical_failures.length === 0 && (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-4 py-3 grid grid-cols-3 sm:grid-cols-6 gap-3">
          {r.section_scores.map((s) => (
            <div key={s.section} className="text-center">
              <div className="text-xs text-zinc-500 mb-1">{s.section}</div>
              <div className="text-sm font-bold text-zinc-200">{s.score}/{s.max_score}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
