'use client';

import { useState } from 'react';
import { Analyzer } from '@/components/Analyzer';
import type { ScoreReport } from '@/lib/scorer/types';
import { ReportView } from '@/components/ReportView';

export default function HomePage() {
  const [report, setReport] = useState<ScoreReport | null>(null);

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      {!report ? (
        <Analyzer onReport={setReport} />
      ) : (
        <ReportView report={report} onReset={() => setReport(null)} />
      )}
    </div>
  );
}
