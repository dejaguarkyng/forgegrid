"use client";

import type { Workload, WorkloadStatus } from "@/lib/insforge";
import { StatusBadge } from "./workload-list";

function sanitize(text: string | null): string | null {
  if (!text) return text;
  return text
    .replace(/\bRunPod\b/gi, "ForgeGrid")
    .split("\n")
    .filter((line) => !/managed\s+forgegrid/i.test(line))
    .join("\n")
    .trim() || null;
}

interface WorkloadDetailProps {
  workload: Workload | null;
  liveState: "connecting" | "connected" | "reconnecting";
  liveMessage: string | null;
}

export default function WorkloadDetail({ workload, liveState, liveMessage }: WorkloadDetailProps) {
  // No selection state
  if (!workload) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/3 px-5 py-12 text-center text-sm text-white/25">
        Select a workload from the list to view details
      </div>
    );
  }

  const canStream = !!workload.jungle_grid_job_id;

  return (
    <div className="rounded-xl border border-white/8 bg-white/3 divide-y divide-white/8">
      {/* Header */}
      <div className="px-5 py-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-white truncate">{workload.name}</h3>
          <p className="text-xs text-white/35 mt-0.5">
            {workload.workload_type} · {workload.model_size} · {workload.optimize_for}
          </p>
        </div>
        <StatusBadge status={workload.status as WorkloadStatus} />
      </div>

      {/* Metadata */}
      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <MetaRow label="ID" value={workload.id} mono />
        {workload.jungle_grid_job_id && (
          <MetaRow label="Jungle Grid Job ID" value={workload.jungle_grid_job_id} mono />
        )}
        <MetaRow label="Image" value={workload.image} mono />
        <MetaRow label="Command" value={workload.command} mono />
        <MetaRow label="Created" value={new Date(workload.created_at).toLocaleString()} />
        <MetaRow label="Updated" value={new Date(workload.updated_at).toLocaleString()} />
      </div>

      {canStream ? (
        <div className="px-5 py-4 flex items-center gap-3">
          <LiveUpdateBadge state={liveState} />
          {liveMessage ? (
            <span className="text-xs text-amber-300">{liveMessage}</span>
          ) : (
            <span className="text-xs text-white/30">Status and logs update automatically.</span>
          )}
        </div>
      ) : (
        <div className="px-5 py-4 flex items-center gap-3">
          <span className="text-xs text-white/30">Waiting for Jungle Grid job id to start live updates.</span>
        </div>
      )}

      {/* Logs */}
      <LogPanel label="Logs" content={sanitize(workload.logs)} emptyMsg="No logs available yet." />

      {/* Output */}
      <LogPanel label="Output" content={sanitize(workload.output)} emptyMsg="No output yet." />

      {/* Error */}
      {workload.error_message && (
        <div className="px-5 py-4">
          <p className="text-xs font-medium text-red-400 uppercase tracking-wide mb-2">Error</p>
          <pre className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap break-words">
            {workload.error_message}
          </pre>
        </div>
      )}
    </div>
  );
}

function MetaRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-white/35 uppercase tracking-wide text-[10px] font-medium mb-0.5">{label}</p>
      <p className={`text-white/70 break-all ${mono ? "font-mono text-[11px]" : "text-xs"}`}>{value}</p>
    </div>
  );
}

function LogPanel({ label, content, emptyMsg }: { label: string; content: string | null; emptyMsg: string }) {
  return (
    <div className="px-5 py-4">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">{label}</p>
      {content ? (
        <pre className="text-xs text-white/60 bg-black/30 border border-white/8 rounded-lg px-4 py-3 overflow-x-auto whitespace-pre-wrap break-words max-h-48 overflow-y-auto">
          {content}
        </pre>
      ) : (
        <p className="text-xs text-white/25 italic">{emptyMsg}</p>
      )}
    </div>
  );
}

function LiveUpdateBadge({ state }: { state: WorkloadDetailProps["liveState"] }) {
  const dotClass =
    state === "connected"
      ? "bg-emerald-400"
      : state === "reconnecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-white/30 animate-pulse";

  const label =
    state === "connected"
      ? "Live stream active"
      : state === "reconnecting"
        ? "Reconnecting live stream"
        : "Connecting live stream";

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/60">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}
