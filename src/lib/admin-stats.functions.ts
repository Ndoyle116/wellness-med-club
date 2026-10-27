import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", {
    _user_id: context.userId,
  });
  if (error || !data) throw new Error("Forbidden — staff only");
}

export const adminGetDashboardStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOf30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalOrdersRes,
      pendingRes,
      approvedTodayRes,
      revenue30Res,
      activeProductsRes,
      openSlotsRes,
      recentOrdersRes,
    ] = await Promise.all([
      supabaseAdmin.from("orders").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["under_review", "awaiting_consultation", "awaiting_labs", "pending"]),
      supabaseAdmin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("reviewed_at", startOfDay),
      supabaseAdmin
        .from("orders")
        .select("total_cents")
        .not("paid_at", "is", null)
        .gte("paid_at", startOf30),
      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
      supabaseAdmin
        .from("provider_availability_slots")
        .select("id", { count: "exact", head: true })
        .eq("is_booked", false)
        .gte("start_at", now.toISOString()),
      supabaseAdmin
        .from("orders")
        .select("id, status, total_cents, created_at, user_id")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const revenue30 = (revenue30Res.data ?? []).reduce(
      (acc: number, o: { total_cents: number }) => acc + (o.total_cents ?? 0),
      0,
    );

    // Group recent by status for pipeline chart
    const statusCountsRes = await supabaseAdmin
      .from("orders")
      .select("status")
      .gte("created_at", startOf30);
    const statusCounts: Record<string, number> = {};
    for (const r of statusCountsRes.data ?? []) {
      const s = (r as { status: string }).status;
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    }

    // Names for recent orders
    const userIds = Array.from(
      new Set((recentOrdersRes.data ?? []).map((o: { user_id: string }) => o.user_id)),
    );
    const nameMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);
      for (const p of profiles ?? []) {
        nameMap.set(
          (p as { user_id: string }).user_id,
          [
            (p as { first_name?: string }).first_name,
            (p as { last_name?: string }).last_name,
          ]
            .filter(Boolean)
            .join(" "),
        );
      }
    }

    return {
      kpis: {
        totalOrders: totalOrdersRes.count ?? 0,
        pending: pendingRes.count ?? 0,
        approvedToday: approvedTodayRes.count ?? 0,
        revenue30Cents: revenue30,
        activeProducts: activeProductsRes.count ?? 0,
        openSlots: openSlotsRes.count ?? 0,
      },
      pipeline: statusCounts,
      recent: (recentOrdersRes.data ?? []).map((o: any) => ({
        id: o.id as string,
        status: o.status as string,
        total_cents: o.total_cents as number,
        created_at: o.created_at as string,
        patient_name: nameMap.get(o.user_id) ?? "",
      })),
    };
  });
