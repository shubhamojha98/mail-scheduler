export type EmailStatus = "scheduled" | "draft" | "sent" | "failed";

export interface QueuedEmail {
  id: string;
  to: string;
  subject: string;
  when: string;
  status: EmailStatus;
  hour: number | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
    errorMessage?: string | null;

}

export interface ComposeFormState {
  to: string;
  subject: string;
  body: string;
  date: string;
  time: string;
  attachment: string | null;
}
