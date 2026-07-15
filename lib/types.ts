export type EmailStatus = "scheduled" | "draft" | "sent" | "failed";

export interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  /** Human-readable send time, e.g. "Today, 6:00 PM" or "Draft" */
  when: string;
  status: EmailStatus;
  /** Hour-of-day as a float (e.g. 18.5 for 6:30 PM), used to position on the timeline. Null for drafts. */
  hour: number | null;
  /** Vercel Blob URL for the attached PDF, if any. This is what gets saved in Neon. */
  attachmentUrl?: string | null;
  attachmentName?: string | null;
}

export interface ComposeFormState {
  to: string;
  subject: string;
  body: string;
  date: string;
  time: string;
  attachment: string | null;
}
