import Link from "next/link";
import { Sparkles, Check, ArrowRight, Zap } from "lucide-react";

const FREE_FEATURES = [
  "1 analysis per session",
  "100-point CRO rubric",
  "Score across 6 modules",
  "Sentence-level heatmap",
  "3-8 high-leverage findings",
  "Rewrite suggestions",
];

const PRO_FEATURES = [
  "Unlimited analyses",
  "Everything in Free",
  "SERP competitor comparison",
  "Full page rewrite (3 modes)",
  "Before/after diff view",
  "PDF export",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-5xl mx-auto h-14 px-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">CRO Analyzer</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to tool
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-5 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium mb-5">
            <Zap className="w-3 h-3" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Start free. Upgrade when
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">
              you&apos;re ready.
            </span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Every analysis is grounded in your page&apos;s specific industry, audience, and language.
            No generic CRO advice.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col shadow-sm">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Free
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-gray-900">$0</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Your first analysis, no card needed.
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-gray-600" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/"
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition-colors"
            >
              Get started free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Pro */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-8 flex flex-col shadow-xl shadow-violet-600/25 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="mb-6 relative">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-200 mb-2">
                Pro
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-white">$10</span>
                <span className="text-violet-200 text-sm">/month</span>
              </div>
              <p className="text-sm text-violet-200 mt-2">
                Unlimited analyses. Full feature access.
              </p>
            </div>

            <ul className="space-y-3 mb-8 flex-1 relative">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm text-white">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-violet-700 text-sm font-semibold opacity-60 cursor-not-allowed relative"
            >
              Coming soon
            </button>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-gray-400 mt-10">
          Pro payments are not yet live. The tool is fully free to use while we&apos;re in beta.
        </p>
      </div>
    </div>
  );
}
