import { QueuedEmail } from "@/lib/types";

export function formatEmailRow(row: any): QueuedEmail {
  if (row.status === "draft") {
    return {
      id: row.id,
      to: row.to_email,
      subject: row.subject,
      when: "Draft",
      status: "draft",
      hour: null,
      attachmentUrl: row.attachment_url,
      attachmentName: row.attachment_name,
      errorMessage: null,
    };
  }

  let when = "—";
  let hour: number | null = null;

  if (row.status === "sent") {
    const sentD = row.sent_at ? new Date(row.sent_at) : null;
    when = sentD && !isNaN(sentD.getTime())
      ? `Sent · ${formatTime(sentD)}`
      : "Sent";
  } else if (row.status === "failed") {
    when = "Failed";
  } else if (row.status === "scheduled" && row.scheduled_at) {
    const d = new Date(row.scheduled_at);
    if (!isNaN(d.getTime())) {
      when = formatTime(d);
      hour = d.getHours() + d.getMinutes() / 60;
    }
  }

  return {
    id: row.id,
    to: row.to_email,
    subject: row.subject,
    when,
    status: row.status,
    hour,
    attachmentUrl: row.attachment_url,
    attachmentName: row.attachment_name,
    errorMessage: row.error_message ?? null,
  };
}

function formatTime(d: Date): string {
  const isToday = d.toDateString() === new Date().toDateString();
  const hh = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, "0");
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  const ampm = hh >= 12 ? "PM" : "AM";
  const dateLabel = isToday
    ? "Today"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateLabel}, ${h12}:${mm} ${ampm}`;
}