import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json();
  const count = Number.isFinite(body.count) ? Math.max(1, Number(body.count)) : 1;

  const { data: profile, error: readError } = await auth.supabase
    .from("profiles")
    .select("receipts_used")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const { error } = await auth.supabase
    .from("profiles")
    .update({ receipts_used: (profile?.receipts_used ?? 0) + count })
    .eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
