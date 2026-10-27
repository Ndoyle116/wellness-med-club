import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "@/lib/approvals.server";
import { getUsableApprovalProductIds } from "@/lib/approval-state";

/**
 * PATIENT: request approval for a lab-required product.
 * `requested_via` = 'uploaded_labs' if the patient already uploaded blood work,
 *                 = 'purchased_labs' if they intend to buy a lab panel first.
 */
export const requestProductApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        requestedVia: z.enum(["uploaded_labs", "purchased_labs"]),
        note: z.string().max(1000).optional(),
        documentIds: z.array(z.string().uuid()).max(20).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: p, error: pErr } = await supabase
      .from("products")
      .select("id, name, requires_labs, active")
      .eq("id", data.productId)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!p || !p.active) throw new Error("Product unavailable.");
    if (!p.requires_labs) throw new Error("This product does not require approval.");

    const docIds = data.documentIds ?? [];

    // Idempotent: merge docs into existing pending/approved request.
    const { data: existing } = await supabase
      .from("product_approvals")
      .select("id, status, document_ids")
      .eq("user_id", userId)
      .eq("product_id", data.productId)
      .in("status", ["pending", "approved"])
      .maybeSingle();
    if (existing) {
      if (docIds.length) {
        const merged = Array.from(
          new Set([...(existing.document_ids ?? []), ...docIds]),
        );
        await supabase
          .from("product_approvals")
          .update({ document_ids: merged })
          .eq("id", existing.id);
      }
      return { id: existing.id, status: existing.status };
    }

    // Reopen a prior disapproved request as a resubmission.
    const { data: prior } = await supabase
      .from("product_approvals")
      .select("id, reason")
      .eq("user_id", userId)
      .eq("product_id", data.productId)
      .eq("status", "disapproved")
      .order("reviewed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prior) {
      const { error: rErr } = await supabase
        .from("product_approvals")
        .update({
          status: "pending",
          reason: null,
          patient_note: data.note ?? null,
          requested_via: data.requestedVia,
          document_ids: docIds,
          resubmitted_at: new Date().toISOString(),
          previous_reason: prior.reason ?? null,
          reviewed_at: null,
          reviewed_by: null,
        })
        .eq("id", prior.id);
      if (rErr) throw new Error(rErr.message);
      await supabase.from("messages").insert({
        thread_user_id: userId,
        sender_id: userId,
        sender_role: "patient",
        body: `Uploaded updated labs for ${p.name}.`,
      });
      return { id: prior.id, status: "pending" as const };
    }

    const { data: row, error } = await supabase
      .from("product_approvals")
      .insert({
        user_id: userId,
        product_id: data.productId,
        status: "pending",
        requested_via: data.requestedVia,
        patient_note: data.note ?? null,
        document_ids: docIds,
      })
      .select("id, status")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** PATIENT: attach uploaded documents to an existing approval. Reopens disapproved rows. */
export const attachDocumentsToApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        approvalId: z.string().uuid(),
        documentIds: z.array(z.string().uuid()).min(1).max(20),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: a, error: aErr } = await supabase
      .from("product_approvals")
      .select(
        "id, user_id, status, document_ids, reason, product_id, products:products(name)",
      )
      .eq("id", data.approvalId)
      .maybeSingle();
    if (aErr) throw new Error(aErr.message);
    if (!a || a.user_id !== userId) throw new Error("Approval not found.");
    if (a.status === "consumed") throw new Error("This approval has already been used.");

    const merged = Array.from(
      new Set([...(a.document_ids ?? []), ...data.documentIds]),
    );
    const patch: {
      document_ids: string[];
      status?: "pending";
      previous_reason?: string | null;
      reason?: string | null;
      reviewed_at?: string | null;
      reviewed_by?: string | null;
      resubmitted_at?: string;
    } = { document_ids: merged };
    let resubmitted = false;
    if (a.status === "disapproved") {
      patch.status = "pending";
      patch.previous_reason = a.reason ?? null;
      patch.reason = null;
      patch.reviewed_at = null;
      patch.reviewed_by = null;
      patch.resubmitted_at = new Date().toISOString();
      resubmitted = true;
    } else if (a.status === "pending") {
      patch.resubmitted_at = new Date().toISOString();
      resubmitted = true;
    }
    const { error } = await supabase
      .from("product_approvals")
      .update(patch)
      .eq("id", data.approvalId);
    if (error) throw new Error(error.message);

    if (resubmitted) {
      const productName =
        Array.isArray(a.products) ? (a.products[0] as any)?.name : (a.products as any)?.name;
      await supabase.from("messages").insert({
        thread_user_id: userId,
        sender_id: userId,
        sender_role: "patient",
        body: `Uploaded updated labs for ${productName ?? "a lab-required product"}.`,
      });
    }
    return { ok: true } as const;
  });

/** PATIENT: list all my approvals (for account page and to gate PDP). */
export const listMyApprovals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("product_approvals")
      .select(
        "id, product_id, status, requested_via, reason, patient_note, reviewed_at, consumed_at, created_at, document_ids, resubmitted_at, previous_reason, products:products(name, slug)",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { approvals: data ?? [] };
  });

