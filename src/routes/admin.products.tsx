import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Save, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import {
  adminListProducts,
  adminSyncStripePrices,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/admin-products.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/products")({
  head: () => ({ meta: [{ title: "Products — Admin" }] }),
  component: AdminProductsPage,
});

type Category = "vitamins" | "peptides" | "lab_panel" | "hormone_trt" | "controlled" | "non_fda" | "telehealth_visit" | "dermatology" | "intimacy" | "erectile_dysfunction";
type Pharmacy = "olympia" | "rush" | "empower" | "strive" | "other";

const CATEGORY_LABEL: Record<Category, string> = {
  vitamins: "Vitamins",
  peptides: "Peptides",
  lab_panel: "Lab Panel",
  hormone_trt: "Hormone / TRT",
  controlled: "Medical Weight Loss (controlled)",
  non_fda: "Non-FDA Supplement",
  telehealth_visit: "Telehealth Visit",
  dermatology: "Dermatology",
  intimacy: "Intimacy",
  erectile_dysfunction: "Erectile Dysfunction",
};

const PHARMACY_LABEL: Record<Pharmacy, string> = {
  olympia: "Olympia",
  rush: "Rush",
  empower: "Empower",
  strive: "Strive",
  other: "Other",
};


type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  description: string | null;
  intended_use: string | null;
  risks: string | null;
  price_cents: number;
  requires_labs: boolean;
  requires_consultation: boolean;
  is_controlled: boolean;
  active: boolean;
  image_url: string | null;
  pharmacy: Pharmacy | null;
  supplies_available: boolean;
  supplies_price_cents: number;
  telehealth_addon_available: boolean;
  telehealth_addon_price_cents: number;
};

