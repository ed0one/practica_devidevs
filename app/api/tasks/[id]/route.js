import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { updateTaskInputSchema } from "@/lib/schemas";
import { writeRateLimit, getClientIp } from "@/lib/rate-limit";

export async function PATCH(request, ctx) {
  const ip = getClientIp(request);
  const result = await writeRateLimit.limit(`tasks_write_${ip}`);
  if (!result.success) {
    return NextResponse.json(
      { error: "Prea multe cereri! Așteptați câteva momente." },
      { status: 429 }
    );
  }

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

  const { data, error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Task negăsit." }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ task: data });
}
