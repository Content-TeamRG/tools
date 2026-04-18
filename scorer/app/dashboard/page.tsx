'use client';

import { useEffect, useState } from 'react';
import { getLocalReports, deleteLocalReport, type StoredReport } from '@/lib/db';
import type { ScoreReport } from '@/lib/scorer/types';
import Link from 'next/link';
import { cn, gradeColor, gradeBg, formatDate, truncate, scorePercent } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Trash2,
  ExternalLink,
  TrendingUp,
  BarChart2,
  PieChart as PieIcon,
  ArrowRight,
  Zap,
} from 'lucide-react';

const GRADE_COLORS: Record<string, string> = {
  A: '#10b981',
  B: '#3b82f6',
  C: '#f59e0b',
  D: '#ef4444',
};

export default function DashboardPage() {
  const [reports, setReports] = useState<StoredReport[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setReports(getLocalReports());
    setLoaded(true);
  }, []);

  function handleDelete(id: string) {
    deleteLocalReport(id);
    setReports(getLocalReports());
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-6">
          <BarChart2 className="w-8 h-8 text-zinc-600" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">No reports yet</h2>
        <p className="text-zinc-400 mb-8">
          Analyze your first article to start tracking your content&apos;s LLM readiness over time.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold text-sm transition-colors"
        >
          Score your first article
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const allScores = reports.map((r) => r.report);
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">{reports.length} report{reports.length > 1 ? 's' : ''} · saved locally</p>
        </div>
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          New analysis
        </Link>
      </div>

      {/* Summary stats */}
      <SummaryStats reports={allScores} />

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-6">
        <GradeDistributionChart reports={allScores} />
        <TopFailingCriteriaChart reports={allScores} />
      </div>

      {/* Score trend */}
      {reports.length > 1 && <ScoreTrendChart reports={reports} />}

      {/* Report table */}
      <ContentLeaderboard reports={reports} onDelete={handleDelete} />
    </div>
  );
}

function SummaryStats({ reports }: { reports: ScoreReport[] }) {
  const avg = Math.round(reports.reduce((s, r) => s + r.total_score, 0) / reports.length);
  const publishable = reports.filter((r) => r.is_publishable).length;
  const gradeA = reports.filter((r) => r.grade === 'A').length;
  const criticalFails = reports.reduce((s, r) => s + r.critical_failures.length, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {[
        { label: 'Avg score', value: `${avg}/40`, sub: 'across all articles' },
        { label: 'Publishable', value: publishable, sub: `of ${reports.length} articles` },
        { label: 'Grade A articles', value: gradeA, sub: 'citation-ready' },
        { label: 'Critical failures', value: criticalFails, sub: 'total across all' },
      ].map(({ label, value, sub }) => (
        <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-xs text-zinc-500 mb-1">{label}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>
        </div>
      ))}
    </div>
  );
}

function GradeDistributionChart({ reports }: { reports: ScoreReport[] }) {
  const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  reports.forEach((r) => counts[r.grade]++);
  const data = Object.entries(counts).map(([grade, count]) => ({ grade, count }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
        <PieIcon className="w-4 h-4 text-violet-400" />
        Grade Distribution
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="grade"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
          >
            {data.map((entry) => (
              <Cell key={entry.grade} fill={GRADE_COLORS[entry.grade]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fafafa' }}
            formatter={(value, name) => [`${value} article${Number(value) !== 1 ? 's' : ''}`, `Grade ${name}`]}
          />
          <Legend
            formatter={(value) => <span style={{ color: '#a1a1aa', fontSize: '12px' }}>Grade {value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopFailingCriteriaChart({ reports }: { reports: ScoreReport[] }) {
  const failCounts: Record<string, { id: string; label: string; count: number }> = {};
  for (const report of reports) {
    for (const r of report.results) {
      if (r.status === 'fail') {
        if (!failCounts[r.id]) failCounts[r.id] = { id: r.id, label: r.label, count: 0 };
        failCounts[r.id].count++;
      }
    }
  }

  const data = Object.values(failCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((d) => ({ ...d, shortLabel: d.id }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-violet-400" />
        Most Frequently Failed Criteria
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <XAxis type="number" tick={{ fill: '#71717a', fontSize: 11 }} />
          <YAxis type="category" dataKey="shortLabel" tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }} width={30} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }}
            formatter={(value, _, props) => [
              `${value} failure${Number(value) !== 1 ? 's' : ''}`,
              (props as { payload?: { label?: string } }).payload?.label || '',
            ]}
          />
          <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ScoreTrendChart({ reports }: { reports: StoredReport[] }) {
  const data = [...reports]
    .reverse()
    .slice(0, 20)
    .map((r, i) => ({
      index: i + 1,
      score: r.report.total_score,
      date: new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      title: truncate(r.report.content_title || r.report.content_url, 30),
    }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
      <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-violet-400" />
        Score Trend (last {data.length} analyses)
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} />
          <YAxis domain={[0, 40]} tick={{ fill: '#71717a', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px', color: '#fafafa', fontSize: '12px' }}
            formatter={(value) => [`${value}/40`]}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#7c3aed"
            strokeWidth={2}
            dot={{ fill: '#7c3aed', strokeWidth: 0, r: 4 }}
            activeDot={{ r: 6 }}
          />
          {/* Reference lines at 30 and 37 */}
          <Legend />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ContentLeaderboard({
  reports,
  onDelete,
}: {
  reports: StoredReport[];
  onDelete: (id: string) => void;
}) {
  const sorted = [...reports].sort((a, b) => b.report.total_score - a.report.total_score);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-300">Content Leaderboard</h3>
      </div>
      <div className="divide-y divide-zinc-800">
        {sorted.map((stored, idx) => {
          const r = stored.report;
          const pct = scorePercent(r.total_score, r.max_score);
          return (
            <div key={stored.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/30 transition-colors group">
              <span className="text-sm text-zinc-600 w-5 shrink-0">#{idx + 1}</span>
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0', gradeBg(r.grade))}>
                {r.grade}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-zinc-200 truncate">
                  {r.content_title || r.content_url || 'Pasted content'}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex-1 max-w-[120px] bg-zinc-800 rounded-full h-1">
                    <div
                      className={cn('h-1 rounded-full', gradeBg(r.grade))}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn('text-xs font-bold', gradeColor(r.grade))}>{r.total_score}/40</span>
                  <span className="text-xs text-zinc-600">{formatDate(stored.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/report/${stored.id}`}
                  className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => onDelete(stored.id)}
                  className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className={cn('shrink-0 w-2 h-2 rounded-full', r.is_publishable ? 'bg-emerald-500' : 'bg-red-500')} title={r.is_publishable ? 'Publishable' : 'Not publishable'} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
