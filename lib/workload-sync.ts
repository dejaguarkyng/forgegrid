import {
  getWorkload,
  listWorkloads,
  updateWorkload,
  type UpdateWorkloadData,
  type Workload,
  type WorkloadStatus,
} from "@/lib/insforge";
import { getJungleGridJobLogs, getJungleGridJobStatus } from "@/lib/junglegrid";

const LIVE_WORKLOAD_STATUSES: WorkloadStatus[] = ["submitting", "queued", "running"];
const TERMINAL_WORKLOAD_STATUSES: WorkloadStatus[] = ["completed", "failed"];

function normalizeOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function isLiveWorkload(workload: Workload) {
  if (!workload.jungle_grid_job_id) return false;
  // Actively running — always sync
  if (LIVE_WORKLOAD_STATUSES.includes(workload.status)) return true;
  // Terminal but logs/output not yet captured — keep syncing until they arrive
  if (TERMINAL_WORKLOAD_STATUSES.includes(workload.status) && !workload.logs && !workload.output) {
    return true;
  }
  return false;
}

async function buildWorkloadUpdate(workload: Workload): Promise<UpdateWorkloadData | null> {
  if (!workload.jungle_grid_job_id) {
    return null;
  }

  let nextStatus = workload.status;
  let nextLogs = workload.logs;
  let nextOutput = workload.output;
  let nextErrorMessage = workload.error_message;

  const jobState = await getJungleGridJobStatus(workload.jungle_grid_job_id);
  const validStatuses: WorkloadStatus[] = ["queued", "running", "completed", "failed"];
  const preTerminalStatuses: WorkloadStatus[] = ["submitting", "queued"];
  const terminalStatuses: WorkloadStatus[] = ["completed", "failed"];

  if (validStatuses.includes(jobState.status)) {
    // If the workload skipped "running" entirely (fast job), force it through
    // the running state first so the UI always shows it.
    if (
      preTerminalStatuses.includes(workload.status) &&
      terminalStatuses.includes(jobState.status)
    ) {
      nextStatus = "running";
    } else {
      nextStatus = jobState.status;
    }
  }

  if (nextStatus === "running" || nextStatus === "completed" || nextStatus === "failed") {
    try {
      const jobLogs = await getJungleGridJobLogs(workload.jungle_grid_job_id);
      nextLogs = normalizeOptionalText(jobLogs.logs);
      nextOutput = normalizeOptionalText(jobLogs.output);
    } catch {
      // Log delivery can lag behind status updates. Keep the previous snapshot when that happens.
    }
  }

  if (nextStatus === "failed" && !nextErrorMessage) {
    nextErrorMessage = "Job failed on Jungle Grid. Check logs for details.";
  }

  const updates: UpdateWorkloadData = {};

  if (nextStatus !== workload.status) {
    updates.status = nextStatus;
  }
  if (nextLogs !== workload.logs) {
    updates.logs = nextLogs;
  }
  if (nextOutput !== workload.output) {
    updates.output = nextOutput;
  }
  if (nextErrorMessage !== workload.error_message) {
    updates.error_message = nextErrorMessage;
  }

  return Object.keys(updates).length > 0 ? updates : null;
}

export async function syncWorkload(workload: Workload) {
  const updates = await buildWorkloadUpdate(workload);

  if (!updates) {
    return workload;
  }

  return updateWorkload(workload.id, updates);
}

export async function syncWorkloadById(id: string) {
  const workload = await getWorkload(id);

  if (!workload) {
    return null;
  }

  if (!isLiveWorkload(workload)) {
    return workload;
  }

  return syncWorkload(workload);
}

export async function listSyncedWorkloads() {
  const workloads = await listWorkloads();

  return Promise.all(
    workloads.map(async (workload) => {
      if (!isLiveWorkload(workload)) {
        return workload;
      }

      try {
        return await syncWorkload(workload);
      } catch {
        return workload;
      }
    })
  );
}