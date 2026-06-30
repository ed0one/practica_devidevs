import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/tasks
// output: { tasks: Task[] }  (doar task-urile userului logat)
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  // Filtrăm explicit după user_id; RLS-ul din Supabase e a doua barieră.
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("deadline", { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data });
}
