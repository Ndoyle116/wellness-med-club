import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Purpose = Database["public"]["Enums"]["appointment_purpose"];

type Slot = {
  id: string;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  purpose: Purpose;
};

type Props = {
  /** Purpose of the appointment being booked. */
  purpose: Purpose;
  /** Duration filter (minutes). Only slots matching this duration are shown. */
  durationMinutes: number;
  /** Optional order to attach to the booking. */
  orderId?: string | null;
  /** Product this visit is being booked for (visits are per-medication). */
  productId?: string | null;
  /** Optional label / helper text. */
  helper?: string;
  /** Called after a successful booking. */
  onBooked?: (appointmentId: string, slot: Slot) => void;
  /** If already booked, disable further picks and show confirmation. */
  bookedAppointment?: { id: string; scheduled_for: string } | null;
  /** Existing appointment to release when the patient picks a new time. */
  previousAppointmentId?: string | null;
  /** Called when the patient closes the picker without changing anything. */
  onCancelPick?: () => void;
};

function groupByDay(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const day = new Date(s.start_at).toISOString().slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(s);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export function AppointmentPicker({
  purpose,
  durationMinutes,
  orderId = null,
  productId = null,
  helper,
  onBooked,
  bookedAppointment,
  previousAppointmentId = null,
  onCancelPick,
}: Props) {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [policyAck, setPolicyAck] = useState(false);

  useEffect(() => {
    if (bookedAppointment) {
      setSlots([]);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("provider_availability_slots")
        .select("id, start_at, end_at, duration_minutes, purpose")
        .eq("is_booked", false)
        .gt("start_at", new Date().toISOString())
        .order("start_at", { ascending: true })
        .limit(500);
      const open = ((data ?? []) as Slot[]).filter(
        (s) => s.purpose === purpose || s.purpose === "other",
      );

      // Availability is unified: a visit can span consecutive open blocks.
      // Only offer start times that have enough back-to-back availability.
      const byStart = new Map(open.map((s) => [new Date(s.start_at).getTime(), s]));
      const bookable = open.filter((s) => {
        const needUntil = new Date(s.start_at).getTime() + durationMinutes * 60_000;
        let cursor = new Date(s.end_at).getTime();
        while (cursor < needUntil) {
          const next = byStart.get(cursor);
          if (!next) return false;
          cursor = new Date(next.end_at).getTime();
        }
        return true;
      });
      setSlots(bookable);
    })();
  }, [purpose, durationMinutes, bookedAppointment?.id]);

  const grouped = useMemo(() => (slots ? groupByDay(slots) : []), [slots]);

  const book = async () => {
    if (!selected) return;
    if (!policyAck) {
      toast.error("Please acknowledge the cancellation policy");
      return;
    }
    setBooking(true);
    try {
      const { data, error } = await supabase.rpc("book_slot_span", {
        _slot_id: selected,
        _purpose: purpose,
        _duration_minutes: durationMinutes,
        ...(orderId ? { _order_id: orderId } : {}),
        ...(productId ? { _product_id: productId } : {}),
      });


      if (error) throw error;
      if (previousAppointmentId) {
        await supabase.rpc("cancel_appointment", { _appointment_id: previousAppointmentId });
      }
      const slot = slots?.find((s) => s.id === selected);
      if (slot && data) {
        onBooked?.(data as string, slot);
        toast.success("Appointment booked");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  if (bookedAppointment) {
    return (
      <div className="space-y-3">
        <div className="border border-accent/50 bg-accent/5 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium">Appointment booked</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {new Date(bookedAppointment.scheduled_for).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
        <CancellationPolicy />
      </div>
    );
  }

  if (slots === null) {
    return (
      <div className="border border-border p-6 flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="border border-border p-6 text-sm text-muted-foreground text-center">
        No open {durationMinutes}-minute slots right now. Please check back soon or{" "}
        <a href="mailto:Appointments@wellnessmedclub.com" className="underline">
          contact us
        </a>
        .
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="border border-border">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-accent" />
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            {helper ?? `Pick a ${durationMinutes}-min slot`}
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-4 space-y-5">
          {grouped.map(([day, daySlots]) => (
            <div key={day}>
              <div className="text-xs font-medium mb-2">{formatDay(day)}</div>
              <div className="flex flex-wrap gap-2">
                {daySlots.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelected(s.id)}
                    className={`text-xs px-3 py-2 border transition-colors ${
                      selected === s.id
                        ? "bg-ink text-primary-foreground border-ink"
                        : "border-border hover:border-accent hover:text-accent"
                    }`}
                  >
                    {formatTime(s.start_at)}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-border space-y-3">
          <label className="flex items-start gap-2 cursor-pointer text-xs text-foreground">
            <input
              type="checkbox"
              checked={policyAck}
              onChange={(e) => setPolicyAck(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-ink cursor-pointer"
            />
            <span className="leading-relaxed">
              I acknowledge the cancellation policy: no-shows are non-refundable and
              reschedules require at least 24 hours' notice.
            </span>
          </label>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {selected ? "Slot selected" : "Choose a time above"}
              </span>
              {onCancelPick && (
                <button
                  type="button"
                  onClick={onCancelPick}
                  className="text-xs uppercase tracking-[0.18em] text-muted-foreground underline"
                >
                  Cancel
                </button>
              )}
            </div>
            <button
              type="button"
              disabled={!selected || !policyAck || booking}
              onClick={book}
              className="bg-ink text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.22em] hover:bg-accent transition-colors disabled:opacity-50"
            >
              {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Book appointment"}
            </button>
          </div>
        </div>
      </div>
      <CancellationPolicy />
    </div>
  );
}

function CancellationPolicy() {
  return (
    <div className="border border-border bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
      <div className="uppercase tracking-[0.2em] text-[10px] text-foreground mb-1.5">
        Cancellation Policy
      </div>
      <ul className="space-y-1 list-disc pl-4">
        <li>
          <span className="text-foreground font-medium">No-shows are non-refundable.</span>
        </li>
        <li>
          To reschedule, please notify us at least{" "}
          <span className="text-foreground font-medium">24 hours before your appointment</span>.
        </li>
      </ul>
    </div>
  );
}
