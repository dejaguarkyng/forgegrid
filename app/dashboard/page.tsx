"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Workload } from "@/lib/insforge";
import HealthBanner from "@/components/dashboard/health-banner";
import WorkloadForm from "@/components/dashboard/workload-form";
import WorkloadList from "@/components/dashboard/workload-list";
import WorkloadDetail from "@/components/dashboard/workload-detail";

export default function DashboardPage() {
  const [workloads, setWorkloads] = useState<Workload[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedWorkload, setSelectedWorkload] = useState<Workload | null>(null);

  const fetchWorkloads = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const res = await fetch("/api/workloads");
      const data = await res.json();
      if (!res.ok) {
        setListError(data.error ?? "Failed to load workloads");
        return;
      }
      setWorkloads(data as Workload[]);
    } catch {
      setListError("Network error — could not load workloads");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkloads();
  }, [fetchWorkloads]);

  function handleSubmitted(workload: Workload) {
    setWorkloads((prev) => [workload, ...prev]);
    setSelectedWorkload(workload);
  }

  function handleSelect(workload: Workload) {
    setSelectedWorkload(workload);
  }

  function handleRefreshed(updated: Workload) {
    setWorkloads((prev) =>
      prev.map((w) => (w.id === updated.id ? updated : w))
    );
    setSelectedWorkload(updated);
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
        <button
          onClick={fetchWorkloads}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Reload list
        </button>
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
                  selectedId={selectedWorkload?.id ?? null}
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
              onRefreshed={handleRefreshed}
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
