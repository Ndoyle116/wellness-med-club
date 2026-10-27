import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { listMyMessages, sendPatientMessage } from "@/lib/messages.functions";
import { useRequireAuth, PortalLoading, PortalError } from "@/lib/use-require-auth";
import { toast } from "sonner";

type Message = {
  id: string;
  sender_role: "patient" | "staff";
  body: string;
  created_at: string;
};

export const Route = createFileRoute("/account_/messages")({
  head: () => ({ meta: [{ title: "Messages — Wellness Med Club" }] }),
  component: MessagesPage,
});

function MessagesPage() {
  const { ready } = useRequireAuth();
  const listFn = useServerFn(listMyMessages);
  const sendFn = useServerFn(sendPatientMessage);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = () => {
    setLoadError(false);
    return listFn()
      .then((r) => setMessages(r.messages as Message[]))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    if (ready) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);


  const send = async () => {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    try {
      await sendFn({ data: { body: text } });
      setBody("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  if (!ready) {
    return (
      <SiteLayout>
        <PortalLoading />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
          My account
        </div>
        <h1 className="font-serif text-4xl mb-2">Messages</h1>
        <p className="text-sm text-muted-foreground mb-8">
          Secure two-way messaging with our clinical team. Please allow up to 24
          hours for a reply.
        </p>

        <div className="border border-border bg-background flex flex-col h-[65vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadError ? (
              <PortalError
                message="We couldn't load your messages right now."
                onRetry={load}
              />
            ) : !messages ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No messages yet. Send us a note and we'll get back to you.
              </p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.sender_role === "patient" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] px-3 py-2 text-sm ${
                      m.sender_role === "patient"
                        ? "bg-ink text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.body}</div>
                    <div className="text-[10px] opacity-70 mt-1">
                      {new Date(m.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>
          <div className="border-t border-border p-3 flex gap-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write a message…"
              rows={2}
              className="flex-1 border border-border p-2 text-sm resize-none"
            />
            <button
              onClick={send}
              disabled={sending || !body.trim()}
              className="px-4 bg-ink text-primary-foreground text-xs uppercase tracking-[0.18em] font-semibold disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
