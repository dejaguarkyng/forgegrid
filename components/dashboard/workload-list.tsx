"use client";

import { useState } from "react";
import type { Workload, WorkloadStatus } from "@/lib/insforge";

interface WorkloadListProps {
  workloads: Workload[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (workload: Workload) => void;
  onDelete: (id: string) => Promise<void>;
}

const statusBadge: Record<WorkloadStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-zinc-500/20 text-zinc-400 border-zinc-500/20" },
  submitting: { label: "Submitting", cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/20" },
  queued: { label: "Queued", cls: "bg-blue-500/20 text-blue-400 border-blue-500/20" },
  running: { label: "Running", cls: "bg-purple-500/20 text-purple-400 border-purple-500/20" },
  completed: { label: "Completed", cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/20" },
  failed: { label: "Failed", cls: "bg-red-500/20 text-red-400 border-red-500/20" },
};

function StatusBadge({ status }: { status: WorkloadStatus }) {
  const config = statusBadge[status] ?? statusBadge.draft;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${config.cls}`}>
      {config.label}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorkloadList({ workloads, loading, selectedId, onSelect, onDelete }: WorkloadListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (deletingId) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 rounded-xl border border-white/5 bg-white/3 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (workloads.length === 0) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-8 text-center text-sm text-white/30">
        No workloads yet. Submit one using the form.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {workloads.map((w) => (
        <li key={w.id} className="relative group">
          <button
            onClick={() => onSelect(w)}
            className={`w-full text-left rounded-xl border px-4 py-3.5 transition-colors ${
              selectedId === w.id
                ? "border-indigo-500/40 bg-indigo-500/10"
                : "border-white/8 bg-white/3 hover:bg-white/5 hover:border-white/15"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{w.name}</p>
                <p className="text-xs text-white/35 mt-0.5">
                  {w.workload_type} · {w.model_size}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <StatusBadge status={w.status as WorkloadStatus} />
                <span className="text-[11px] text-white/25">{formatDate(w.created_at)}</span>
              </div>
            </div>
          </button>
          <button
            onClick={(e) => handleDelete(e, w.id)}
            disabled={deletingId === w.id}
            aria-label="Delete workload"
            className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deletingId === w.id ? (
              <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/20 border-t-red-400 animate-spin" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M1.75 3.5h10.5M5.25 3.5V2.333a.583.583 0 0 1 .583-.583h2.334a.583.583 0 0 1 .583.583V3.5M11.083 3.5l-.583 7.583a.583.583 0 0 1-.583.584H4.083a.583.583 0 0 1-.583-.584L2.917 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 6.125v3.5M5.25 6.125l.291 3.5M8.75 6.125l-.291 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

export { StatusBadge };
