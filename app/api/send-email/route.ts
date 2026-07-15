import { NextRequest, NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { sql } from "@/lib/db";
import { resend, FROM_EMAIL } from "@/lib/resend";

async function handler(request: NextRequest) {
  const { emailId } = await request.json();

  if (!emailId) {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  const [row] = await sql`SELECT * FROM emails WHERE id = ${emailId}`;

  if (!row) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: row.to_email,
      subject: row.subject,
      text: row.body ?? "",
      attachments: row.attachment_url
        ? [{ path: row.attachment_url, filename: row.attachment_name ?? "attachment" }]
        : undefined,
    });

    if (error) throw new Error(error.message);

    await sql`
      UPDATE emails
      SET status = 'sent', sent_at = now(), updated_at = now(), error_message = NULL
      WHERE id = ${emailId}
    `;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Send failed:", err);
    await sql`
      UPDATE emails
      SET status = 'failed', error_message = ${err instanceof Error ? err.message : "Unknown error"}, updated_at = now()
      WHERE id = ${emailId}
    `;
    // Return 500 so QStash retries per its retry policy.
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}

// Verifies the request really came from QStash using your signing keys.
export const POST = verifySignatureAppRouter(handler);