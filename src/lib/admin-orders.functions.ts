import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", {
    _user_id: context.userId,
  });
  if (error || !data) throw new Error("Forbidden — staff only");
}

export const adminListOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, user_id, status, total_cents, paid_at, created_at, requires_labs, requires_consultation",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const orderIds = (data ?? []).map((o) => o.id);
    const pharmaciesByOrder = new Map<string, Set<string>>();
    if (orderIds.length) {
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("order_id, pharmacy_snapshot")
        .in("order_id", orderIds);
      for (const it of items ?? []) {
        if (!it.pharmacy_snapshot) continue;
        const set = pharmaciesByOrder.get(it.order_id) ?? new Set<string>();
        set.add(it.pharmacy_snapshot as string);
        pharmaciesByOrder.set(it.order_id, set);
      }
    }

    // Fetch emails via auth admin
    const userIds = Array.from(new Set((data ?? []).map((o) => o.user_id)));
    const emailMap = new Map<string, string>();
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);
      const nameMap = new Map<string, string>(
        (profiles ?? []).map((p) => [
          p.user_id,
          [p.first_name, p.last_name].filter(Boolean).join(" "),
        ]),
      );
      for (const uid of userIds) emailMap.set(uid, nameMap.get(uid) ?? "");
    }

    return {
      orders: (data ?? []).map((o) => ({
        ...o,
        patient_name: emailMap.get(o.user_id) ?? "",
        pharmacies: Array.from(pharmaciesByOrder.get(o.id) ?? []).sort(),
      })),
    };
  });

export const adminGetOrderItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: items, error } = await supabaseAdmin
      .from("order_items")
      .select(
        "id, quantity, unit_price_cents, product_name_snapshot, product_category_snapshot, pharmacy_snapshot",
      )
      .eq("order_id", data.orderId)
      .order("pharmacy_snapshot", { ascending: true });
    if (error) throw new Error(error.message);
    return { items: items ?? [] };
  });

export const adminGetOrderDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select(
        "id, user_id, status, subtotal_cents, total_cents, paid_at, created_at, updated_at, requires_labs, requires_consultation, has_recent_labs, provider_notes, rejected_reason, reviewed_at, reviewed_by",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderErr) throw new Error(orderErr.message);
    if (!order) throw new Error("Order not found");

    const [{ data: items }, { data: events }, { data: profile }, { data: intake }, { data: documents }] =
      await Promise.all([
        supabaseAdmin
          .from("order_items")
          .select(
            "id, quantity, unit_price_cents, product_name_snapshot, product_category_snapshot, pharmacy_snapshot, add_ons",
          )
          .eq("order_id", data.orderId)
          .order("pharmacy_snapshot", { ascending: true }),
        supabaseAdmin
          .from("order_events")
          .select("id, event_type, from_status, to_status, notes, actor_id, created_at")
          .eq("order_id", data.orderId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("profiles")
          .select("user_id, first_name, last_name, date_of_birth, phone")
          .eq("user_id", order.user_id)
          .maybeSingle(),
        supabaseAdmin
          .from("intake_responses")
          .select(
            "residency_state, allergies, current_medications, medical_history, has_cancer_history, has_cardiac_condition, has_endocrine_condition, is_pregnant_or_nursing, attestation_signed, attestation_signed_at, updated_at",
          )
          .eq("user_id", order.user_id)
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabaseAdmin
          .from("patient_documents")
          .select("id, doc_type, file_path, file_name, mime_type, size_bytes, created_at")
          .eq("user_id", order.user_id)
          .order("created_at", { ascending: false }),
      ]);

    let email: string | null = null;
    try {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(order.user_id);
      email = userRes?.user?.email ?? null;
    } catch {
      email = null;
    }

    // Generate short-lived signed URLs for each document so the drawer can open them.
    const docsWithUrls = await Promise.all(
      (documents ?? []).map(async (d) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("patient-documents")
          .createSignedUrl(d.file_path, 300);
        return { ...d, signed_url: signed?.signedUrl ?? null };
      }),
    );

    return {
      order,
      items: items ?? [],
      events: events ?? [],
      profile: profile ?? null,
      intake: intake ?? null,
      documents: docsWithUrls,
      email,
    };
  });

const ApproveInput = z.object({
  orderId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
});

export const adminApproveOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ApproveInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Order not found");

    const fromStatus = order.status;
    await supabaseAdmin
      .from("orders")
      .update({
        status: "approved",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        provider_notes: data.notes ?? null,
      })
      .eq("id", data.orderId);

    await supabaseAdmin.from("order_events").insert({
      order_id: data.orderId,
      actor_id: context.userId,
      event_type: "order.approved",
      from_status: fromStatus,
      to_status: "approved",
      notes: data.notes ?? null,
    });

    // Fire approval email (best-effort)
    try {
      const { sendOrderEmail } = await import("@/lib/order-emails.server");
      await sendOrderEmail({ orderId: data.orderId, kind: "approved" });
    } catch (e) {
      console.error("[approve] email send failed", e);
    }

    return { ok: true } as const;
  });

const RejectInput = z.object({
  orderId: z.string().uuid(),
  reason: z.string().min(3).max(2000),
});

export const adminRejectOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => RejectInput.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", data.orderId)
      .maybeSingle();
    if (!order) throw new Error("Order not found");

    await supabaseAdmin
      .from("orders")
      .update({
        status: "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        rejected_reason: data.reason,
      })
      .eq("id", data.orderId);

    await supabaseAdmin.from("order_events").insert({
      order_id: data.orderId,
      actor_id: context.userId,
      event_type: "order.rejected",
      from_status: order.status,
      to_status: "rejected",
      notes: data.reason,
    });

    try {
      const { sendOrderEmail } = await import("@/lib/order-emails.server");
      await sendOrderEmail({ orderId: data.orderId, kind: "rejected", reason: data.reason });
    } catch (e) {
      console.error("[reject] email send failed", e);
    }

    return { ok: true } as const;
  });
