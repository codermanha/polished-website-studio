import { Check } from "lucide-react";

import { STAGES } from "@/lib/adaptfit";
import { cn } from "@/lib/utils";

export function StageTracker({ stage }: { stage: number }) {
  return (
    <ol className="grid gap-0 sm:grid-cols-6" aria-label="Order progress">
      {STAGES.map((s, i) => {
        const done = i < stage;
        const current = i === stage;
        return (
          <li
            key={s.id}
            className="relative flex gap-4 pb-6 last:pb-0 sm:flex-col sm:items-center sm:gap-3 sm:pb-0 sm:text-center"
            aria-current={current ? "step" : undefined}
          >
            {i < STAGES.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-5 top-11 h-[calc(100%-2.75rem)] w-0.5 sm:left-[calc(50%+1.5rem)] sm:top-5 sm:h-0.5 sm:w-[calc(100%-3rem)]",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-2 text-sm font-bold",
                done && "border-primary bg-primary text-primary-foreground",
                current && "border-primary bg-card text-primary ring-4 ring-primary/15",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? <Check className="size-5" aria-hidden="true" /> : i + 1}
            </span>
            <span>
              <span className={cn("block font-bold leading-tight", !done && !current && "text-muted-foreground")}>
                {s.label}
              </span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                {done ? "Complete" : current ? "In progress" : s.detail}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
