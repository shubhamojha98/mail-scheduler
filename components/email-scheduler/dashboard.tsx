
"use client";

import { useEffect, useState, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { ComposePanel } from "@/components/email-scheduler/compose-panel";
import { QueuePanel } from "@/components/email-scheduler/queue-panel";
import { QueuedEmail } from "@/lib/types";
import { formatEmailRow } from "@/lib/format-email";

const POLL_INTERVAL_MS = 50000;

export function EmailSchedulerDashboard() {
  const [queue, setQueue] = useState<QueuedEmail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Tracks whether a fetch is already in flight, so overlapping polls
  // (e.g. slow network + short interval) don't stack up.
  const isFetchingRef = useRef(false);

  useEffect(() => {
    loadEmails(true);

    const interval = setInterval(() => {
      loadEmails(false);
    }, POLL_INTERVAL_MS);

    // Also refetch immediately when the tab regains focus/visibility —
    // catches the case where a scheduled send fired while the tab was
    // backgrounded and the user just switched back to it.
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        loadEmails(false);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  async function loadEmails(isInitial: boolean) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (isInitial) setIsLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/emails");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load emails");
      setQueue(data.emails.map(formatEmailRow));
    } catch (err) {
      if (isInitial) {
        setLoadError(err instanceof Error ? err.message : "Failed to load emails");
      }
    } finally {
      if (isInitial) setIsLoading(false);
      isFetchingRef.current = false;
    }
  }

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  function handleSchedule(item: QueuedEmail) {
    setQueue((q) => [item, ...q]);
    showToast("Email scheduled");
  }

  function handleDraft(item: QueuedEmail) {
    setQueue((q) => [item, ...q]);
    showToast("Saved as draft");
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/emails/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete");
      setQueue((q) => q.filter((i) => i.id !== id));
      showToast("Deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <ComposePanel onSchedule={handleSchedule} onDraft={handleDraft} />
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-[13px] gap-2">
            <Loader2 size={14} className="animate-spin" />
            Loading queue…
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[13px] text-destructive">
            {loadError}
            <button onClick={() => loadEmails(true)} className="underline text-muted-foreground">
              Retry
            </button>
          </div>
        ) : (
          <QueuePanel queue={queue} onDelete={handleDelete} deletingId={deletingId} />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-foreground text-background text-[13px] px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
          <Send size={13} className="text-scheduled" />
          {toast}
        </div>
      )}
    </div>
  );
}