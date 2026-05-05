import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 border-b border-white/5">
        <span className="text-lg font-semibold tracking-tight text-white">ForgeGrid</span>
        <Link
          href="/dashboard"
          className="text-sm text-white/60 hover:text-white transition-colors"
        >
          Dashboard →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24 gap-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium mb-2">
          Founder Demo
        </div>

        <h1 className="text-6xl sm:text-7xl font-bold tracking-tight bg-gradient-to-br from-white via-white/90 to-white/50 bg-clip-text text-transparent max-w-3xl leading-none">
          ForgeGrid
        </h1>

        <p className="text-lg sm:text-xl text-white/60 max-w-2xl leading-relaxed">
          Submit AI workloads in minutes, persist every state change in InsForge, and let Jungle Grid handle the heavy compute.
        </p>

        {/* Role explanation */}
        <div className="flex flex-col sm:flex-row gap-4 mt-2">
          <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 px-5 py-4 text-left max-w-xs">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">InsForge</p>
              <p className="text-xs text-white/50 mt-1">Stores backend records, submission metadata, and every workload status transition</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/3 px-5 py-4 text-left max-w-xs">
            <div className="mt-0.5 h-2 w-2 rounded-full bg-violet-400 shrink-0" />
            <div>
              <p className="text-sm font-medium text-white">Jungle Grid</p>
              <p className="text-xs text-white/50 mt-1">Executes submitted AI workloads on remote GPU infrastructure — no compute inside the web app</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <Link
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-sm font-semibold text-white transition-colors shadow-lg shadow-indigo-500/20"
        >
          Launch Demo
          <span aria-hidden>→</span>
        </Link>
      </section>

      {/* Architecture strip */}
      <section className="border-t border-white/5 px-6 py-10">
        <p className="text-center text-xs text-white/30 uppercase tracking-widest mb-6 font-medium">
          Architecture
        </p>
        <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 text-sm">
          {[
            { label: "User", color: "text-white/70" },
            null,
            { label: "InsForge", color: "text-emerald-400" },
            null,
            { label: "Jungle Grid", color: "text-violet-400" },
            null,
            { label: "InsForge", color: "text-emerald-400" },
            null,
            { label: "Dashboard", color: "text-white/70" },
          ].map((item, i) =>
            item === null ? (
              <span key={i} className="text-white/20 text-base">→</span>
            ) : (
              <span
                key={i}
                className={`font-medium px-3 py-1.5 rounded-lg border border-white/10 bg-white/3 ${item.color}`}
              >
                {item.label}
              </span>
            )
          )}
        </div>
        <p className="text-center text-xs text-white/25 mt-4 max-w-lg mx-auto leading-relaxed">
          Workload submitted → InsForge records state → Jungle Grid executes remotely → InsForge persists result → Dashboard shows live status
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-5 text-center">
        <p className="text-xs text-white/20">ForgeGrid · InsForge + Jungle Grid demo</p>
      </footer>
    </main>
  );
}
