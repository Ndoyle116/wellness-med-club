import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * GET /api/public/availability
 *
 * Read-only JSON feed of open appointment start times.
 * Query params:
 *   - purpose: pre_purchase_consult | telehealth_visit | lab_review | other
 *   - days:    lookahead window in days (default 30, max 90)
 *   - limit:   max rows (default 200, max 500)
 */
export const Route = createFileRoute("/api/public/availability")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const purpose = url.searchParams.get("purpose");
        const allowedPurposes = new Set([
          "pre_purchase_consult",
          "telehealth_visit",
          "lab_review",
          "other",
        ]);
        const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 90);
        const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 200, 1), 500);

        const supabase = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
        );

        const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

        let query = supabase
          .from("provider_availability_slots")
          .select("start_at, end_at, duration_minutes, purpose")
          .eq("is_booked", false)
          .gt("start_at", new Date().toISOString())
          .lte("start_at", until)
          .order("start_at", { ascending: true })
          .limit(limit);

        if (purpose && allowedPurposes.has(purpose)) {
          type Purpose = Database["public"]["Enums"]["appointment_purpose"];
          query = query.in("purpose", [purpose as Purpose, "other"]);
        }

        const { data, error } = await query;
        if (error) {
          return Response.json({ error: "Failed to load availability" }, { status: 500 });
        }

        return Response.json(
          {
            timezone: "America/Los_Angeles",
            generated_at: new Date().toISOString(),
            slots: (data ?? []).map((s) => ({
              start_at: s.start_at,
              end_at: s.end_at,
              duration_minutes: s.duration_minutes,
              purpose: s.purpose,
            })),
          },
          { headers: { "Cache-Control": "public, max-age=60" } },
        );
      },
    },
  },
});
