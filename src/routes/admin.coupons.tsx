import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, Ticket, Trash2, X, Pencil } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminDeleteCoupon,
} from "@/lib/admin-coupons.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons — Admin" }] }),
  component: AdminCouponsPage,
});

type Coupon = {
  id: string;
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_cents: number;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  min_eligible_items: number;
  excludes_flagged_products: boolean;
};

type FormState = {
  code: string;
  description: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_dollars: number;
  max_uses: number | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  min_eligible_items: number;
  excludes_flagged_products: boolean;
};

const toLocalInput = (iso: string | null) =>
  iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";

const emptyForm = (): FormState => ({
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: 10,
  min_order_dollars: 0,
  max_uses: null,
  is_active: true,
  starts_at: toLocalInput(new Date().toISOString()),
  expires_at: "",
  min_eligible_items: 0,
  excludes_flagged_products: false,
});

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function AdminCouponsPage() {
  const list = useServerFn(adminListCoupons);
  const create = useServerFn(adminCreateCoupon);
  const update = useServerFn(adminUpdateCoupon);
  const remove = useServerFn(adminDeleteCoupon);

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await list({});
      setCoupons((res.coupons ?? []) as Coupon[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to load coupons");
    } finally {
      setLoading(false);
    }
  }, [list]);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: Number(c.discount_value),
      min_order_dollars: (c.min_order_cents ?? 0) / 100,
      max_uses: c.max_uses,
      is_active: c.is_active,
      starts_at: toLocalInput(c.starts_at),
      expires_at: toLocalInput(c.expires_at),
      min_eligible_items: Number(c.min_eligible_items ?? 0),
      excludes_flagged_products: !!c.excludes_flagged_products,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.code.trim()) {
      toast.error("Code is required");
      return;
    }
    setSaving(true);
    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value) || 0,
      min_order_cents: Math.round((Number(form.min_order_dollars) || 0) * 100),
      max_uses: form.max_uses,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      min_eligible_items: Math.max(0, Number(form.min_eligible_items) || 0),
      excludes_flagged_products: form.excludes_flagged_products,
    };
    try {
      if (editing) await update({ data: { id: editing.id, ...payload } });
      else await create({ data: payload });
      toast.success(editing ? "Coupon updated" : "Coupon created");
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const destroy = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await remove({ data: { id: c.id } });
      toast.success("Coupon deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unable to delete coupon");
    }
  };

  const field = "w-full border border-border bg-background px-3 py-2 text-sm";
  const label = "text-[11px] uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <AdminShell
      title="Coupons"
      eyebrow="Promotions"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors"
        >
          <Plus className="h-4 w-4" /> New coupon
        </button>
      }
    >
      {showForm && (
        <div className="border border-border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl">{editing ? `Edit ${editing.code}` : "New coupon"}</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className={label}>Code</div>
              <input
                className={`${field} font-mono uppercase`}
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SAVE20"
              />
            </div>
            <div>
              <div className={label}>Description</div>
              <input
                className={field}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Spring promo"
              />
            </div>
            <div>
              <div className={label}>Discount type</div>
              <select
                className={field}
                value={form.discount_type}
                onChange={(e) =>
                  setForm((f) => ({ ...f, discount_type: e.target.value as "percentage" | "fixed" }))
                }
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed amount ($)</option>
              </select>
            </div>
            <div>
              <div className={label}>{form.discount_type === "percentage" ? "Percent off" : "Dollars off"}</div>
              <input
                type="number"
                className={field}
                value={form.discount_value}
                onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
              />
            </div>
            <div>
              <div className={label}>Minimum order ($)</div>
              <input
                type="number"
                className={field}
                value={form.min_order_dollars}
                onChange={(e) => setForm((f) => ({ ...f, min_order_dollars: Number(e.target.value) }))}
              />
            </div>
            <div>
              <div className={label}>Max uses (blank = unlimited)</div>
              <input
                type="number"
                className={field}
                value={form.max_uses ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))
                }
                placeholder="Unlimited"
              />
            </div>
            <div>
              <div className={label}>Starts at</div>
              <input
                type="datetime-local"
                className={field}
                value={form.starts_at}
                onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
              />
            </div>
            <div>
              <div className={label}>Expires at (optional)</div>
              <input
                type="datetime-local"
                className={field}
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
              />
            </div>
            <div>
              <div className={label}>Minimum qualifying items (0 = no minimum)</div>
              <input
                type="number"
                min={0}
                className={field}
                value={form.min_eligible_items}
                onChange={(e) =>
                  setForm((f) => ({ ...f, min_eligible_items: Number(e.target.value) }))
                }
              />
            </div>
            <label className="flex items-start gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.excludes_flagged_products}
                onChange={(e) =>
                  setForm((f) => ({ ...f, excludes_flagged_products: e.target.checked }))
                }
              />
              <span>
                Exclude testosterone &amp; phentermine
                <span className="block text-xs text-muted-foreground">
                  Excluded items never count toward the minimum and never get discounted.
                </span>
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border px-4 py-2 text-xs uppercase tracking-[0.22em]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-16 justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading coupons…
        </div>
      ) : coupons.length === 0 ? (
        <div className="border border-border bg-card p-16 text-center">
          <Ticket className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground">No coupons yet.</p>
        </div>
      ) : (
        <div className="border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-secondary/50 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                <th className="text-left px-5 py-3">Code</th>
                <th className="text-left px-5 py-3">Discount</th>
                <th className="text-center px-5 py-3">Uses</th>
                <th className="text-left px-5 py-3">Window</th>
                <th className="text-center px-5 py-3">Status</th>
                <th className="text-right px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="font-mono font-medium">{c.code}</div>
                    {c.description && (
                      <div className="text-xs text-muted-foreground">{c.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    {c.discount_type === "percentage"
                      ? `${Number(c.discount_value)}%`
                      : money(Number(c.discount_value) * 100)}{" "}
                    off
                    {c.min_order_cents > 0 && (
                      <span className="text-xs text-muted-foreground"> (min {money(c.min_order_cents)})</span>
                    )}
                    {(c.min_eligible_items > 0 || c.excludes_flagged_products) && (
                      <div className="text-xs text-muted-foreground">
                        {c.min_eligible_items > 0 && `Needs ${c.min_eligible_items}+ qualifying items`}
                        {c.min_eligible_items > 0 && c.excludes_flagged_products && " · "}
                        {c.excludes_flagged_products && "Excludes testosterone & phentermine"}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    {c.used_count}
                    {c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(c.starts_at).toLocaleDateString()} →{" "}
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "No expiry"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                        c.is_active ? "bg-accent/15 text-accent" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => openEdit(c)} className="p-1.5 hover:bg-secondary">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => destroy(c)}
                        className="p-1.5 hover:bg-secondary text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}
