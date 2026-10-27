import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", {
    _user_id: context.userId,
  });
  if (error || !data) throw new Error("Forbidden — staff only");
}

/** Patient: list messages in own thread. */
export const listMyMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, sender_role, body, read_at, created_at")
      .eq("thread_user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    // Mark staff messages as read
    const unreadIds = (data ?? [])
      .filter((m) => m.sender_role === "staff" && !m.read_at)
      .map((m) => m.id);
    if (unreadIds.length) {
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadIds);
    }
    return { messages: data ?? [] };
  });

export const sendPatientMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ body: z.string().trim().min(1).max(4000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        thread_user_id: userId,
        sender_id: userId,
        sender_role: "patient",
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const getMyUnreadCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("thread_user_id", userId)
      .eq("sender_role", "staff")
      .is("read_at", null);
    return { count: count ?? 0 };
  });

/** Admin: list messages for one patient thread + mark patient messages read. */
export const adminListThread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: msgs, error } = await supabaseAdmin
      .from("messages")
      .select("id, sender_id, sender_role, body, read_at, created_at")
      .eq("thread_user_id", data.userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    const unread = (msgs ?? [])
      .filter((m) => m.sender_role === "patient" && !m.read_at)
      .map((m) => m.id);
    if (unread.length) {
      await supabaseAdmin
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .in("id", unread);
    }
    return { messages: msgs ?? [] };
  });

export const adminSendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ userId: z.string().uuid(), body: z.string().trim().min(1).max(4000) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        thread_user_id: data.userId,
        sender_id: userId,
        sender_role: "staff",
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });
