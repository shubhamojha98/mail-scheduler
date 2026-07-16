import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { qstash } from "@/lib/qstash";
import { FROM_ADDRESS } from "@/lib/mailer";

interface ScheduleRequestBody {
  to: string;
  subject: string;
  body: string;
  scheduledAt?: string; // ISO timestamp — optional when isDraft is true
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  isDraft?: boolean;
}

export async function POST(request: NextRequest) {
  const payload: ScheduleRequestBody = await request.json();
  const { to, subject, body, scheduledAt, attachmentUrl, attachmentName, isDraft } = payload;

  if (!to || !subject) {
    return NextResponse.json(
      { error: "'to' and 'subject' are required" },
      { status: 400 }
    );
  }

  if (!isDraft && !scheduledAt) {
    return NextResponse.json(
      { error: "'scheduledAt' is required to schedule a send" },
      { status: 400 }
    );
  }

  const sendAt = scheduledAt ? new Date(scheduledAt) : null;
  if (sendAt && isNaN(sendAt.getTime())) {
    return NextResponse.json({ error: "Invalid scheduledAt" }, { status: 400 });
  }

  try {
    const status = isDraft ? "draft" : "scheduled";

    // 1. Insert the row first so we have an id to pass to QStash.
    const [row] = await sql`
      INSERT INTO emails (
        to_email, from_email, subject, body,
        scheduled_at, status, attachment_url, attachment_name,
        created_at, updated_at
      ) VALUES (
        ${to}, ${FROM_ADDRESS}, ${subject}, ${body ?? ""},
        ${sendAt ? sendAt.toISOString() : null}, ${status},
        ${attachmentUrl ?? null}, ${attachmentName ?? null},
        now(), now()
      )
      RETURNING id, to_email, subject, scheduled_at, status, attachment_url, attachment_name
    `;

    // 2. Drafts don't get scheduled with QStash — only real sends do.
    if (isDraft) {
      return NextResponse.json({ email: row });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      throw new Error("NEXT_PUBLIC_APP_URL is not set");
    }

    // notBefore takes a Unix timestamp (seconds) — QStash won't deliver
    // the webhook before this time, even if it's picked up sooner.
    const msg = await qstash.publishJSON({
      url: `${appUrl}/api/send-email`,
      body: { emailId: row.id },
      notBefore: Math.floor((sendAt as Date).getTime() / 1000),
    });

    // 3. Save the QStash message id so we can trace/debug or cancel later
    //    (e.g. via qstash.messages.delete(msg.messageId)).
    await sql`
      UPDATE emails SET qstash_msg_id = ${msg.messageId}, updated_at = now()
      WHERE id = ${row.id}
    `;

    return NextResponse.json({ email: { ...row, qstash_msg_id: msg.messageId } });
  } catch (err) {
    console.error("Schedule failed:", err);
    return NextResponse.json(
      { error: "Failed to schedule email. Please try again." },
      { status: 500 }
    );
  }
}