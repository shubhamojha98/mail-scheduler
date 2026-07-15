"use client";

import { useState } from "react";
import { Send, Inbox, History as HistoryIcon } from "lucide-react";
import { QueuedEmail } from "@/lib/types";
import { TimelineRail } from "@/components/email-scheduler/timeline-rail";
import { QueueItem } from "@/components/email-scheduler/queue-item";

type Tab = "queue" | "history";

export function QueuePanel({
  queue,
  onDelete,
  deletingId,
}: {
  queue: QueuedEmail[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("queue");

  const queueItems = queue.filter((i) => i.status === "scheduled" || i.status === "draft");
  const historyItems = queue.filter((i) => i.status === "sent" || i.status === "failed");

  const activeItems = tab === "queue" ? queueItems : historyItems;

  return (
    <div className="flex flex-col">
      <TimelineRail queue={queueItems} />

      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("queue")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] font-medium transition-colors ${
            tab === "queue"
              ? "text-foreground border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Inbox size={13} />
          Queue
          <span className="text-[10px] font-mono text-muted-foreground/70">
            {queueItems.length}
          </span>
        </button>
        <button
          onClick={() => setTab("history")}
          className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-[12px] font-medium transition-colors ${
            tab === "history"
              ? "text-foreground border-b-2 border-primary -mb-px"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <HistoryIcon size={13} />
          History
          <span className="text-[10px] font-mono text-muted-foreground/70">
            {historyItems.length}
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <Send size={20} className="text-border mb-2" />
            <p className="text-[13px] text-muted-foreground">
              {tab === "queue" ? "Nothing queued yet" : "No sent or failed emails yet"}
            </p>
            <p className="text-[12px] text-muted-foreground/70 mt-0.5">
              {tab === "queue"
                ? "Compose an email and schedule it to see it here."
                : "Emails will show up here once they're sent or fail."}
            </p>
          </div>
        ) : (
          activeItems.map((item) => (
            <QueueItem
              key={item.id}
              item={item}
              onDelete={onDelete}
              isDeleting={deletingId === item.id}
            />
          ))
        )}
      </div>
    </div>
  );
}