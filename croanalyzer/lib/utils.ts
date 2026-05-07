import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AnalyzeResult } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Grade = "A" | "B" | "C" | "D";

export function gradeFromScore(score: number): Grade {
  if (score >= 80) return "A";
  if (score >= 65) return "B";
  if (score >= 50) return "C";
  return "D";
}

export function gradeLabel(grade: Grade): string {
  switch (grade) {
    case "A":
      return "Excellent";
    case "B":
      return "Good";
    case "C":
      return "Needs Work";
    case "D":
      return "Critical";
  }
}

export function gradeText(grade: Grade): string {
  switch (grade) {
    case "A":
      return "text-emerald-700";
    case "B":
      return "text-blue-700";
    case "C":
      return "text-amber-700";
    case "D":
      return "text-red-700";
  }
}

export function gradeBg(grade: Grade): string {
  switch (grade) {
    case "A":
      return "bg-emerald-500";
    case "B":
      return "bg-blue-500";
    case "C":
      return "bg-amber-500";
    case "D":
      return "bg-red-500";
  }
}

export function gradeBorder(grade: Grade): string {
  switch (grade) {
    case "A":
      return "border-emerald-200";
    case "B":
      return "border-blue-200";
    case "C":
      return "border-amber-200";
    case "D":
      return "border-red-200";
  }
}

export function severityBadge(sev: "high" | "medium" | "low"): string {
  switch (sev) {
    case "high":
      return "bg-red-50 text-red-700 border border-red-200";
    case "medium":
      return "bg-amber-50 text-amber-700 border border-amber-200";
    case "low":
      return "bg-blue-50 text-blue-700 border border-blue-200";
  }
}

export function pct(score: number, max: number): number {
  return max > 0 ? Math.round((score / max) * 100) : 0;
}

export function pctBarColor(p: number): string {
  if (p >= 75) return "bg-emerald-500";
  if (p >= 50) return "bg-amber-500";
  return "bg-red-500";
}

export function pctTextColor(p: number): string {
  if (p >= 75) return "text-emerald-700";
  if (p >= 50) return "text-amber-700";
  return "text-red-700";
}

export function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export function formatDate(d: Date | string | number): string {
  return new Date(d).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function moduleLabel(id: AnalyzeResult["module_scores"][number]["id"]): string {
  switch (id) {
    case "vp_messaging":
      return "Value Proposition & Messaging";
    case "cta":
      return "CTA & Conversion Flow";
    case "trust_social_proof":
      return "Trust & Social Proof";
    case "copy_readability":
      return "Copy Quality & Readability";
    case "above_the_fold":
      return "Above the Fold Experience";
    case "form_friction":
      return "Form & Lead Friction";
  }
}
