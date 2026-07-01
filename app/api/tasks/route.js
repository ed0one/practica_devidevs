import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET(request) {
  const ip = getClientIp(request);
  const result = await readRateLimit.limit(`tasks_read_${ip}`);
  if (!result.success) {
    return NextResponse.json(
      { error: "Prea multe cereri! Așteptați câteva momente." },
      { status: 429 }
    );
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Neautentificat." }, { status: 401 });
  }

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
