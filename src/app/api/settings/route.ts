import { NextRequest, NextResponse } from "next/server";
import { readData, writeData } from "@/lib/data";

export async function GET() {
  const data = readData();
  return NextResponse.json(data.settings);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const data = readData();

  data.settings = { ...data.settings, ...body };
  writeData(data);
  return NextResponse.json(data.settings);
}
