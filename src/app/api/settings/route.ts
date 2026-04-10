import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Settings } from "@/lib/types";

function mapSettings(row: Record<string, unknown>): Settings {
  return {
    theme: row.theme as "light" | "dark" | "system",
    accentColor: row.accent_color as string,
  };
}

export async function GET() {
  const rows = await sql`SELECT * FROM settings WHERE id = 1`;
  return NextResponse.json(mapSettings(rows[0] as Record<string, unknown>), {
    headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=120" },
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  await sql`
    UPDATE settings SET
      theme        = COALESCE(${body.theme ?? null}, theme),
      accent_color = COALESCE(${body.accentColor ?? null}, accent_color)
    WHERE id = 1
  `;

  const rows = await sql`SELECT * FROM settings WHERE id = 1`;
  return NextResponse.json(mapSettings(rows[0] as Record<string, unknown>));
}
