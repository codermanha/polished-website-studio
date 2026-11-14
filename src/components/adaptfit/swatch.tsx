import type { Fabric } from "@/lib/adaptfit";
import { cn } from "@/lib/utils";

const SWATCH: Record<Fabric["swatch"], string> = {
  cream: "bg-accent",
  sage: "bg-eco-soft",
  teal: "bg-primary-deep",
  stone: "bg-muted",
};

export function Swatch({ tone, className }: { tone: Fabric["swatch"]; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block rounded-full border-2 border-card shadow-card", SWATCH[tone], className)}
    />
  );
}
