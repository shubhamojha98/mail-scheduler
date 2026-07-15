"use client";

import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { QueuedEmail } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export function QueueItem({
  item,
  onDelete,
  isDeleting,
}: {
  item: QueuedEmail;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}) {
  return (
    <div
      className={`group flex flex-col gap-1.5 px-5 py-3 border-b border-border/60 hover:bg-muted/40 transition-colors ${
        isDeleting ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
            item.status === "scheduled"
              ? "bg-scheduled"
              : item.status === "sent"
              ? "bg-scheduled"
              : item.status === "failed"
              ? "bg-destructive"
              : "bg-draft"
          }`}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium truncate">{item.subject}</p>
          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{item.to}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={item.status}>{item.when}</Badge>
          <button
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="opacity-0 group-hover:opacity-100 disabled:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
            aria-label="Remove"
          >
            {isDeleting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Trash2 size={13} />
            )}
          </button>
        </div>
      </div>

      {item.status === "failed" && item.errorMessage && (
        <div className="flex items-start gap-1.5 ml-4 pl-3.5 border-l-2 border-destructive/30">
          <AlertCircle size={11} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-[11px] text-destructive/90 leading-snug">{item.errorMessage}</p>
        </div>
      )}
    </div>
  );
}