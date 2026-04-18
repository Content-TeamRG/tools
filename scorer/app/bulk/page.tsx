import { BulkAnalyzer } from '@/components/BulkAnalyzer';

export const metadata = {
  title: 'Bulk Analyzer — LLM Content Scorer',
  description: 'Analyze up to 20 URLs at once for LLM content readiness.',
};

export default function BulkPage() {
  return <BulkAnalyzer />;
}
