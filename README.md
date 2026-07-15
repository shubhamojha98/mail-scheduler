# Email Scheduler — Dashboard UI

Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui-style components.
This is the **UI layer only** — no backend calls yet. The queue lives in React state
(seeded with sample data in `lib/mock-data.ts`) so you can see the full flow before
wiring up Upstash QStash / Resend / Neon.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

### PDF attachment uploads (Vercel Blob)

The "Attach PDF" button in Compose uploads to `app/api/upload/route.ts`, which
stores the file in Vercel Blob and returns a URL. That URL is what you'd save
in your Neon `emails` table (e.g. an `attachment_url` column) — the file
itself never touches Postgres.

To run this locally:

1. Push this project to a Git repo and import it on vercel.com (or run `vercel link`).
2. In the Vercel dashboard: Storage → Create Database → Blob. Connect it to this project.
3. Pull the auto-generated env var: `vercel env pull .env.local`
   (this writes `BLOB_READ_WRITE_TOKEN` locally — see `.env.example`).
4. `npm run dev` — uploads now work locally too.

Once deployed on Vercel, the token is injected automatically; no manual setup needed in production.

**Current limits enforced server-side:** PDF only, 10 MB max per file. Adjust
`ALLOWED_TYPES` / `MAX_SIZE_BYTES` in `app/api/upload/route.ts` if needed.

## Structure

```
app/
  layout.tsx          Root layout, loads global styles
  page.tsx             Renders the dashboard
  globals.css          Tailwind + shadcn CSS variable theme

components/
  email-scheduler/
    dashboard.tsx       Holds queue state, composes the two panels
    compose-panel.tsx   Form: to/subject/body/attachment/date/time
    queue-panel.tsx     Wraps the timeline + list
    timeline-rail.tsx   24h horizontal timeline of scheduled sends
    queue-item.tsx      Single row in the queue list
  ui/                   shadcn-style primitives (button, input, textarea,
                        label, card, badge) — plain files, not pulled via
                        the shadcn CLI, so they drop straight into a project
                        that doesn't have shadcn initialized yet.

lib/
  types.ts              QueuedEmail / ComposeFormState types
  mock-data.ts           Seed data for the queue
  utils.ts               cn() class-merge helper
```

## Design tokens

- Accent (scheduled): `#2D5F4C` deep pine green
- Accent (draft): `#B8860B` muted amber
- Background: `#FAFAF8` soft paper white
- Display font: Sora · Body: Inter · Timestamps/data: JetBrains Mono

These live as Tailwind theme extensions in `tailwind.config.ts` and as HSL
CSS variables in `app/globals.css` (the shadcn convention), so if you run
`npx shadcn-ui@latest init` later it'll merge cleanly instead of conflicting.

## Next steps (when you're ready to go past UI-only)

1. ~~Attachments: upload to Vercel Blob~~ — done, see `app/api/upload/route.ts`.
2. Swap the in-memory `useState` queue in `dashboard.tsx` for data fetched
   from your Neon Postgres database (save `attachmentUrl` alongside each row).
3. On "Schedule send", call a Next.js Route Handler that enqueues a job in
   Upstash QStash for the chosen date/time.
4. QStash's webhook calls back into a Route Handler that sends via Resend,
   fetching the PDF from its Blob URL to attach it to the outgoing email.

## Fonts

`Sora` and `JetBrains Mono` aren't loaded yet — add them via `next/font/google`
in `app/layout.tsx` when you want the exact look:

```tsx
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
```
