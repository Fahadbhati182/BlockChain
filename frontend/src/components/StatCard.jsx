import React from "react";

export default function StatCard({ title, value, subtitle, icon: Icon, color = "blue", badge }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-sm card-hover flex items-start justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
          {badge && (
            <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {badge}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-lg border ${colorStyles[color] || colorStyles.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
