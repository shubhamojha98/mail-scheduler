import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET() {
  try {
    // Drafts have no scheduled_at, so order those by created_at instead,
    // and put scheduled ones first (soonest first).
    const rows = await sql`
      SELECT * FROM emails
      ORDER BY 
        CASE WHEN status = 'draft' THEN 1 ELSE 0 END,
        COALESCE(scheduled_at, created_at) ASC
    `;
    return NextResponse.json({ emails: rows });
  } catch (err) {
    console.error("Fetch emails failed:", err);
    return NextResponse.json(
      { error: "Failed to load emails" },
      { status: 500 }
    );
  }
}