/** PATIENT: check a single product's approval status (used by PDP). */
export const getMyApprovalForProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ productId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: rows, error } = await supabase
      .from("product_approvals")
      .select("id, status, requested_via, reason, reviewed_at, created_at")
      .eq("user_id", userId)
      .eq("product_id", data.productId)
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    return { approval: rows?.[0] ?? null };
  });

/** PATIENT: return approved manual-lab product IDs that are still usable. */
export const listMyApprovedManualLabProductIds = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("product_approvals")
      .select("product_id, status, requested_via, reviewed_at, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return {
      productIds: getUsableApprovalProductIds(
        (data ?? []) as Array<{
          product_id: string;
          status: "pending" | "approved" | "disapproved" | "consumed";
          requested_via: "uploaded_labs" | "purchased_labs";
          reviewed_at: string | null;
          created_at: string | null;
        }>,
      ),
    };
  });

// =========================
// ADMIN
// =========================

export const adminListApprovals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        status: z.enum(["pending", "approved", "disapproved", "consumed", "all"]).default("pending"),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("product_approvals")
      .select(
        "id, user_id, product_id, status, requested_via, reason, patient_note, reviewed_at, created_at, document_ids, resubmitted_at, previous_reason, products:products(name, slug)",
      )
      .order("resubmitted_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Enrich patient name/email
    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    const nameMap = new Map<string, { name: string; email: string | null }>();
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);
      for (const p of profiles ?? []) {
        nameMap.set(p.user_id, {
          name: [p.first_name, p.last_name].filter(Boolean).join(" ") || "—",
          email: null,
        });
      }
      for (const uid of userIds) {
        try {
          const { data: u } = await supabaseAdmin.auth.admin.getUserById(uid);
          const cur = nameMap.get(uid) ?? { name: "—", email: null };
          nameMap.set(uid, { ...cur, email: u?.user?.email ?? null });
        } catch {
          /* noop */
        }
      }
    }

    // Resolve attached documents to signed URLs.
    const allDocIds = Array.from(
      new Set((rows ?? []).flatMap((r) => (r.document_ids as string[]) ?? [])),
    );
    const docMap = new Map<
      string,
      {
        id: string;
        file_name: string;
        signed_url: string | null;
        created_at: string;
        mime_type: string | null;
      }
    >();
    if (allDocIds.length) {
      const { data: docs } = await supabaseAdmin
        .from("patient_documents")
        .select("id, file_path, file_name, mime_type, created_at")
        .in("id", allDocIds);
      await Promise.all(
        (docs ?? []).map(async (d) => {
          const { data: signed } = await supabaseAdmin.storage
            .from("patient-documents")
            .createSignedUrl(d.file_path, 600);
          docMap.set(d.id, {
            id: d.id,
            file_name: d.file_name,
            signed_url: signed?.signedUrl ?? null,
            created_at: d.created_at,
            mime_type: d.mime_type ?? null,
          });
        }),
      );
    }

    return {
      approvals: (rows ?? []).map((r) => ({
        ...r,
        patient_name: nameMap.get(r.user_id)?.name ?? "—",
        patient_email: nameMap.get(r.user_id)?.email ?? null,
        documents: ((r.document_ids as string[]) ?? [])
          .map((id) => docMap.get(id))
          .filter(Boolean),
      })),
    };
  });

