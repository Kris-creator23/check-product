import { createAdminSupabase } from "./supabase";

export async function requireUser(request: Request) {
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

  if (!token) {
    return { error: "Missing authorization token", status: 401 as const };
  }

  const supabase = createAdminSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: "Invalid authorization token", status: 401 as const };
  }

  return { supabase, user: data.user };
}
