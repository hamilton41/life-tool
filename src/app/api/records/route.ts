import { NextRequest, NextResponse } from "next/server";
import { sql, ensureDb } from "@/lib/db";
import { Record as AppRecord } from "@/lib/types";

function mapRecord(row: Record<string, unknown>): AppRecord {
  return {
    id: row.id as string,
    taskId: row.task_id as string,
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    duration: row.duration as number | undefined,
    completed: row.completed as boolean,
  };
}

export async function GET(req: NextRequest) {
  await ensureDb();
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const weekStart = searchParams.get("weekStart");

  let rows;

  if (date) {
    rows = await sql`SELECT * FROM records WHERE date = ${date} ORDER BY date ASC`;
  } else if (weekStart) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];
    rows = await sql`SELECT * FROM records WHERE date >= ${startStr} AND date < ${endStr} ORDER BY date ASC`;
  } else {
    rows = await sql`SELECT * FROM records ORDER BY date ASC`;
  }

  return NextResponse.json(rows.map((r) => mapRecord(r as Record<string, unknown>)));
}

export async function POST(req: NextRequest) {
  await ensureDb();
  const body = await req.json();

  const record: AppRecord = {
    id: crypto.randomUUID(),
    taskId: body.taskId,
    date: body.date || new Date().toISOString().split("T")[0],
    startTime: body.startTime,
    endTime: body.endTime,
    duration: body.duration,
    completed: body.completed ?? true,
  };

  await sql`
    INSERT INTO records (id, task_id, date, start_time, end_time, duration, completed)
    VALUES (
      ${record.id}, ${record.taskId}, ${record.date},
      ${record.startTime ?? null}, ${record.endTime ?? null},
      ${record.duration ?? null}, ${record.completed}
    )
  `;

  return NextResponse.json(record, { status: 201 });
}

export async function PUT(req: NextRequest) {
  await ensureDb();
  const body = await req.json();

  const rows = await sql`SELECT * FROM records WHERE id = ${body.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  await sql`
    UPDATE records SET
      task_id    = ${body.taskId ?? rows[0].task_id},
      date       = ${body.date ?? rows[0].date},
      start_time = ${body.startTime ?? rows[0].start_time},
      end_time   = ${body.endTime ?? rows[0].end_time},
      duration   = ${body.duration ?? rows[0].duration},
      completed  = ${body.completed ?? rows[0].completed}
    WHERE id = ${body.id}
  `;

  const updated = await sql`SELECT * FROM records WHERE id = ${body.id}`;
  return NextResponse.json(mapRecord(updated[0] as Record<string, unknown>));
}

export async function DELETE(req: NextRequest) {
  await ensureDb();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await sql`DELETE FROM records WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
