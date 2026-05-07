import type { PageContext } from "@/lib/types";
import { Briefcase, Users, Package, Mic } from "lucide-react";

export function PageProfileCard({ pc }: { pc: PageContext }) {
  const fields = [
    { label: "Industry", value: pc.industry, icon: Briefcase },
    { label: "ICP", value: pc.icp, icon: Users },
    { label: "Product", value: pc.product_name, icon: Package },
    { label: "Voice", value: pc.voice_markers?.tone, icon: Mic },
  ].filter((f) => f.value && f.value !== "unclear");

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
        Page Profile
      </h3>
      <div className="space-y-3 mb-4">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex gap-3">
            <Icon className="w-3.5 h-3.5 text-violet-600 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                {label}
              </div>
              <div className="text-sm text-gray-800 leading-snug">{value}</div>
            </div>
          </div>
        ))}
      </div>

      {pc.terminology?.length > 0 && (
        <div className="pt-4 border-t border-gray-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Their Terminology
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pc.terminology.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {pc.key_pain_points?.length > 0 && (
        <div className="pt-4 mt-4 border-t border-gray-100">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Pain Points Named
          </div>
          <ul className="space-y-1">
            {pc.key_pain_points.slice(0, 4).map((p, i) => (
              <li key={i} className="text-xs text-gray-600 leading-relaxed">
                — {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
