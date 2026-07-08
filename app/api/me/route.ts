import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";

export async function GET(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data: profile, error } = await auth.supabase
    .from("profiles")
    .select("*")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    profile,
    user: {
      id: auth.user.id,
      email: auth.user.email,
      metadata: auth.user.user_metadata
    }
  });
}
