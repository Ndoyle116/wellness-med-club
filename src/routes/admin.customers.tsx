import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Search, Mail, AlertCircle, MessageSquare } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { adminListCustomers } from "@/lib/approvals.functions";
import { CustomerDetailDrawer } from "@/components/admin/CustomerDetailDrawer";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({ meta: [{ title: "Customers — Admin" }] }),
  component: AdminCustomersPage,
});

type Customer = {
  user_id: string;
  email: string;
  name: string;
  phone: string | null;
  pending_approvals: number;
  unread_messages: number;
  created_at: string;
};

function AdminCustomersPage() {
  const listFn = useServerFn(adminListCustomers);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [search, setSearch] = useState("");
  const [openUserId, setOpenUserId] = useState<string | null>(null);

  useEffect(() => {
    listFn({ data: { search: "" } }).then((r) => setCustomers(r.customers as Customer[]));
  }, [listFn]);

  const filtered = useMemo(() => {
    if (!customers) return null;
    const t = search.trim().toLowerCase();
    if (!t) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(t) || c.email.toLowerCase().includes(t),
    );
  }, [customers, search]);

  return (
    <AdminShell title="Customers" eyebrow="Patient management">
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email"
          className="w-full pl-9 pr-3 py-2 border border-border bg-background text-sm"
        />
      </div>

      {!filtered ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading customers…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No customers match your search.</p>
      ) : (
        <div className="border border-border bg-background overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Patient</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Pending approvals</th>
                <th className="text-left px-4 py-3">Unread messages</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.user_id}
                  onClick={() => setOpenUserId(c.user_id)}
                  className="border-t border-border cursor-pointer hover:bg-secondary/30"
                >
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {c.email}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.pending_approvals > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 text-xs font-semibold">
                        <AlertCircle className="h-3 w-3" />
                        {c.pending_approvals} pending
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.unread_messages > 0 ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-semibold">
                        <MessageSquare className="h-3 w-3" />
                        {c.unread_messages}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {openUserId && (
        <CustomerDetailDrawer
          userId={openUserId}
          onClose={() => setOpenUserId(null)}
          onChanged={() =>
            listFn({ data: { search: "" } }).then((r) =>
              setCustomers(r.customers as Customer[]),
            )
          }
        />
      )}
    </AdminShell>
  );
}
