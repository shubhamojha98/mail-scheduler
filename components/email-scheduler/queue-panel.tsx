"use client";

import { Send } from "lucide-react";
import { QueuedEmail } from "@/lib/types";
import { TimelineRail } from "@/components/email-scheduler/timeline-rail";
import { QueueItem } from "@/components/email-scheduler/queue-item";

export function QueuePanel({
  queue,
  onDelete,
  deletingId,
}: {
  queue: QueuedEmail[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
}) {
  return (
    <div className="flex flex-col">
      <TimelineRail queue={queue} />

      <div className="px-5 py-3 flex items-center justify-between border-b border-border bg-muted/30">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          All items
        </span>
        <span className="text-[11px] font-mono text-muted-foreground/70">{queue.length}</span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[420px]">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 px-6 text-center">
            <Send size={20} className="text-border mb-2" />
            <p className="text-[13px] text-muted-foreground">Nothing queued yet</p>
            <p className="text-[12px] text-muted-foreground/70 mt-0.5">
              Compose an email and schedule it to see it here.
            </p>
          </div>
        ) : (
          queue.map((item) => (
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