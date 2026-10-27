import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Purpose = Database["public"]["Enums"]["appointment_purpose"];
type Slot = {
  id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  purpose: Purpose;
  is_booked: boolean;
};

export const Route = createFileRoute("/admin/availability")({
  head: () => ({ meta: [{ title: "Availability — Admin" }] }),
  component: AdminAvailabilityPage,
});

function AdminAvailabilityPage() {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);

  // Generation form state
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("19:00");
  const [purpose, setPurpose] = useState<Purpose>("pre_purchase_consult");
  const [saving, setSaving] = useState(false);

  // Availability is unified into 15-minute blocks. Longer visits (e.g. a
  // 30-minute telehealth call) automatically consume consecutive blocks,
  // so a 3-hour opening works for any visit length.
  const SLOT_MINUTES = 15;
  const effectiveDuration = SLOT_MINUTES;
  const fixedDuration: number | null = null;


  const refresh = async () => {
    const { data } = await supabase
      .from("provider_availability_slots")
      .select("id, start_at, end_at, duration_minutes, purpose, is_booked")
      .gte("start_at", new Date().toISOString())
      .order("start_at", { ascending: true })
      .limit(500);
    setSlots((data ?? []) as Slot[]);
  };

  useEffect(() => {
    if (user) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const generate = async () => {
    if (!date) return toast.error("Pick a date");
    const [sh, sm] = startTime.split(":").map(Number);
    const startMin = sh * 60 + sm;

    // Fixed-duration purposes create a single slot from the start time.
    let endMin: number;
    if (fixedDuration) {
      endMin = startMin + fixedDuration;
    } else {
      const [eh, em] = endTime.split(":").map(Number);
      endMin = eh * 60 + em;
      if (endMin <= startMin) return toast.error("End must be after start");
    }

    setSaving(true);
    try {
      const rows: Array<{
        start_at: string;
        end_at: string;
        duration_minutes: number;
        purpose: Purpose;
        provider_user_id: string;
      }> = [];
      for (let m = startMin; m + effectiveDuration <= endMin; m += effectiveDuration) {
        const start = new Date(`${date}T00:00:00`);
        start.setMinutes(m);
        const end = new Date(start.getTime() + effectiveDuration * 60_000);
        rows.push({
          start_at: start.toISOString(),
          end_at: end.toISOString(),
          duration_minutes: effectiveDuration,
          purpose,
          provider_user_id: user!.id,
        });
      }
      const { error } = await supabase.from("provider_availability_slots").insert(rows);
      if (error) throw error;
      toast.success(`Added ${rows.length} slot${rows.length === 1 ? "" : "s"}`);
      setShowAdd(false);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add slots");
    } finally {
      setSaving(false);
    }
  };


  const removeSlot = async (id: string) => {
    if (!window.confirm("Remove this open slot?")) return;
    const { error } = await supabase.from("provider_availability_slots").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  // Standard weekly schedule:
  //  Tuesdays  9:00 AM – 7:00 PM
  //  Saturdays 3:00 PM – 6:00 PM
  //  Sundays   3:00 PM – 6:00 PM
  //  All 15-minute slots.
  const generateStandardWeeks = async (weeks: number) => {
    if (!user) return;
    setBulkSaving(true);
    try {
      const template: Array<{ dow: number; startMin: number; endMin: number }> = [
        { dow: 2, startMin: 9 * 60, endMin: 19 * 60 }, // Tue
        { dow: 6, startMin: 15 * 60, endMin: 18 * 60 }, // Sat
        { dow: 0, startMin: 15 * 60, endMin: 18 * 60 }, // Sun
      ];
      const rows: Array<{
        start_at: string;
        end_at: string;
        duration_minutes: number;
        purpose: Purpose;
        provider_user_id: string;
      }> = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      for (let d = 0; d < weeks * 7; d++) {
        const day = new Date(today);
        day.setDate(today.getDate() + d);
        const match = template.find((t) => t.dow === day.getDay());
        if (!match) continue;
        for (let m = match.startMin; m + 15 <= match.endMin; m += 15) {
          const start = new Date(day);
          start.setMinutes(m);
          if (start.getTime() < Date.now()) continue;
          const end = new Date(start.getTime() + 15 * 60_000);
          rows.push({
            start_at: start.toISOString(),
            end_at: end.toISOString(),
            duration_minutes: 15,
            purpose: "pre_purchase_consult",
            provider_user_id: user.id,
          });
        }
      }
      if (rows.length === 0) {
        toast.info("No new slots to add");
        return;
      }
      const { error } = await supabase.from("provider_availability_slots").insert(rows);
      if (error) throw error;
      toast.success(`Added ${rows.length} standard slots`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add standard slots");
    } finally {
      setBulkSaving(false);
    }
  };


  return (
    <AdminShell
      eyebrow="Scheduling"
      title="Appointment availability"
      actions={
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="inline-flex items-center gap-2 bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent"
        >
          <Plus className="h-4 w-4" /> Generate slots
        </button>
      }
    >
        <div className="border border-border p-6 mb-6 bg-secondary/40">
          <div className="text-xs uppercase tracking-[0.22em] text-muted-foreground mb-2">
            Standard weekly schedule
          </div>
          <p className="text-sm leading-relaxed">
            Appointments are mandatory only for <strong>testosterone (any form)</strong> and{" "}
            <strong>phentermine</strong> (controlled substances). Regular hours are 15-minute slots:
          </p>
          <ul className="mt-3 text-sm space-y-1 text-muted-foreground">
            <li>• Tuesdays — 9:00 AM to 7:00 PM</li>
            <li>• Saturdays — 3:00 PM to 6:00 PM</li>
            <li>• Sundays — 3:00 PM to 6:00 PM (unless otherwise noted)</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              disabled={bulkSaving}
              onClick={() => generateStandardWeeks(4)}
              className="bg-ink text-primary-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] hover:bg-accent disabled:opacity-50"
            >
              {bulkSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Fill next 4 weeks"}
            </button>
            <button
              disabled={bulkSaving}
              onClick={() => generateStandardWeeks(8)}
              className="border border-border px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-accent hover:text-accent disabled:opacity-50"
            >
              Fill next 8 weeks
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Skip any date manually below if it's an exception.
          </p>
        </div>

        {showAdd && (
          <div className="border border-border p-6 mb-8 grid md:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Purpose</Label>
              <Select value={purpose} onValueChange={(v) => setPurpose(v as Purpose)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pre_purchase_consult">Pre-purchase consult</SelectItem>
                  <SelectItem value="telehealth_visit">Zoom call / telehealth visit</SelectItem>
                  <SelectItem value="lab_review">Lab review</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>End time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="md:col-span-2 text-xs text-muted-foreground border border-border bg-secondary/40 px-4 py-3">
              Availability is created in 15-minute blocks from {startTime} to {endTime}. A longer
              visit (for example a 30-minute telehealth call) automatically reserves two back-to-back
              blocks, so you never have to pick a slot length.
            </div>


            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowAdd(false)}
                className="text-xs uppercase tracking-[0.22em] text-muted-foreground"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={generate}
                className="bg-ink text-primary-foreground px-6 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-accent disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
              </button>
            </div>
          </div>
        )}

        {slots === null ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">No upcoming slots. Generate some above.</p>
        ) : (
          <div className="border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs uppercase tracking-[0.18em]">
                <tr>
                  <th className="text-left px-4 py-3">Start</th>
                  <th className="text-left px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Purpose</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      {new Date(s.start_at).toLocaleString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3">{s.duration_minutes} min</td>
                    <td className="px-4 py-3 text-xs uppercase tracking-[0.18em]">{s.purpose.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">
                      {s.is_booked ? (
                        <span className="text-xs bg-accent/10 text-accent px-2 py-0.5">Booked</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Open</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!s.is_booked && (
                        <button
                          onClick={() => removeSlot(s.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
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
