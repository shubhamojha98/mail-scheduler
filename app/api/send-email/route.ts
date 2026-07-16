// import { NextRequest, NextResponse } from "next/server";
// import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
// import { sql } from "@/lib/db";
// import { resend, FROM_EMAIL } from "@/lib/resend";

// async function handler(request: NextRequest) {
//   const { emailId } = await request.json();

//   if (!emailId) {
//     return NextResponse.json({ error: "emailId is required" }, { status: 400 });
//   }

//   const [row] = await sql`SELECT * FROM emails WHERE id = ${emailId}`;

//   if (!row) {
//     return NextResponse.json({ error: "Email not found" }, { status: 404 });
//   }

//   try {
//     const { error } = await resend.emails.send({
//       from: FROM_EMAIL,
//       to: row.to_email,
//       subject: row.subject,
//       text: row.body ?? "",
//       attachments: row.attachment_url
//         ? [{ path: row.attachment_url, filename: row.attachment_name ?? "attachment" }]
//         : undefined,
//     });

//     if (error) throw new Error(error.message);

//     await sql`
//       UPDATE emails
//       SET status = 'sent', sent_at = now(), updated_at = now(), error_message = NULL
//       WHERE id = ${emailId}
//     `;

//     return NextResponse.json({ ok: true });
//   } catch (err) {
//     console.error("Send failed:", err);
//     await sql`
//       UPDATE emails
//       SET status = 'failed', error_message = ${err instanceof Error ? err.message : "Unknown error"}, updated_at = now()
//       WHERE id = ${emailId}
//     `;
//     // Return 500 so QStash retries per its retry policy.
//     return NextResponse.json({ error: "Send failed" }, { status: 500 });
//   }
// }

// export const POST = verifySignatureAppRouter(handler);




import { NextResponse } from "next/server";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { sql } from "@/lib/db";
import { transporter, FROM_ADDRESS } from "@/lib/mailer";

interface SendJobBody {
  emailId: string;
}

async function handler(request: Request) {
  const { emailId }: SendJobBody = await request.json();

  const [email] = await sql`SELECT * FROM emails WHERE id = ${emailId}`;

  if (!email) {
    // Nothing to retry here — tell QStash this job is done.
    return NextResponse.json({ error: "Email not found" }, { status: 200 });
  }

  // Idempotency: if a previous QStash retry already got this through, skip.
  if (email.status === "sent") {
    return NextResponse.json({ status: "already_sent" });
  }

  try {
    // Fetch the attachment bytes from its Vercel Blob URL, if any, so we
    // can hand nodemailer the actual file rather than just a link.
    let attachments;
    if (email.attachment_url) {
      const fileRes = await fetch(email.attachment_url);
      if (fileRes.ok) {
        const buffer = Buffer.from(await fileRes.arrayBuffer());
        attachments = [
          {
            filename: email.attachment_name || "attachment.pdf",
            content: buffer,
          },
        ];
      }
    }

    await transporter.sendMail({
      from: FROM_ADDRESS,
      to: email.to_email,
      subject: email.subject,
      text: email.body,
      attachments,
    });

    await sql`
      UPDATE emails
      SET status = 'sent', sent_at = now(), updated_at = now(), error_message = NULL
      WHERE id = ${emailId}
    `;

    return NextResponse.json({ status: "sent" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown send error";
    console.error(`Failed to send email ${emailId}:`, message);

    await sql`
      UPDATE emails
      SET status = 'failed', error_message = ${message}, updated_at = now()
      WHERE id = ${emailId}
    `;

    // Return 200 so QStash doesn't keep retrying a permanently-failed send
    // (e.g. bad recipient address). For transient errors you'd rather retry,
    // return a 5xx instead and QStash will back off and try again.
    return NextResponse.json({ status: "failed", error: message });
  }
}
// Verifies the request really came from QStash using your signing keys.
export const POST = verifySignatureAppRouter(handler);