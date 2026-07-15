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
    };
  }

  const d = row.scheduled_at ? new Date(row.scheduled_at) : null;
  let when = row.status === "sent" ? "Sent" : row.status === "failed" ? "Failed" : "—";
  let hour: number | null = null;

  if (d && !isNaN(d.getTime())) {
    const isToday = d.toDateString() === new Date().toDateString();
    const hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    const ampm = hh >= 12 ? "PM" : "AM";
    const dateLabel = isToday
      ? "Today"
      : d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    when = `${dateLabel}, ${h12}:${mm} ${ampm}`;
    hour = hh + d.getMinutes() / 60;
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
  };
}