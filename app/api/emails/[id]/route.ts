import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { qstash } from "@/lib/qstash";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const [row] = await sql`SELECT * FROM emails WHERE id = ${id}`;

    if (!row) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Only try to cancel with QStash if it was actually scheduled there.
    // Drafts, already-sent, or already-failed emails have no live QStash message.
    if (row.qstash_msg_id && row.status === "scheduled") {
      try {
        await qstash.messages.cancel(row.qstash_msg_id);
      } catch (err) {
        // If QStash already fired it (race condition right at send time) or the
        // message id is stale, don't block the DB delete on that — log and continue.
        console.warn("QStash cancel failed (continuing with DB delete):", err);
      }
    }

    await sql`DELETE FROM emails WHERE id = ${id}`;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete failed:", err);
    return NextResponse.json(
      { error: "Failed to delete email. Please try again." },
      { status: 500 }
    );
  }
}