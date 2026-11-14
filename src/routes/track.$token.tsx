import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Copy, Droplets, Leaf, MessageSquareHeart, PartyPopper, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Blueprint } from "@/components/adaptfit/blueprint";
import { StageTracker } from "@/components/adaptfit/stage-tracker";
import { Swatch } from "@/components/adaptfit/swatch";
import { Button } from "@/components/ui/button";
import { STAGES, fabricById, garmentLabel, type PatientOrder } from "@/lib/adaptfit";
import { loadOrders, saveOrder } from "@/lib/order-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track/$token")({
  validateSearch: (s: Record<string, unknown>): { welcome?: number } =>
    s.welcome ? { welcome: Number(s.welcome) } : {},
  head: () => ({
    meta: [
      { title: "Your order — AdaptFit" },
      { name: "description", content: "Your private AdaptFit order tracker." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Your order — AdaptFit" },
      { property: "og:description", content: "Your private AdaptFit order tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackDetail,
});

const fmtDate = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function TrackDetail() {
  const { token } = Route.useParams();
  const { welcome } = Route.useSearch();
  const [order, setOrder] = useState<PatientOrder | null | undefined>(undefined);

  useEffect(() => {
    setOrder(loadOrders().find((o) => o.token === token) ?? null);
  }, [token]);

  if (order === undefined) {
    return <div className="container-site py-20" aria-busy="true"><div className="h-64 rounded-[1.75rem] bg-muted" /></div>;
  }
  if (order === null) {
    return (
      <div className="container-site max-w-xl py-24 text-center">
        <h1 className="mb-3 text-4xl font-medium">We couldn't find that order</h1>
        <p className="mb-8 text-muted-foreground">The link may be incomplete. You can look it up with your references instead.</p>
        <Button asChild size="lg"><Link to="/track">Look up my order</Link></Button>
      </div>
    );
  }

  const fabric = fabricById(order.fabricId);
  const update = (o: PatientOrder) => { saveOrder(o); setOrder(o); };

  return (
    <div className="bg-hero">
      <div className="container-site space-y-6 py-12 md:py-16">
        {welcome ? (
          <div className="flex gap-4 rounded-[1.75rem] bg-primary-deep p-6 text-primary-foreground md:p-8" role="status">
            <PartyPopper className="size-8 shrink-0" aria-hidden="true" />
            <div className="space-y-2">
              <h2 className="text-2xl font-medium">Your request is in, {order.firstName}.</h2>
              <p className="text-primary-foreground/80">
                Keep your references safe — together they unlock this page. We've also bookmarked it on this device.
              </p>
            </div>
          </div>
        ) : null}

        {/* Summary */}
        <section className="rounded-[1.75rem] border bg-card p-6 shadow-card md:p-10" aria-labelledby="order-title">
          <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="space-y-2">
              <p className="eyebrow">{STAGES[order.stage].label}</p>
              <h1 id="order-title" className="text-4xl font-medium">{garmentLabel(order.garment)}</h1>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Swatch tone={fabric.swatch} className="size-5" /> {fabric.name}
                {order.targetDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <CalendarDays className="size-4" aria-hidden="true" /> Needed by {fmtDate(order.targetDate)}
                  </>
                )}
              </p>
            </div>
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:shrink-0">
              <RefChip label="Order reference" value={order.orderRef} />
              <RefChip label="Patient ID" value={order.patientRef} />
            </dl>
          </div>
          <StageTracker stage={order.stage} />
        </section>

        <div className="grid gap-6 md:grid-cols-[1.15fr_1fr]">
          <section className="rounded-[1.75rem] border bg-card p-6 shadow-card md:p-8" aria-labelledby="bp-title">
            <h2 id="bp-title" className="mb-1 text-2xl font-medium">Your garment blueprint</h2>
            <p className="mb-6 text-muted-foreground">
              {order.measureAtClinic ? "Measurements will be taken at your clinic visit." : "Designed from your measurements and needs."}
            </p>
            <Blueprint garment={order.garment} accommodations={order.accommodations} />
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] bg-eco-soft p-6 md:p-8" aria-labelledby="eco-title">
              <h2 id="eco-title" className="mb-5 text-2xl font-medium">This garment's impact</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card p-4">
                  <dt className="flex items-center gap-1.5 text-sm font-bold text-eco"><Leaf className="size-4" aria-hidden="true" /> CO₂ prevented</dt>
                  <dd className="font-display text-3xl">{fabric.co2SavedKg} kg</dd>
                </div>
                <div className="rounded-2xl bg-card p-4">
                  <dt className="flex items-center gap-1.5 text-sm font-bold text-eco"><Droplets className="size-4" aria-hidden="true" /> Water saved</dt>
                  <dd className="font-display text-3xl">{fabric.waterSavedL.toLocaleString("en-GB")} L</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">{fabric.name} · {fabric.certification}</p>
            </section>

            <section className="rounded-[1.75rem] border bg-card p-6 shadow-card md:p-8" aria-labelledby="upd-title">
              <h2 id="upd-title" className="mb-5 text-2xl font-medium">Updates from your clinic</h2>
              <ol className="space-y-5 border-l-2 pl-5">
                {[...order.updates].reverse().map((u, i) => (
                  <li key={i} className="relative">
                    <span aria-hidden="true" className={cn("absolute -left-[1.72rem] top-1.5 size-3 rounded-full ring-4 ring-card", i === 0 ? "bg-primary" : "bg-border")} />
                    <p className="text-sm font-bold text-muted-foreground">{fmtDate(u.date)}</p>
                    <p>{u.message}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>
        </div>

        <FeedbackCard order={order} onSave={update} />
      </div>
    </div>
  );
}

function RefChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border bg-muted p-3">
      <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="flex items-center justify-between gap-2">
        <span className="whitespace-nowrap font-mono text-[0.95rem] font-bold">{value}</span>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-card hover:text-primary"
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
          }}
        >
          <Copy className="size-4" aria-hidden="true" />
        </button>
      </dd>
    </div>
  );
}

function FeedbackCard({ order, onSave }: { order: PatientOrder; onSave: (o: PatientOrder) => void }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState<string | null>(null);
  const confirmed = order.feedback.some((f) => f.satisfied);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-[1.75rem] border bg-card p-6 shadow-card md:p-10" aria-labelledby="fb-title">
      <div className="grid gap-8 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <MessageSquareHeart className="size-6" aria-hidden="true" />
          </span>
          <h2 id="fb-title" className="text-3xl font-medium">How does it feel?</h2>
          <p className="text-muted-foreground">
            Tell us about comfort, fit or anything that's not quite right. Your clinic reads every message.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!message.trim()) return;
            onSave({ ...order, feedback: [...order.feedback, { date: today, message: message.trim() }] });
            setMessage("");
            setSent("Thank you — your message has been sent to your clinic.");
          }}
        >
          <label htmlFor="fb" className="block font-bold">Your message</label>
          <textarea id="fb" rows={4} className="field min-h-28" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. The left sleeve feels a little tight at the wrist." />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" disabled={!message.trim()}>Send feedback</Button>
            <Button
              type="button"
              size="lg"
              variant={confirmed ? "soft" : "outline"}
              disabled={confirmed}
              onClick={() => {
                onSave({ ...order, feedback: [...order.feedback, { date: today, message: "Fitting confirmed — happy with my garment.", satisfied: true }] });
                setSent("Wonderful — we've let your clinic know you're happy with the fit.");
              }}
            >
              <ThumbsUp aria-hidden="true" /> {confirmed ? "Fit confirmed" : "I'm happy with the fit"}
            </Button>
          </div>
          <p aria-live="polite" className={sent ? "rounded-xl bg-eco-soft px-4 py-3 font-bold text-eco" : "sr-only"}>{sent}</p>
        </form>
      </div>
    </section>
  );
}
