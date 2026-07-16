# 📬 Email Scheduler

A full-stack email scheduling platform — compose, attach a PDF, pick a send time, and let the system deliver it automatically. Built entirely on free-tier infrastructure with no compromises on architecture.

**🔗 Live demo:** [mail-scheduler-delta.vercel.app](https://mail-scheduler-delta.vercel.app/)

---

## Overview

Most "schedule send" features quietly rely on a server that stays awake and polls a database. This project instead uses a proper message-queue pattern — the scheduling logic doesn't run anywhere continuously; it's event-driven end to end, which is also why the entire stack fits inside free tiers.

**The flow:**

1. Compose an email and attach a PDF in the dashboard.
2. The PDF uploads to **Vercel Blob**; the email + attachment reference is saved to **Neon Postgres**.
3. **Upstash QStash** is scheduled to call a webhook at the exact send time — no cron job, no server polling a queue.
4. When that time arrives, QStash calls the app back, which sends the email (with the attachment) via **Resend** and updates the record's status.

---

## Tech Stack

| Layer            | Technology                              |
|-------------------|------------------------------------------|
| Framework          | Next.js 14 (App Router) + TypeScript      |
| Styling            | Tailwind CSS, shadcn-style local components |
| Database           | Neon (serverless Postgres)                |
| File storage        | Vercel Blob                              |
| Job scheduling      | Upstash QStash                          |
| Email delivery      | Resend                                  |
| Hosting            | Vercel                                  |

---

## Features

- **Compose & schedule** — pick any future date/time; no minimum lead time
- **PDF attachments** — validated server-side (type + 10MB size limit), stored in Vercel Blob, streamed back in at send time
- **Live send-queue timeline** — a 24-hour visual rail showing everything queued to go out, positioned by time of day
- **Draft support** — save incomplete emails without scheduling them
- **Status tracking** — every email row moves through `scheduled → sent` or `scheduled → failed`, with the error message captured if delivery fails
- **Idempotent delivery** — if QStash retries a webhook call, the app checks status first and won't double-send

---

## Architecture Decisions

**Why QStash instead of a cron job?**
A cron-based approach means checking "is anything due?" on a timer, which wastes a run for every empty check and adds delivery lag equal to your polling interval. QStash instead schedules a single webhook call precisely at send time — the app does nothing until that exact moment, which is both faster and free of idle compute.

**Why store only a URL for attachments, not the file itself?**
Storing PDF bytes directly in Postgres bloats table size, slows backups, and costs more per GB than dedicated object storage. The `emails` table holds only an `attachment_url` reference; the file itself lives in Vercel Blob and is fetched only once, at send time.

**Why local shadcn-style components instead of the shadcn CLI?**
Owning the component files directly (`components/ui/*.tsx`) means no CLI dependency and no fighting the CLI's opinions on project structure — while still following the same `cva` + `cn()` conventions, so it drops into a shadcn-init'd project cleanly later if needed.

---

## Data Model

A single `emails` table tracks each message through its lifecycle: `scheduled → sent` or `scheduled → failed`. Key fields:

- **Identity & content** — `to_email`, `from_email`, `subject`, `body`
- **Attachment reference** — `attachment_url` / `attachment_name` (the file itself lives in Vercel Blob, not the database)
- **Scheduling** — `scheduled_at`, `sent_at`, `qstash_msg_id` (links back to the queued QStash job)
- **State** — `status`, `error_message` (populated if delivery fails)

---

## Project Structure

```
app/
  api/
    schedule/route.ts     Inserts email row + queues QStash job
    send-email/route.ts   QStash webhook target — sends via Resend, updates status
    upload/route.ts       Uploads PDF attachments to Vercel Blob
  layout.tsx
  page.tsx

components/
  email-scheduler/        Feature components (compose panel, queue panel, timeline)
  ui/                      Local shadcn-style primitives (button, input, card, badge, ...)

lib/
  db.ts                    Neon Postgres client
  resend.ts                Resend client
  qstash.ts                QStash client (dev-mode aware)
  types.ts                 Shared TypeScript types
```

---

## Roadmap

- [ ] Cancel / reschedule a queued email (via `qstashClient.messages.delete`)
- [ ] Recipient list view with delivery history
- [ ] Rich text editor for the message body
- [ ] Verified sending domain (move off `onboarding@resend.dev`)

---

## Author

**Shubham Kumar Ojha**
Full Stack Developer · [GitHub](https://github.com/shubhamojha98) · [LinkedIn](https://linkedin.com/in/shubham-kumar-ojha)
