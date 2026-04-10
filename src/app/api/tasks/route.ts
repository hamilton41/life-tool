import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { Task } from "@/lib/types";

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: row.id as string,
    name: row.name as string,
    icon: row.icon as string,
    color: row.color as string,
    scheduleType: row.schedule_type as "weekly" | "fixed",
    weeklyTarget: row.weekly_target as number | undefined,
    fixedDays: row.fixed_days as number[] | undefined,
    daySlots: row.day_slots as Task["daySlots"],
    timeSlot: row.time_slot as Task["timeSlot"],
    timerMode: row.timer_mode as "countdown" | "stopwatch" | "none",
    countdownMinutes: row.countdown_minutes as number | undefined,
    createdAt: row.created_at as string,
  };
}

export async function GET() {
  const rows = await sql`SELECT * FROM tasks ORDER BY created_at ASC`;
  return NextResponse.json(rows.map(mapTask), {
    headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const task: Task = {
    id: crypto.randomUUID(),
    name: body.name,
    icon: body.icon || "📌",
    color: body.color || "#6366f1",
    scheduleType: body.scheduleType || "weekly",
    weeklyTarget: body.weeklyTarget,
    fixedDays: body.fixedDays,
    daySlots: body.daySlots,
    timeSlot: body.timeSlot,
    timerMode: body.timerMode || "none",
    countdownMinutes: body.countdownMinutes,
    createdAt: new Date().toISOString(),
  };

  await sql`
    INSERT INTO tasks (id, name, icon, color, schedule_type, weekly_target, fixed_days, day_slots, time_slot, timer_mode, countdown_minutes, created_at)
    VALUES (
      ${task.id}, ${task.name}, ${task.icon}, ${task.color},
      ${task.scheduleType}, ${task.weeklyTarget ?? null},
      ${task.fixedDays ? JSON.stringify(task.fixedDays) : null},
      ${task.daySlots ? JSON.stringify(task.daySlots) : null},
      ${task.timeSlot ? JSON.stringify(task.timeSlot) : null},
      ${task.timerMode}, ${task.countdownMinutes ?? null}, ${task.createdAt}
    )
  `;

  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();

  const rows = await sql`SELECT * FROM tasks WHERE id = ${body.id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await sql`
    UPDATE tasks SET
      name               = ${body.name ?? rows[0].name},
      icon               = ${body.icon ?? rows[0].icon},
      color              = ${body.color ?? rows[0].color},
      schedule_type      = ${body.scheduleType ?? rows[0].schedule_type},
      weekly_target      = ${body.weeklyTarget ?? rows[0].weekly_target},
      fixed_days         = ${body.fixedDays ? JSON.stringify(body.fixedDays) : rows[0].fixed_days},
      day_slots          = ${body.daySlots ? JSON.stringify(body.daySlots) : rows[0].day_slots},
      time_slot          = ${body.timeSlot ? JSON.stringify(body.timeSlot) : rows[0].time_slot},
      timer_mode         = ${body.timerMode ?? rows[0].timer_mode},
      countdown_minutes  = ${body.countdownMinutes ?? rows[0].countdown_minutes}
    WHERE id = ${body.id}
  `;

  const updated = await sql`SELECT * FROM tasks WHERE id = ${body.id}`;
  return NextResponse.json(mapTask(updated[0] as Record<string, unknown>));
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await sql`DELETE FROM records WHERE task_id = ${id}`;
  await sql`DELETE FROM tasks WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
