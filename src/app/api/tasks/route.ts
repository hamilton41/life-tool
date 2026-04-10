import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";
import { Task } from "@/lib/types";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const task: Task = {
    id: crypto.randomUUID(),
    name: body.name,
    icon: body.icon || "📌",
    color: body.color || "#6366f1",
    scheduleType: body.scheduleType || "weekly",
    weeklyTarget: body.weeklyTarget,
    fixedDays: body.fixedDays,
    timeSlot: body.timeSlot,
    timerMode: body.timerMode || "none",
    countdownMinutes: body.countdownMinutes,
    createdAt: new Date().toISOString(),
  };

  data.tasks.push(task);
  writeData(data);
  return NextResponse.json(task, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const idx = data.tasks.findIndex((t) => t.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  data.tasks[idx] = { ...data.tasks[idx], ...body };
  writeData(data);
  return NextResponse.json(data.tasks[idx]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const data = readData();
  data.tasks = data.tasks.filter((t) => t.id !== id);
  data.records = data.records.filter((r) => r.taskId !== id);
  writeData(data);
  return NextResponse.json({ ok: true });
}
