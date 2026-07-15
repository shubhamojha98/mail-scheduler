import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { qstash } from "@/lib/qstash";
import { FROM_EMAIL } from "@/lib/resend";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    to,
    subject,
    body: emailBody,
    scheduledAt, // ISO string, e.g. "2026-07-16T18:30:00.000Z"
    attachmentUrl,
    attachmentName,
    isDraft,
  } = body;

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

  try {
    // 1. Insert the row first so we have an id to pass to QStash.
    const status = isDraft ? "draft" : "scheduled";

    const [row] = await sql`
      INSERT INTO emails (to_email, from_email, subject, body, scheduled_at, status, attachment_url, attachment_name)
      VALUES (${to}, ${FROM_EMAIL}, ${subject}, ${emailBody ?? ""}, ${isDraft ? null : scheduledAt}, ${status}, ${attachmentUrl ?? null}, ${attachmentName ?? null})
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

    const msg = await qstash.publishJSON({
      url: `${appUrl}/api/send-email`,
      body: { emailId: row.id },
      notBefore: Math.floor(new Date(scheduledAt).getTime() / 1000),
    });

    // 3. Save the QStash message id back so we can trace/debug later.
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