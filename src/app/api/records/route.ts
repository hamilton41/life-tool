import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";
import { Record } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const weekStart = searchParams.get("weekStart");

  const data = readData();
  let records = data.records;

  if (date) {
    records = records.filter((r) => r.date === date);
  } else if (weekStart) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    records = records.filter((r) => {
      const d = new Date(r.date);
      return d >= start && d < end;
    });
  }

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const record: Record = {
    id: crypto.randomUUID(),
    taskId: body.taskId,
    date: body.date || new Date().toISOString().split("T")[0],
    startTime: body.startTime,
    endTime: body.endTime,
    duration: body.duration,
    completed: body.completed ?? true,
  };

  data.records.push(record);
  writeData(data);
  return NextResponse.json(record, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  const idx = data.records.findIndex((r) => r.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  data.records[idx] = { ...data.records[idx], ...body };
  writeData(data);
  return NextResponse.json(data.records[idx]);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const data = readData();
  data.records = data.records.filter((r) => r.id !== id);
  writeData(data);
  return NextResponse.json({ ok: true });
}
