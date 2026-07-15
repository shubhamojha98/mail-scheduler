"use client";

import { useMemo, useState } from "react";
import { Paperclip, Clock, X, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QueuedEmail } from "@/lib/types";

interface ComposePanelProps {
  onSchedule: (item: QueuedEmail) => void;
  onDraft: (item: QueuedEmail) => void;
}

export function ComposePanel({ onSchedule, onDraft }: ComposePanelProps) {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Separate from isUploading — this is the "talking to /api/schedule" state.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canSchedule = Boolean(
    to.trim() && subject.trim() && date && time && !isUploading && !isSubmitting
  );

  const whenLabel = useMemo(() => {
    if (!date || !time) return null;
    const d = new Date(`${date}T${time}`);
    if (isNaN(d.getTime())) return null;
    const isToday = d.toDateString() === new Date().toDateString();
    const hh = d.getHours();
    const mm = String(d.getMinutes()).padStart(2, "0");
    const h12 = hh % 12 === 0 ? 12 : hh % 12;
    const ampm = hh >= 12 ? "PM" : "AM";
    const label = `${
      isToday ? "Today" : d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    }, ${h12}:${mm} ${ampm}`;
    return { label, hour: hh + d.getMinutes() / 60, iso: d.toISOString() };
  }, [date, time]);

  function resetForm() {
    setTo("");
    setSubject("");
    setBody("");
    setDate("");
    setTime("");
    setAttachmentName(null);
    setAttachmentUrl(null);
    setUploadError(null);
    setSubmitError(null);
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setAttachmentName(file.name);
    setAttachmentUrl(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setAttachmentUrl(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setAttachmentName(null);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  }

  function handleRemoveAttachment() {
    setAttachmentName(null);
    setAttachmentUrl(null);
    setUploadError(null);
  }

  async function handleSchedule() {
    if (!canSchedule || !whenLabel) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim(),
          subject: subject.trim(),
          body,
          scheduledAt: whenLabel.iso,
          attachmentUrl,
          attachmentName,
          isDraft: false,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule email");
      }

      onSchedule({
        id: data.email.id,
        to: data.email.to_email,
        subject: data.email.subject,
        when: whenLabel.label,
        status: "scheduled",
        hour: whenLabel.hour,
        attachmentUrl: data.email.attachment_url,
        attachmentName: data.email.attachment_name,
      });
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to schedule email");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDraft() {
    if (!subject.trim() && !to.trim()) return;
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to.trim() || "—",
          subject: subject.trim() || "Untitled draft",
          body,
          attachmentUrl,
          attachmentName,
          isDraft: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save draft");
      }

      onDraft({
        id: data.email.id,
        to: data.email.to_email,
        subject: data.email.subject,
        when: "Draft",
        status: "draft",
        hour: null,
        attachmentUrl: data.email.attachment_url,
        attachmentName: data.email.attachment_name,
      });
      resetForm();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save draft");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="border-b lg:border-b-0 lg:border-r border-border flex flex-col">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <h1 className="font-display text-[17px] font-semibold tracking-tight">Compose</h1>
        <span className="text-[11px] font-mono text-muted-foreground/70 uppercase tracking-wide">
          Draft
        </span>
      </div>

      <div className="px-6 py-5 flex flex-col gap-4 flex-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input
            id="to"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="recipient@example.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="What's this about?"
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message…"
            rows={7}
            className="flex-1"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <label
              className={`flex items-center gap-1.5 text-[12px] border border-dashed rounded-md px-3 py-1.5 cursor-pointer transition-colors ${
                uploadError
                  ? "border-destructive/50 text-destructive"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              {isUploading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Paperclip size={13} />
              )}
              {isUploading ? "Uploading…" : attachmentName ?? "Attach file"}
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
                className="hidden"
                disabled={isUploading}
                onChange={handleFileSelect}
              />
            </label>
            {attachmentName && !isUploading && (
              <button
                onClick={handleRemoveAttachment}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove attachment"
              >
                <X size={13} />
              </button>
            )}
          </div>
          {uploadError && (
            <p className="flex items-center gap-1 text-[11px] text-destructive">
              <AlertCircle size={11} />
              {uploadError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="time">Time</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        {submitError && (
          <p className="flex items-center gap-1 text-[11px] text-destructive">
            <AlertCircle size={11} />
            {submitError}
          </p>
        )}
      </div>

      <div className="px-6 py-4 border-t border-border flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDraft}
          disabled={isSubmitting}
          className="px-0 hover:bg-transparent"
        >
          {isSubmitting ? "Saving…" : "Save draft"}
        </Button>
        <Button onClick={handleSchedule} disabled={!canSchedule}>
          {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Clock size={14} />}
          {isSubmitting ? "Scheduling…" : "Schedule send"}
        </Button>
      </div>
    </div>
  );
}