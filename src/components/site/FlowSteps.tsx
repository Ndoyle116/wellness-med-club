import type { ReactNode } from "react";

export type FlowStep = {
  n: string;
  title: string;
  body: ReactNode;
};

export function FlowSteps({ steps }: { steps: FlowStep[] }) {
  return (
    <ol className="relative border-l-2 border-border ml-3">
      {steps.map((s) => (
        <li key={s.n} className="mb-10 ml-6">
          <span className="absolute -left-4 flex items-center justify-center w-8 h-8 bg-ink text-primary-foreground font-serif text-xs">
            {s.n}
          </span>
          <h3 className="font-serif text-xl">{s.title}</h3>
          <div className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</div>
        </li>
      ))}
    </ol>
  );
}

export function AcknowledgmentBox({ children }: { children: ReactNode }) {
  return (
    <div className="border border-accent/40 bg-accent/5 p-6 mt-12">
      <h3 className="font-serif text-lg mb-3">Important Patient Acknowledgment</h3>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}
