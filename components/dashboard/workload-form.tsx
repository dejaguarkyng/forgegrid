"use client";

import { useState } from "react";
import type { Workload } from "@/lib/insforge";

interface WorkloadFormProps {
  onSubmitted: (workload: Workload) => void;
}

const defaults = {
  name: "InsForge x Jungle Grid Product Team Demo",
  workload_type: "inference",
  model_size: "0.5b",
  image: "huggingface/transformers-pytorch-gpu:4.41.3",
  command:
    `sh -lc 'python3 -c "import os;from transformers import pipeline;t=os.environ.get(\\'PROMPT\\',\\'Explain in 5 sentences why InsForge and Jungle Grid make a strong demo stack for AI product teams.\\');g=pipeline(\\'text-generation\\',model=\\'Qwen/Qwen2.5-0.5B-Instruct\\',device=0);print(g(t,max_new_tokens=80,do_sample=False)[0][\\'generated_text\\'])"'`,
  optimize_for: "balanced",
  input_text:
    "Explain in 5 sentences why InsForge and Jungle Grid make a strong demo stack for AI product teams.",
};

export default function WorkloadForm({ onSubmitted }: WorkloadFormProps) {
  const [form, setForm] = useState(defaults);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/workloads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Submission failed");
        return;
      }

      onSubmitted(data as Workload);
      // Reset to defaults after success
      setForm(defaults);
    } catch {
      setError("Network error — could not reach the API");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Name" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            disabled={submitting}
            className={inputCls}
          />
        </Field>

        <Field label="Workload Type" required>
          <SelectWrapper>
            <select
              name="workload_type"
              value={form.workload_type}
              onChange={handleChange}
              disabled={submitting}
              className={selectCls}
            >
              <option value="inference">inference</option>
              <option value="training">training</option>
              <option value="fine-tuning">fine-tuning</option>
              <option value="embedding">embedding</option>
            </select>
            <Chevron />
          </SelectWrapper>
        </Field>

        <Field label="Model Size" required>
          <input
            name="model_size"
            value={form.model_size}
            onChange={handleChange}
            required
            disabled={submitting}
            className={inputCls}
            placeholder="8b"
          />
        </Field>

        <Field label="Optimize For" required>
          <SelectWrapper>
            <select
              name="optimize_for"
              value={form.optimize_for}
              onChange={handleChange}
              disabled={submitting}
              className={selectCls}
            >
              <option value="balanced">balanced</option>
              <option value="speed">speed</option>
              <option value="cost">cost</option>
            </select>
            <Chevron />
          </SelectWrapper>
        </Field>
      </div>

      <Field label="Image" required>
        <input
          name="image"
          value={form.image}
          onChange={handleChange}
          required
          disabled={submitting}
          className={inputCls}
          placeholder="pytorch/pytorch:2.4.0-cuda12.1-cudnn9-runtime"
        />
      </Field>

      <Field label="Command" required>
        <input
          name="command"
          value={form.command}
          onChange={handleChange}
          required
          disabled={submitting}
          className={inputCls}
          placeholder="python run.py"
        />
      </Field>

      <Field label="Input Text (optional)">
        <textarea
          name="input_text"
          value={form.input_text}
          onChange={handleChange}
          disabled={submitting}
          rows={3}
          className={`${inputCls} resize-none`}
          placeholder="Prompt or context for the workload…"
        />
      </Field>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed px-6 py-3 text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <span className="inline-block h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Submitting…
          </>
        ) : (
          "Submit Workload"
        )}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-white/50 uppercase tracking-wide">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const selectCls =
  "w-full appearance-none rounded-lg border border-white/10 bg-[#111118] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

function SelectWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
    </div>
  );
}

function Chevron() {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
        <path d="M2.5 4.5L6 8L9.5 4.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
