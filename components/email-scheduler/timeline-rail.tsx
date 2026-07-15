"use client";

import { QueuedEmail } from "@/lib/types";

const HOUR_MARKERS = [0, 4, 8, 12, 16, 20, 24];

export function TimelineRail({ queue }: { queue: QueuedEmail[] }) {
  const scheduled = queue.filter((q) => q.status === "scheduled" && q.hour !== null);

  return (
    <div className="px-5 pt-5 pb-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          Send queue — next 24h
        </span>
        <span className="text-[11px] font-mono text-muted-foreground/70">
          {scheduled.length} queued
        </span>
      </div>

      <div className="relative h-12">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />

        {HOUR_MARKERS.map((h) => (
          <div
            key={h}
            className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            <div className="w-px h-2 bg-border" />
          </div>
        ))}

        {HOUR_MARKERS.map((h) => (
          <span
            key={`label-${h}`}
            className="absolute top-full mt-1 text-[10px] font-mono text-muted-foreground/70 -translate-x-1/2"
            style={{ left: `${(h / 24) * 100}%` }}
          >
            {h === 24 ? "24" : String(h).padStart(2, "0")}
          </span>
        ))}

        {scheduled.map((item) => (
          <div
            key={item.id}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 group cursor-default"
            style={{ left: `${((item.hour as number) / 24) * 100}%` }}
          >
            <div className="w-3 h-3 rounded-full bg-scheduled border-2 border-white shadow-sm ring-1 ring-scheduled/20" />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 hidden group-hover:block bg-foreground text-background text-[11px] rounded-md px-2 py-1 whitespace-nowrap z-10">
              {item.subject}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
