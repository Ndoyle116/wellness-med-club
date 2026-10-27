export async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", {
    _user_id: context.userId,
  });
  if (error || !data) throw new Error("Forbidden — staff only");
}
