import { listSyncedWorkloads } from "@/lib/workload-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();
const POLL_INTERVAL_MS = 3000;
const HEARTBEAT_INTERVAL_MS = 15000;

function createEvent(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function createHeartbeat() {
  return encoder.encode(": keep-alive\n\n");
}

export async function GET(request: Request) {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let lastSnapshot = "";
      let pollTimer: ReturnType<typeof setTimeout> | null = null;
      let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        if (closed) {
          return;
        }

        closed = true;
        if (pollTimer) {
          clearTimeout(pollTimer);
        }
        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }
        request.signal.removeEventListener("abort", cleanup);
      };

      const sendSnapshot = async () => {
        if (closed) {
          return;
        }

        try {
          const workloads = await listSyncedWorkloads();
          const snapshot = JSON.stringify(workloads);

          if (!closed && snapshot !== lastSnapshot) {
            controller.enqueue(createEvent("workloads", workloads));
            lastSnapshot = snapshot;
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Failed to sync workloads";

          if (!closed) {
            controller.enqueue(createEvent("sync-error", { message }));
          }
        }

        if (!closed) {
          pollTimer = setTimeout(() => {
            void sendSnapshot();
          }, POLL_INTERVAL_MS);
        }
      };

      request.signal.addEventListener("abort", cleanup);

      controller.enqueue(encoder.encode(`retry: ${POLL_INTERVAL_MS}\n\n`));
      void sendSnapshot();

      heartbeatTimer = setInterval(() => {
        if (!closed) {
          controller.enqueue(createHeartbeat());
        }
      }, HEARTBEAT_INTERVAL_MS);
    },
    cancel() {
      request.signal.dispatchEvent(new Event("abort"));
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}