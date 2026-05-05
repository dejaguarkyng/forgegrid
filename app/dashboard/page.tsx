"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Workload } from "@/lib/insforge";
import HealthBanner from "@/components/dashboard/health-banner";
import WorkloadForm from "@/components/dashboard/workload-form";
import WorkloadList from "@/components/dashboard/workload-list";
import WorkloadDetail from "@/components/dashboard/workload-detail";

type LiveConnectionState = "connecting" | "connected" | "reconnecting";

export default function DashboardPage() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedWorkloadId, setSelectedWorkloadId] = useState<string | null>(null);
  const [liveState, setLiveState] = useState<LiveConnectionState>("connecting");
  const [liveMessage, setLiveMessage] = useState<string | null>(null);

  const selectedWorkload =
    workloads.find((workload) => workload.id === selectedWorkloadId) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function fetchWorkloads() {
      try {
        const res = await fetch("/api/workloads", { cache: "no-store" });
        const data = await res.json();

        if (!res.ok) {
          if (!cancelled) {
            setListError(data.error ?? "Failed to load workloads");
          }
          return;
        }

        if (!cancelled) {
          setWorkloads(data as Workload[]);
          setListError(null);
        }
      } catch {
        if (!cancelled) {
          setListError("Network error — could not load workloads");
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }

    void fetchWorkloads();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const eventSource = new EventSource("/api/workloads/stream");

    const handleWorkloads = (event: Event) => {
      const message = event as MessageEvent<string>;

      try {
        const nextWorkloads = JSON.parse(message.data) as Workload[];
        setWorkloads(nextWorkloads);
        setLoadingList(false);
        setListError(null);
        setLiveState("connected");
        setLiveMessage(null);
      } catch {
        setLiveMessage("Received an invalid live update payload.");
      }
    };

    const handleSyncError = (event: Event) => {
      const message = event as MessageEvent<string>;

      try {
        const data = JSON.parse(message.data) as { message?: string };
        setLiveMessage(data.message ?? "Live sync hit an error. Showing the last stored state.");
      } catch {
        setLiveMessage("Live sync hit an error. Showing the last stored state.");
      }
    };

    eventSource.onopen = () => {
      setLiveState("connected");
      setLiveMessage(null);
    };

    eventSource.onerror = () => {
      setLiveState("reconnecting");
      setLiveMessage("Live updates disconnected. Reconnecting...");
    };

    eventSource.addEventListener("workloads", handleWorkloads);
    eventSource.addEventListener("sync-error", handleSyncError);

    return () => {
      eventSource.removeEventListener("workloads", handleWorkloads);
      eventSource.removeEventListener("sync-error", handleSyncError);
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (selectedWorkloadId && !workloads.some((workload) => workload.id === selectedWorkloadId)) {
      setSelectedWorkloadId(null);
    }
  }, [selectedWorkloadId, workloads]);

  function handleSubmitted(workload: Workload) {
    setWorkloads((prev) => [workload, ...prev.filter((item) => item.id !== workload.id)]);
    setSelectedWorkloadId(workload.id);
  }

  function handleSelect(workload: Workload) {
    setSelectedWorkloadId(workload.id);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Page header */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-white/40 hover:text-white text-sm transition-colors">
            ← ForgeGrid
          </Link>
          <span className="text-white/15">/</span>
          <span className="text-sm font-medium text-white">Dashboard</span>
        </div>
        <LiveStatus state={liveState} message={liveMessage} />
      </header>

      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Health banner */}
        <div className="mb-8">
          <HealthBanner />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column — form + list */}
          <div className="lg:col-span-1 space-y-8">
            {/* Workload form */}
            <section>
              <SectionHeader title="Submit Workload" />
              <div className="rounded-xl border border-white/8 bg-white/3 p-5">
                <WorkloadForm onSubmitted={handleSubmitted} />
              </div>
            </section>

            {/* Recent workloads */}
            <section>
              <SectionHeader title="Recent Workloads" />
              {listError ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
                  {listError}
                </div>
              ) : (
                <WorkloadList
                  workloads={workloads}
                  loading={loadingList}
                  selectedId={selectedWorkloadId}
                  onSelect={handleSelect}
                />
              )}
            </section>
          </div>

          {/* Right column — detail pane */}
          <div className="lg:col-span-2">
            <SectionHeader title="Workload Details" />
            <WorkloadDetail
              workload={selectedWorkload}
              liveState={liveState}
              liveMessage={liveMessage}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-3">
      {title}
    </h2>
  );
}

function LiveStatus({ state, message }: { state: LiveConnectionState; message: string | null }) {
  const dotClass =
    state === "connected"
      ? "bg-emerald-400"
      : state === "reconnecting"
        ? "bg-amber-400 animate-pulse"
        : "bg-white/30 animate-pulse";

  const label =
    state === "connected"
      ? "Live updates active"
      : state === "reconnecting"
        ? "Reconnecting live feed"
        : "Connecting live feed";

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-2 text-white/45">
        <span className={`h-2 w-2 rounded-full ${dotClass}`} />
        <span>{label}</span>
      </div>
      {message && <span className="text-amber-300">{message}</span>}
    </div>
  );
}