export const adminDecideApproval = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        approvalId: z.string().uuid(),
        decision: z.enum(["approved", "disapproved"]),
        reason: z.string().max(2000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    if (data.decision === "disapproved" && !data.reason?.trim()) {
      throw new Error("A reason is required when disapproving.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reviewedAt = new Date().toISOString();
    const { error } = await supabaseAdmin
      .from("product_approvals")
      .update({
        status: data.decision,
        reason: data.reason ?? null,
        reviewed_by: context.userId,
        reviewed_at: reviewedAt,
      })
      .eq("id", data.approvalId);
    if (error) throw new Error(error.message);

    // Approved: capture the medication amount that was authorised when the
    // patient paid for their lab panel inline.
    if (data.decision === "approved") {
      try {
        const { data: appr } = await supabaseAdmin
          .from("product_approvals")
          .select("user_id, product_id")
          .eq("id", data.approvalId)
          .maybeSingle();
        if (appr) {
          const { captureHoldsForApproval } = await import("@/lib/lab-payment.server");
          await captureHoldsForApproval({
            userId: appr.user_id,
            productId: appr.product_id,
            environment: (process.env["STRIPE_SECRET_KEY"] ?? "").startsWith("sk_test_")
              ? "sandbox"
              : "live",
          });
        }
      } catch {
        /* best effort — staff can capture manually from the order */
      }
    }

    // Best-effort notification email + in-app message on decision.
    try {
      const { data: appr } = await supabaseAdmin
        .from("product_approvals")
        .select("user_id, product_id, products:products(name, slug)")
        .eq("id", data.approvalId)
        .maybeSingle();
      if (appr) {
        const productName =
          (Array.isArray(appr.products)
            ? (appr.products[0] as any)?.name
            : (appr.products as any)?.name) ?? "your product";
        const productSlug =
          (Array.isArray(appr.products)
            ? (appr.products[0] as any)?.slug
            : (appr.products as any)?.slug) ?? "";
        const msg =
          data.decision === "approved"
            ? `Good news — your lab review for ${productName} was approved. You can now complete your purchase.`
            : `Your lab review for ${productName} was not approved. ${data.reason ? "Note from the clinician: " + data.reason : ""}`;
        await supabaseAdmin.from("messages").insert({
          thread_user_id: appr.user_id,
          sender_id: context.userId,
          sender_role: "staff",
          body: msg,
        });

        // Email the patient with a direct link back to the product page.
        try {
          const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(
            appr.user_id,
          );
          const email = userRes?.user?.email;
          if (email) {
            const { sendApprovalDecisionEmail } = await import(
              "@/lib/notification-emails.server"
            );
            await sendApprovalDecisionEmail({
              email,
              decision: data.decision,
              productName,
              productSlug,
              reason: data.reason ?? null,
              approvalId: data.approvalId,
              decisionVersion: reviewedAt,
            });
          }
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }

    return { ok: true } as const;
  });


/** ADMIN: list customers with search + pending approval counts. */
export const adminListCustomers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ search: z.string().max(120).optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch auth users (paginated in real projects — MVP: first 500)
    const { data: usersPage } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 500,
    });
    const users = usersPage?.users ?? [];

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name, last_name, phone");
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const { data: approvals } = await supabaseAdmin
      .from("product_approvals")
      .select("user_id, status");
    const pendingByUser = new Map<string, number>();
    for (const a of approvals ?? []) {
      if (a.status === "pending") {
        pendingByUser.set(a.user_id, (pendingByUser.get(a.user_id) ?? 0) + 1);
      }
    }

    const { data: unread } = await supabaseAdmin
      .from("messages")
      .select("thread_user_id, sender_role, read_at");
    const unreadByUser = new Map<string, number>();
    for (const m of unread ?? []) {
      if (m.sender_role === "patient" && !m.read_at) {
        unreadByUser.set(m.thread_user_id, (unreadByUser.get(m.thread_user_id) ?? 0) + 1);
      }
    }

    const rows = users.map((u) => {
      const p = profileMap.get(u.id);
      const name = [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—";
      return {
        user_id: u.id,
        email: u.email ?? "",
        name,
        phone: p?.phone ?? null,
        pending_approvals: pendingByUser.get(u.id) ?? 0,
        unread_messages: unreadByUser.get(u.id) ?? 0,
        created_at: u.created_at,
      };
    });

    const term = data.search?.trim().toLowerCase();
    const filtered = term
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(term) || r.email.toLowerCase().includes(term),
        )
      : rows;

    filtered.sort((a, b) => {
      if (b.pending_approvals !== a.pending_approvals)
        return b.pending_approvals - a.pending_approvals;
      return (b.created_at ?? "").localeCompare(a.created_at ?? "");
    });

    return { customers: filtered.slice(0, 200) };
  });

/** ADMIN: full customer profile — documents (signed URLs), approvals, orders. */
export const adminGetCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: profile }, { data: docs }, { data: approvals }, { data: orders }, userRes] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("user_id, first_name, last_name, phone, date_of_birth")
          .eq("user_id", data.userId)
          .maybeSingle(),
        supabaseAdmin
          .from("patient_documents")
          .select("id, doc_type, file_path, file_name, mime_type, size_bytes, created_at")
          .eq("user_id", data.userId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("product_approvals")
          .select(
            "id, product_id, status, requested_via, reason, patient_note, reviewed_at, consumed_at, created_at, document_ids, resubmitted_at, previous_reason, products:products(name, slug)",
          )
          .eq("user_id", data.userId)
          .order("resubmitted_at", { ascending: false, nullsFirst: false })
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("orders")
          .select("id, status, total_cents, paid_at, created_at")
          .eq("user_id", data.userId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseAdmin.auth.admin.getUserById(data.userId),
      ]);

    const docsWithUrls = await Promise.all(
      (docs ?? []).map(async (d) => {
        const { data: signed } = await supabaseAdmin.storage
          .from("patient-documents")
          .createSignedUrl(d.file_path, 600);
        return { ...d, signed_url: signed?.signedUrl ?? null };
      }),
    );
    const docById = new Map(docsWithUrls.map((d) => [d.id, d]));
    const approvalsWithDocs = (approvals ?? []).map((a) => ({
      ...a,
      documents: ((a.document_ids as string[]) ?? [])
        .map((id) => docById.get(id))
        .filter(Boolean),
    }));

    return {
      profile,
      email: userRes.data?.user?.email ?? null,
      documents: docsWithUrls,
      approvals: approvalsWithDocs,
      orders: orders ?? [],
    };
  });
