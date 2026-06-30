import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { WorklogEntry } from "@/types/task";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("task_id");

  let query = supabase
    .from("worklogs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (taskId) {
    query = query.eq("task_id", taskId);
  }

  const { data: worklogs, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ worklogs: worklogs as WorklogEntry[] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.task_id || !body.time_spent || body.time_spent <= 0) {
    return NextResponse.json(
      { error: "task_id și time_spent sunt obligatorii" },
      { status: 400 }
    );
  }

  const { data: worklog, error } = await supabase
    .from("worklogs")
    .insert({
      task_id: body.task_id,
      user_id: user.id,
      time_spent: body.time_spent,
      description: body.description || null,
      date: body.date || new Date().toISOString().split("T")[0],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ worklog: worklog as WorklogEntry }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID obligatoriu" }, { status: 400 });
  }

  const { error } = await supabase
    .from("worklogs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
