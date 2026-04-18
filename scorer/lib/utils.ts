import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function gradeColor(grade: string): string {
  switch (grade) {
    case 'A': return 'text-emerald-500';
    case 'B': return 'text-blue-500';
    case 'C': return 'text-amber-500';
    case 'D': return 'text-red-500';
    default: return 'text-gray-500';
  }
}

export function gradeBg(grade: string): string {
  switch (grade) {
    case 'A': return 'bg-emerald-500';
    case 'B': return 'bg-blue-500';
    case 'C': return 'bg-amber-500';
    case 'D': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
}

export function gradeBorder(grade: string): string {
  switch (grade) {
    case 'A': return 'border-emerald-500';
    case 'B': return 'border-blue-500';
    case 'C': return 'border-amber-500';
    case 'D': return 'border-red-500';
    default: return 'border-gray-500';
  }
}

export function impactColor(impact: string): string {
  switch (impact) {
    case 'critical': return 'text-red-500';
    case 'high': return 'text-amber-500';
    case 'medium': return 'text-blue-400';
    default: return 'text-gray-400';
  }
}

export function impactBadgeClass(impact: string): string {
  switch (impact) {
    case 'critical': return 'bg-red-500/20 text-red-400 border border-red-500/30';
    case 'high': return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    case 'medium': return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

export function formatScore(score: number, max: number): string {
  return `${score}/${max}`;
}

export function scorePercent(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}