const blank = (): Omit<Product, "id"> => ({
  slug: "",
  name: "",
  category: "vitamins",
  description: "",
  intended_use: "",
  risks: "",
  price_cents: 0,
  requires_labs: false,
  requires_consultation: false,
  is_controlled: false,
  active: true,
  image_url: null,
  pharmacy: null,
  supplies_available: false,
  supplies_price_cents: 2500,
  telehealth_addon_available: false,
  telehealth_addon_price_cents: 5000,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function AdminProductsPage() {
  const { user, isAdmin } = useAuth();
  const list = useServerFn(adminListProducts);
  const create = useServerFn(adminCreateProduct);
  const update = useServerFn(adminUpdateProduct);
  const remove = useServerFn(adminDeleteProduct);
  const syncPrices = useServerFn(adminSyncStripePrices);
  const [syncing, setSyncing] = useState(false);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [editing, setEditing] = useState<Product | (Omit<Product, "id"> & { id?: string }) | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const res = await list({ data: undefined as unknown as never });
    setProducts(res.products as Product[]);
  };

  useEffect(() => {
    if (user && isAdmin) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        slug: editing.slug || slugify(editing.name),
        category: editing.category,
        description: editing.description || null,
        intended_use: editing.intended_use || null,
        risks: editing.risks || null,
        price_cents: Math.round(Number(editing.price_cents) || 0),
        requires_labs: !!editing.requires_labs,
        requires_consultation: !!editing.requires_consultation,
        is_controlled: !!editing.is_controlled,
        active: !!editing.active,
        image_url: editing.image_url || null,
        pharmacy: editing.pharmacy ?? null,
        supplies_available: !!editing.supplies_available,
        supplies_price_cents: Math.round(Number(editing.supplies_price_cents) || 0),
        telehealth_addon_available: !!editing.telehealth_addon_available,
        telehealth_addon_price_cents: Math.round(Number(editing.telehealth_addon_price_cents) || 0),
      };
      const res =
        "id" in editing && editing.id
          ? await update({ data: { id: editing.id, ...payload } })
          : await create({ data: payload });
      if (!res.ok) {
        toast.error(res.error ?? "Failed to save");
      } else {
        if ("warning" in res && res.warning) toast.warning(res.warning);
        else toast.success("Product saved");
        setEditing(null);
        await refresh();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Deactivate this product? It will be hidden from customers.")) return;
    try {
      await remove({ data: { id } });
      toast.success("Product deactivated");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <AdminShell
      eyebrow="Catalog"
      title="Products & pricing"
      actions={
        <div className="flex items-center gap-2">
        <button
          onClick={async () => {
            setSyncing(true);
            try {
              const res = await syncPrices({ data: undefined } as never);
              if (res.ok) toast.success(`Synced ${res.synced} prices to payments`);
              else toast.warning(`Synced ${res.synced}; ${res.failures.length} failed`);
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Sync failed");
            } finally {
              setSyncing(false);
            }
          }}
          disabled={syncing}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Sync prices
        </button>
        <button
          onClick={() => setEditing(blank())}
          className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent"
        >
          <Plus className="h-4 w-4" /> Add product
        </button>
        </div>
      }
    >
      <div className="bg-background border border-border overflow-x-auto">
        {!products ? (
          <div className="py-20 grid place-items-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-[0.18em]">
                <tr>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-left px-4 py-3">Pharmacy</th>
                  <th className="text-left px-4 py-3">Flags</th>
                  <th className="text-right px-4 py-3">Price</th>
                  <th className="text-center px-4 py-3">Active</th>
                  <th className="text-right px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[0.18em]">
                      {CATEGORY_LABEL[p.category]}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {p.pharmacy ? (
                        <span className="inline-block border border-border px-2 py-0.5 uppercase tracking-[0.16em] text-[10px]">
                          {PHARMACY_LABEL[p.pharmacy]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {[
                        p.requires_labs && "Labs",
                        p.requires_consultation && "Consult",
                        p.is_controlled && "Rx",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-serif">
                      ${(p.price_cents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`text-[10px] uppercase tracking-[0.18em] px-2 py-1 ${
                          p.active ? "bg-accent/10 text-accent" : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {p.active ? "Live" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditing(p)}
                        className="text-xs uppercase tracking-[0.18em] underline-offset-2 hover:underline mr-3"
                      >
                        Edit
                      </button>
                      {p.active && (
                        <button
                          onClick={() => onDelete(p.id)}
                          className="text-xs uppercase tracking-[0.18em] text-muted-foreground hover:text-destructive"
                        >
                          Hide
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-ink/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div className="bg-background w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-serif text-xl">
                {"id" in editing && editing.id ? "Edit product" : "Add product"}
              </h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:text-accent">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 grid gap-4">
              <Field label="Name">
                <input
                  className="w-full border border-border px-3 py-2"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            name: e.target.value,
                            slug:
                              ("id" in prev && prev.id) || prev.slug
                                ? prev.slug
                                : slugify(e.target.value),
                          }
                        : prev,
                    )
                  }
                />
              </Field>
              <Field label="Slug (URL)">
                <input
                  className="w-full border border-border px-3 py-2 font-mono text-sm"
                  value={editing.slug}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, slug: slugify(e.target.value) } : prev))
                  }
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Category">
                  <select
                    className="w-full border border-border px-3 py-2 bg-background"
                    value={editing.category}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev ? { ...prev, category: e.target.value as Category } : prev,
                      )
                    }
                  >
                    {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABEL[c]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Price (USD)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full border border-border px-3 py-2"
                    value={(editing.price_cents / 100).toString()}
                    onChange={(e) =>
                      setEditing((prev) =>
                        prev
                          ? { ...prev, price_cents: Math.round(parseFloat(e.target.value || "0") * 100) }
                          : prev,
                      )
                    }
                  />
                </Field>
              </div>
              <Field label="Pharmacy (internal — not shown to customers)">
                <select
                  className="w-full border border-border px-3 py-2 bg-background"
                  value={editing.pharmacy ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev
                        ? {
                            ...prev,
                            pharmacy: e.target.value ? (e.target.value as Pharmacy) : null,
                          }
                        : prev,
                    )
                  }
                >
                  <option value="">— none —</option>
                  {(Object.keys(PHARMACY_LABEL) as Pharmacy[]).map((k) => (
                    <option key={k} value={k}>
                      {PHARMACY_LABEL[k]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Description">
                <textarea
                  rows={4}
                  className="w-full border border-border px-3 py-2"
                  value={editing.description ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, description: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Intended use">
                <textarea
                  rows={2}
                  className="w-full border border-border px-3 py-2"
                  value={editing.intended_use ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, intended_use: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Risks / warnings">
                <textarea
                  rows={2}
                  className="w-full border border-border px-3 py-2"
                  value={editing.risks ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => (prev ? { ...prev, risks: e.target.value } : prev))
                  }
                />
              </Field>
              <Field label="Image URL (optional)">
                <input
                  className="w-full border border-border px-3 py-2"
                  value={editing.image_url ?? ""}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, image_url: e.target.value || null } : prev,
                    )
                  }
                />
              </Field>
              <div className="grid sm:grid-cols-2 gap-2">
                <Toggle
                  label="Requires labs"
                  checked={editing.requires_labs}
                  onChange={(v) =>
                    setEditing((prev) => (prev ? { ...prev, requires_labs: v } : prev))
                  }
                />
                <Toggle
                  label="Requires consultation"
                  checked={editing.requires_consultation}
                  onChange={(v) =>
                    setEditing((prev) => (prev ? { ...prev, requires_consultation: v } : prev))
                  }
                />
                <Toggle
                  label="Controlled / Rx"
                  checked={editing.is_controlled}
                  onChange={(v) =>
                    setEditing((prev) => (prev ? { ...prev, is_controlled: v } : prev))
                  }
                />
                <Toggle
                  label="Active (visible to customers)"
                  checked={editing.active}
                  onChange={(v) => setEditing((prev) => (prev ? { ...prev, active: v } : prev))}
                />
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Optional add-ons offered on product page
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Toggle
                      label="Offer supplies kit ($ below)"
                      checked={editing.supplies_available}
                      onChange={(v) =>
                        setEditing((prev) => (prev ? { ...prev, supplies_available: v } : prev))
                      }
                    />
                    <Field label="Supplies price (USD)">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border border-border px-3 py-2"
                        value={(editing.supplies_price_cents / 100).toString()}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  supplies_price_cents: Math.round(
                                    parseFloat(e.target.value || "0") * 100,
                                  ),
                                }
                              : prev,
                          )
                        }
                      />
                    </Field>
                  </div>
                  <div>
                    <Toggle
                      label="Offer optional tele-visit"
                      checked={editing.telehealth_addon_available}
                      onChange={(v) =>
                        setEditing((prev) =>
                          prev ? { ...prev, telehealth_addon_available: v } : prev,
                        )
                      }
                    />
                    <Field label="Tele-visit price (USD)">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border border-border px-3 py-2"
                        value={(editing.telehealth_addon_price_cents / 100).toString()}
                        onChange={(e) =>
                          setEditing((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  telehealth_addon_price_cents: Math.round(
                                    parseFloat(e.target.value || "0") * 100,
                                  ),
                                }
                              : prev,
                          )
                        }
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-xs uppercase tracking-[0.18em] border border-border hover:border-accent"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.18em] hover:bg-accent disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 border border-border px-3 py-2 cursor-pointer hover:border-accent">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
