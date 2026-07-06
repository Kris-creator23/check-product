import { NextResponse } from "next/server";
import { requireUser } from "../../../lib/auth";
import { plans, type PlanId } from "../../../lib/plans";

const allowedFields = new Set(["count"]);

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid usage payload." }, { status: 400 });
  }

  const fields = Object.keys(body);
  if (fields.some((field) => !allowedFields.has(field))) {
    return NextResponse.json({ error: "Usage payload may only include count." }, { status: 400 });
  }

  const count = Number((body as { count?: unknown }).count);
  if (!Number.isInteger(count) || count !== 1) {
    return NextResponse.json({ error: "Usage count must be exactly 1." }, { status: 400 });
  }

  const { data: profile, error: readError } = await auth.supabase
    .from("profiles")
    .select("receipts_used, selected_plan")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  if (readError) return NextResponse.json({ error: readError.message }, { status: 500 });

  const { error } = await auth.supabase
    .from("profiles")
    .update({ receipts_used: (profile?.receipts_used ?? 0) + count })
    .eq("user_id", auth.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const selectedPlan = profile?.selected_plan as PlanId | null;
  const quota = selectedPlan ? plans[selectedPlan]?.quota ?? 0 : 0;
  const receiptsUsed = (profile?.receipts_used ?? 0) + count;

  return NextResponse.json({
    ok: true,
    receiptsUsed,
    quota,
    receiptsRemaining: Math.max(0, quota - receiptsUsed)
  });
}
