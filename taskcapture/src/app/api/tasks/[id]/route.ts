import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const allowed = [
    "status",
    "scheduled_date",
    "scheduled_start",
    "scheduled_end",
  ];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (updates.status && !["pending", "done"].includes(updates.status as string)) {
    return NextResponse.json({ error: "Status invalid" }, { status: 400 });
  }

  return NextResponse.json({ id, ...updates, updated: true });
}
