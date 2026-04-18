'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getLocalReport } from '@/lib/db';
import type { ScoreReport } from '@/lib/scorer/types';
import { ReportView } from '@/components/ReportView';
import { useRouter } from 'next/navigation';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const [report, setReport] = useState<ScoreReport | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const id = params?.id as string;
    if (!id) return;

    const stored = getLocalReport(id);
    if (stored) {
      setReport(stored.report);
    } else {
      setNotFound(true);
    }
  }, [params]);

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] text-center px-4">
        <div className="text-4xl mb-4">404</div>
        <h2 className="text-xl font-semibold text-white mb-2">Report not found</h2>
        <p className="text-zinc-400 mb-6 text-sm">
          Reports are stored locally in this browser. This link may not work on other devices.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Back to analyzer
        </button>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <ReportView report={report} onReset={() => router.push('/')} />;
}
