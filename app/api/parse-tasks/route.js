import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { parseTasksInputSchema } from "@/lib/schemas";
import { parseTasksWithNim } from "@/lib/nim";

// POST /api/parse-tasks
// input:  { text: string }
// output: { tasks: Task[] }
export async function POST(request) {
  const supabase = await createClient();

  // 1. Auth: dacă nu e logat, oprim aici.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  // 2. Validăm body-ul.
  let text;
  try {
    const body = await request.json();
    text = parseTasksInputSchema.parse(body).text;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Input invalid.", issues: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  // 3. Chemăm NVIDIA NIM + validăm cu Zod (în interiorul helper-ului).
  let llmTasks;
  try {
    llmTasks = await parseTasksWithNim(text);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Modelul a întors o formă invalidă.", issues: err.issues },
        { status: 422 }
      );
    }
    const message = err instanceof Error ? err.message : "Eroare la LLM.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  if (llmTasks.length === 0) {
    return NextResponse.json({ tasks: [] });
  }

  // 4. INSERT în Supabase (RLS leagă fiecare task de user).
  const rows = llmTasks.map((t) => ({
    user_id: user.id,
    title: t.title,
    deadline: t.deadline,
    priority: t.priority,
    category: t.category,
    status: "pending",
    raw_input: text,
  }));

  const { data, error } = await supabase.from("tasks").insert(rows).select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ tasks: data }, { status: 201 });
}
