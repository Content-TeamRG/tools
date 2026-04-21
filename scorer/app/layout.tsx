import type { Metadata } from 'next';
import './globals.css';
import { NavBar } from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'LLM Content Scorer — AI Readiness Analyzer',
  description: 'Score your content against 29 criteria for LLM citation readiness. Get a grade, identify critical failures, and get exact remediation steps.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
        <NavBar />
        <main>{children}</main>
        <footer className="text-center py-6 text-xs text-zinc-600">
          Made by Navya
        </footer>
      </body>
    </html>
  );
}
