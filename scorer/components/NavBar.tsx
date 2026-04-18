'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { BarChart3, Zap, Layers } from 'lucide-react';

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-zinc-100 group-hover:text-white transition-colors">
            LLM Scorer
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <Link
            href="/"
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              pathname === '/'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            )}
          >
            Analyzer
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors',
              pathname === '/dashboard'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <Link
            href="/bulk"
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors',
              pathname === '/bulk'
                ? 'bg-zinc-800 text-white'
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Bulk
          </Link>
        </div>
      </div>
    </nav>
  );
}
