import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic"; // never cache — always hit Neon fresh

export async function GET() {
  try {
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