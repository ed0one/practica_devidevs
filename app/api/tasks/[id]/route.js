import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateTaskInputSchema } from "@/lib/schemas";

// PATCH /api/tasks/[id]
// input: { status: 'done' | 'pending' }
export async function PATCH(request, ctx) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

  let status;
  try {
    const body = await request.json();
    status = updateTaskInputSchema.parse(body).status;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Input invalid.", issues: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "JSON invalid." }, { status: 400 });
  }

  // .eq('user_id') ne asigură că un user nu poate modifica task-ul altcuiva.
  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    // PGRST116 = niciun rând (id inexistent sau al altui user).
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Task negăsit." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
