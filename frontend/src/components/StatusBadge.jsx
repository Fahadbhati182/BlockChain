import React from "react";
import { CheckCircle2, Clock } from "lucide-react";

export default function StatusBadge({ status, className = "" }) {
  // status: 0 or "Available" -> Available, 1 or "Issued" -> Issued
  const isAvailable = status === 0 || status === "Available";

  if (isAvailable) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
        <CheckCircle2 className="w-3.5 h-3.5" />
        Available
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20 ${className}`}
    >
      <Clock className="w-3.5 h-3.5 text-amber-700" />
      Issued
    </span>
  );
}
