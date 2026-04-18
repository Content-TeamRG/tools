'use client';

import { useEffect, useRef, useState } from 'react';
import type { ScoreReport, CriterionResult } from '@/lib/scorer/types';
import {
  cn,
  gradeColor,
  gradeBg,
  gradeBorder,
  impactBadgeClass,
  formatDate,
  formatScore,
  scorePercent,
  truncate,
} from '@/lib/utils';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
  AlertTriangle,
  TrendingUp,
  Zap,
  BarChart2,
  FileText,
  Check,
} from 'lucide-react';
import { saveReportLocally } from '@/lib/db';
import { SentenceHeatmap } from './SentenceHeatmap';

interface ReportViewProps {
  report: ScoreReport;
  onReset: () => void;
}


export function ReportView({ report, onReset }: ReportViewProps) {
  const [expandedCriteria, setExpandedCriteria] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'overview' | 'criteria' | 'actions' | 'heatmap'>('overview');
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-save to localStorage
    const id = saveReportLocally(report);
    setSavedId(id);
  }, [report]);

  function toggleCriterion(id: string) {
    setExpandedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleExportPdf() {
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');

      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#09090b',
        scale: 1.5,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`llm-score-${report.grade}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  }

  function handleCopyLink() {
    if (savedId) {
      navigator.clipboard.writeText(`${window.location.origin}/report/${savedId}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const criticalFailed = report.results.filter((r) => r.impact === 'critical' && r.status === 'fail');
  const pct = scorePercent(report.total_score, report.max_score);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8" ref={reportRef}>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Analyze another
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Share'}
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Score hero */}
      <div className={cn('rounded-2xl border p-6 sm:p-8 mb-6', gradeBorder(report.grade), 'bg-zinc-900')}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          {/* Grade badge */}
          <div className={cn('w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-black shrink-0', gradeBg(report.grade))}>
            {report.grade}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-baseline gap-3 mb-1">
              <span className="text-3xl font-bold text-white">
                {report.total_score}<span className="text-zinc-500 text-xl font-normal">/{report.max_score}</span>
              </span>
              <span className={cn('text-lg font-semibold', gradeColor(report.grade))}>
                {report.grade_label}
              </span>
            </div>

            {report.content_title && (
              <p className="text-zinc-400 text-sm mb-3 truncate">{truncate(report.content_title, 80)}</p>
            )}

            {/* Score bar */}
            <div className="w-full bg-zinc-800 rounded-full h-2 mb-3">
              <div
                className={cn('h-2 rounded-full transition-all', gradeBg(report.grade))}
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-emerald-400">{report.criteria_passed} passed</span>
              <span className="text-zinc-500">·</span>
              <span className="text-red-400">{report.criteria_failed} failed</span>
              <span className="text-zinc-500">·</span>
              <span className={report.is_publishable ? 'text-emerald-400' : 'text-red-400'}>
                {report.is_publishable ? '✓ Publishable' : '✗ Not publishable'}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="text-right text-xs text-zinc-600 shrink-0 hidden sm:block">
            <div>{formatDate(report.scored_at)}</div>
            {report.metadata.word_count > 0 && (
              <div className="mt-1">{report.metadata.word_count.toLocaleString()} words</div>
            )}
          </div>
        </div>
      </div>

      {/* Critical failures alert */}
      {criticalFailed.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4" />
            {criticalFailed.length} Critical Failure{criticalFailed.length > 1 ? 's' : ''} — Fix Before Publishing
          </div>
          <div className="flex flex-wrap gap-2">
            {criticalFailed.map((r) => (
              <button
                key={r.id}
                onClick={() => { setActiveTab('criteria'); toggleCriterion(r.id); }}
                className="px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono hover:bg-red-500/30 transition-colors"
              >
                {r.id}: {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div className="flex gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800 mb-6 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart2 },
          { id: 'criteria', label: 'All Criteria', icon: CheckCircle },
          { id: 'actions', label: 'Action Plan', icon: Zap },
          { id: 'heatmap', label: 'Sentence Heatmap', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as typeof activeTab)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
              activeTab === id
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <OverviewTab report={report} />
      )}
      {activeTab === 'criteria' && (
        <CriteriaTab report={report} expandedCriteria={expandedCriteria} onToggle={toggleCriterion} />
      )}
      {activeTab === 'actions' && (
        <ActionsTab report={report} />
      )}
      {activeTab === 'heatmap' && (
        <SentenceHeatmap report={report} />
      )}
    </div>
  );
}

function OverviewTab({ report }: { report: ScoreReport }) {
  return (
    <div className="space-y-6">
      {/* Section scores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {report.section_scores.map((section) => {
          const pct = scorePercent(section.score, section.max_score);
          const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
          const textColor = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400';
          return (
            <div key={section.section} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-zinc-500">Section {section.section}</span>
                <span className={cn('text-sm font-bold', textColor)}>{formatScore(section.score, section.max_score)}</span>
              </div>
              <div className="text-sm font-medium text-zinc-200 mb-3">{section.label}</div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-2">
                <div className={cn('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
              </div>
              <div className="text-xs text-zinc-500">{section.passed}/{section.total} criteria passed</div>
            </div>
          );
        })}
      </div>

      {/* Metadata */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Content Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Word count', value: report.metadata.word_count.toLocaleString() },
            { label: 'H2 sections', value: report.metadata.h2_count },
            { label: 'Avg sentence length', value: `${report.metadata.avg_sentence_length} words` },
            { label: 'Keyword density', value: `~${report.metadata.keyword_density}%` },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-xs text-zinc-500 mb-1">{label}</div>
              <div className="text-lg font-semibold text-zinc-100">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CriteriaTab({
  report,
  expandedCriteria,
  onToggle,
}: {
  report: ScoreReport;
  expandedCriteria: Set<string>;
  onToggle: (id: string) => void;
}) {
  const [filter, setFilter] = useState<'all' | 'fail' | 'pass'>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');

  const filtered = report.results.filter((r) => {
    const statusMatch = filter === 'all' || r.status === filter;
    const sectionMatch = sectionFilter === 'all' || r.section === sectionFilter;
    return statusMatch && sectionMatch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          {(['all', 'fail', 'pass'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1 rounded text-xs font-medium capitalize transition-colors',
                filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {f === 'all' ? `All (${report.results.length})` : f === 'fail' ? `Failed (${report.criteria_failed})` : `Passed (${report.criteria_passed})`}
            </button>
          ))}
        </div>
        <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg">
          {(['all', 'A', 'B', 'C', 'D', 'E', 'F'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSectionFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium font-mono transition-colors',
                sectionFilter === s ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((criterion) => (
          <CriterionCard
            key={criterion.id}
            criterion={criterion}
            expanded={expandedCriteria.has(criterion.id)}
            onToggle={() => onToggle(criterion.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CriterionCard({
  criterion,
  expanded,
  onToggle,
}: {
  criterion: CriterionResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isPassed = criterion.status === 'pass';
  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all',
        isPassed ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-700 bg-zinc-900'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
      >
        {isPassed ? (
          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
        )}
        <span className="font-mono text-xs text-zinc-500 shrink-0">{criterion.id}</span>
        <span className={cn('text-sm font-medium flex-1', isPassed ? 'text-zinc-400' : 'text-zinc-100')}>
          {criterion.label}
        </span>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', impactBadgeClass(criterion.impact))}>
          {criterion.impact}
        </span>
        <span className={cn('text-sm font-bold shrink-0 ml-2', isPassed ? 'text-emerald-400' : 'text-red-400')}>
          {criterion.points_awarded}/2
        </span>
        {!isPassed && (
          expanded ? <ChevronUp className="w-4 h-4 text-zinc-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
        )}
      </button>

      {!isPassed && expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-3 space-y-3">
          {criterion.details && (
            <div className="text-xs text-zinc-500 font-mono bg-zinc-950 px-3 py-2 rounded-lg">
              {criterion.details}
            </div>
          )}
          <div>
            <div className="text-xs font-semibold text-red-400 mb-1">Why this fails</div>
            <p className="text-sm text-zinc-400">{criterion.fail_explanation}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-violet-400 mb-1">How to fix</div>
            <p className="text-sm text-zinc-300">{criterion.remediation}</p>
          </div>
        </div>
      )}

      {isPassed && criterion.details && expanded && (
        <div className="px-4 pb-3 border-t border-zinc-800 pt-2">
          <div className="text-xs text-zinc-600 font-mono">{criterion.details}</div>
        </div>
      )}
    </div>
  );
}

function ActionsTab({ report }: { report: ScoreReport }) {
  if (report.priority_actions.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">All criteria passed!</h3>
        <p className="text-zinc-400">Your content is citation-ready. Publish and monitor.</p>
      </div>
    );
  }

  const grouped = {
    critical: report.priority_actions.filter((a) => a.impact === 'critical'),
    high: report.priority_actions.filter((a) => a.impact === 'high'),
    medium: report.priority_actions.filter((a) => a.impact === 'medium'),
  };

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([impact, actions]) => {
        if (actions.length === 0) return null;
        const labels = { critical: 'Critical — Fix First', high: 'High Priority', medium: 'Medium Priority' };
        return (
          <div key={impact}>
            <h3 className={cn('text-sm font-semibold mb-3', impactBadgeClass(impact), 'inline-flex px-3 py-1 rounded-full')}>
              {labels[impact as keyof typeof labels]} ({actions.length})
            </h3>
            <div className="space-y-3">
              {actions.map((action) => (
                <div key={action.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs text-zinc-500">{action.id}</span>
                    <span className="text-sm font-semibold text-zinc-100">{action.label}</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-3">{action.fail_explanation}</p>
                  <div className="bg-zinc-950 rounded-lg p-3 border border-violet-500/20">
                    <div className="text-xs font-semibold text-violet-400 mb-1">Action</div>
                    <p className="text-sm text-zinc-300">{action.remediation}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
