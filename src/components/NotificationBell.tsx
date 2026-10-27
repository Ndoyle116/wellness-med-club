import { ArrowRight, Bell, CheckCheck, Loader2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNotifications, timeAgo, type AppNotification } from "@/lib/use-notifications";
import { useAuth } from "@/lib/auth-context";

export function NotificationBell({
  audience,
  align = "end",
}: {
  audience?: "patient" | "staff";
  align?: "start" | "center" | "end";
}) {
  const { user } = useAuth();
  const { items, unread, loading, markRead, markAllRead } = useNotifications(audience);
  const navigate = useNavigate();

  if (!user) return null;

  const open = async (n: AppNotification) => {
    if (!n.read_at) await markRead(n.id);
    if (n.link) navigate({ to: n.link as never });
  };

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center p-3 hover:text-accent transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-accent text-primary-foreground text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Notifications
          </span>
          {unread > 0 && (
            <button
              onClick={() => markAllRead()}
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">
              You're all caught up.
            </p>
          ) : (
            items.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/60 transition-colors ${
                  n.read_at ? "" : "bg-accent/5"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${
                      n.read_at ? "bg-transparent" : "bg-accent"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-snug">{n.title}</div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    {n.type === "approval_approved" && n.link && (
                      <span className="mt-2 inline-flex items-center gap-1 bg-foreground text-background px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] font-semibold">
                        Move forward with your purchase
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    )}
                    <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-1">
                      {timeAgo(n.created_at)}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
