'use client';

import type { ScoreReport } from '@/lib/scorer/types';
import { cn } from '@/lib/utils';

interface SentenceHeatmapProps {
  report: ScoreReport;
}

export function SentenceHeatmap({ report }: SentenceHeatmapProps) {
  const longSentences = report.metadata.long_sentences || [];

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-zinc-500">Sentence length:</span>
        {[
          { label: '≤10 words', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
          { label: '11–15 words', cls: 'bg-emerald-500/10 text-emerald-400/80 border-emerald-500/20' },
          { label: '16–20 words (limit)', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
          { label: '21–25 words', cls: 'bg-orange-500/20 text-orange-300 border-orange-500/30' },
          { label: '>25 words (critical)', cls: 'bg-red-500/25 text-red-300 border-red-500/40' },
        ].map(({ label, cls }) => (
          <span key={label} className={cn('px-2 py-0.5 rounded border text-xs', cls)}>
            {label}
          </span>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total sentences', value: report.metadata.sentence_count },
          { label: 'Avg length', value: `${report.metadata.avg_sentence_length} words` },
          { label: 'Over 20 words', value: longSentences.length },
          { label: 'Status', value: longSentences.length === 0 ? '✓ Pass' : '✗ Fail' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
            <div className="text-xs text-zinc-500 mb-1">{label}</div>
            <div className="text-base font-semibold text-zinc-100">{value}</div>
          </div>
        ))}
      </div>

      {/* Long sentences list */}
      {longSentences.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-400 mb-3">
            Sentences exceeding 20 words ({longSentences.length} found)
          </h3>
          <div className="space-y-2">
            {longSentences.map((s, i) => (
              <div
                key={i}
                className="border border-red-500/30 bg-red-500/10 rounded-lg p-3 flex items-start gap-3"
              >
                <span className="text-xs font-mono text-red-400 shrink-0 mt-0.5">{s.words}w</span>
                <p className="text-sm text-zinc-300">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            Split each red sentence at a conjunction (and, but, which, that, because). One clause = one sentence.
          </p>
        </div>
      )}

      {longSentences.length === 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
          <div className="text-2xl mb-2">✓</div>
          <div className="text-emerald-400 font-semibold">All sentences are 20 words or fewer</div>
          <div className="text-zinc-500 text-sm mt-1">Great job! Short sentences maximise AI extractability.</div>
        </div>
      )}

      {/* Guidance */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
        <p className="font-medium text-zinc-300 mb-1">Why sentence length matters</p>
        <p>Cited content averages Flesch-Kincaid grade 16; uncited content averages grade 19. Long sentences embed meaning in context that RAG systems cannot reliably extract in isolation. Each sentence must carry one complete, extractable idea.</p>
      </div>
    </div>
  );
}
