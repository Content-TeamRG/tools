import { createClient } from '@supabase/supabase-js';
import type { ScoreReport } from './scorer/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface StoredReport {
  id: string;
  created_at: string;
  report: ScoreReport;
  share_token?: string;
}

export async function saveReport(report: ScoreReport): Promise<StoredReport | null> {
  if (!supabase) {
    // Fallback to localStorage (client-side only)
    return null;
  }

  const shareToken = generateToken();
  const { data, error } = await supabase
    .from('reports')
    .insert({ report, share_token: shareToken })
    .select()
    .single();

  if (error) {
    console.error('Failed to save report:', error);
    return null;
  }

  return data as StoredReport;
}

export async function getReport(id: string): Promise<StoredReport | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data as StoredReport;
}

export async function getReportByToken(token: string): Promise<StoredReport | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error) return null;
  return data as StoredReport;
}

export async function listReports(limit = 50): Promise<StoredReport[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data || []) as StoredReport[];
}

function generateToken(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

// Local storage fallback for when Supabase is not configured
export function saveReportLocally(report: ScoreReport): string {
  const id = generateToken();
  const stored: StoredReport = { id, created_at: new Date().toISOString(), report };
  const existing = getLocalReports();
  existing.unshift(stored);
  // Keep last 100
  const trimmed = existing.slice(0, 100);
  localStorage.setItem('llm_scorer_reports', JSON.stringify(trimmed));
  return id;
}

export function getLocalReports(): StoredReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('llm_scorer_reports');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getLocalReport(id: string): StoredReport | null {
  const reports = getLocalReports();
  return reports.find((r) => r.id === id) || null;
}

export function deleteLocalReport(id: string): void {
  const reports = getLocalReports().filter((r) => r.id !== id);
  localStorage.setItem('llm_scorer_reports', JSON.stringify(reports));
}
