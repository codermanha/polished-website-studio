import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock, Copy, Droplets, ExternalLink, Leaf, MessageSquareHeart, PartyPopper, ShieldCheck, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";

import { Blueprint } from "@/components/adaptfit/blueprint";
import { StageTracker } from "@/components/adaptfit/stage-tracker";
import { Swatch } from "@/components/adaptfit/swatch";
import { Button } from "@/components/ui/button";
import { STAGES, fabricById, garmentLabel, odooRecordToPatientOrder, type PatientOrder } from "@/lib/adaptfit";
import { fetchOrderByOdooId, postOrderFeedbackToOdoo } from "@/lib/odoo-bridge";
import { loadOrders, saveOrder } from "@/lib/order-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/track/$token")({
  validateSearch: (s: Record<string, unknown>): { welcome?: number } =>
    s["welcome"] ? { welcome: Number(s["welcome"]) } : {},
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
    const local = loadOrders().find((o) => o.token === token) ?? null;
    if (token.startsWith("odoo-")) {
      const id = Number(token.slice(5));
      if (!Number.isNaN(id) && id > 0) {
        fetchOrderByOdooId({ data: { id } }).then((res) => {
          if (res.ok && res.order) {
            const mapped = odooRecordToPatientOrder(res.order, local?.firstName || "Patient");
            saveOrder(mapped);
            setOrder(mapped);
          } else {
            setOrder(local);
          }
        });
        return;
      }
    }
    setOrder(local);
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
              <div className="flex flex-wrap items-center gap-2">
                <p className="eyebrow">{STAGES[order.stage]?.label}</p>
                {order.odooId && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-eco-soft px-3 py-0.5 text-xs font-bold text-eco">
                    <ShieldCheck className="size-3.5" aria-hidden="true" /> Synced with Odoo 19
                  </span>
                )}
              </div>
              <h1 id="order-title" className="text-4xl font-medium">{garmentLabel(order.garment)}</h1>
              <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
                <Swatch tone={fabric.swatch} className="size-5" /> {order.fabricName ?? fabric.name}
                {order.targetDate && (
                  <>
                    <span aria-hidden="true">·</span>
                    <CalendarDays className="size-4" aria-hidden="true" /> Needed by {fmtDate(order.targetDate)}
                  </>
                )}
                {order.odooId && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={`http://localhost:8069/adaptfit/artisan/${order.odooId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-primary hover:underline"
                    >
                      ArtisanChat <ExternalLink className="size-3.5" aria-hidden="true" />
                    </a>
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
            <Blueprint garment={order.garment} accommodations={order.accommodations} odooSvg={order.odooSvg} />
          </section>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] bg-eco-soft p-6 md:p-8" aria-labelledby="eco-title">
              <h2 id="eco-title" className="mb-5 text-2xl font-medium">This garment's impact</h2>
              <dl className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-card p-4">
                  <dt className="flex items-center gap-1.5 text-sm font-bold text-eco"><Leaf className="size-4" aria-hidden="true" /> CO₂ prevented</dt>
                  <dd className="font-display text-3xl">{(order.co2SavedKg ?? fabric.co2SavedKg).toFixed(1)} kg</dd>
                </div>
                <div className="rounded-2xl bg-card p-4">
                  <dt className="flex items-center gap-1.5 text-sm font-bold text-eco"><Droplets className="size-4" aria-hidden="true" /> Water saved</dt>
                  <dd className="font-display text-3xl">{Math.round(order.waterSavedL ?? fabric.waterSavedL).toLocaleString("en-GB")} L</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm text-muted-foreground">
                {order.fabricName ?? fabric.name} · {order.yardageM ? `${order.yardageM.toFixed(2)} m allocated` : fabric.certification}
              </p>
            </section>

            {order.qaChecks && order.qaChecks.length > 0 && (
              <section className="rounded-[1.75rem] border bg-card p-6 shadow-card md:p-8" aria-labelledby="qa-title">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h2 id="qa-title" className="text-2xl font-medium">4-Point Clinical QA</h2>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                      order.qaChecks[0]!.state === "passed"
                        ? "bg-eco-soft text-eco"
                        : order.qaChecks[0]!.state === "rework"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {order.qaChecks[0]!.state === "passed" ? (
                      <><CheckCircle2 className="size-3.5" aria-hidden="true" /> Passed</>
                    ) : order.qaChecks[0]!.state === "rework" ? (
                      <><AlertTriangle className="size-3.5" aria-hidden="true" /> Rework Needed</>
                    ) : (
                      <><Clock className="size-3.5" aria-hidden="true" /> Pending Audit</>
                    )}
                  </span>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    ["Tactile Seam Audit (Zero Chafing)", order.qaChecks[0]!.tactile_seam_audit],
                    ["Magnetic Polarity & One-Handed Snap", order.qaChecks[0]!.magnetic_polarity_test],
                    ["Port Access Clearance Verified", order.qaChecks[0]!.port_access_clearance],
                    ["Asymmetric Tolerance (±0.25 in)", order.qaChecks[0]!.asymmetric_tolerance_ok],
                  ].map(([label, ok]) => (
                    <li key={String(label)} className="flex items-center justify-between rounded-xl border px-3 py-2">
                      <span>{label}</span>
                      <span className={ok ? "font-bold text-eco" : "text-muted-foreground"}>{ok ? "Verified" : "Pending"}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

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

        <FeedbackCard
          order={order}
          onSave={update}
          onRefreshFromOdoo={async () => {
            if (!order.odooId) return;
            const res = await fetchOrderByOdooId({ data: { id: order.odooId } });
            if (res.ok && res.order) {
              update(odooRecordToPatientOrder(res.order, order.firstName));
            }
          }}
        />
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

function FeedbackCard({
  order,
  onSave,
  onRefreshFromOdoo,
}: {
  order: PatientOrder;
  onSave: (o: PatientOrder) => void;
  onRefreshFromOdoo: () => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const confirmed = order.feedback.some((f) => f.satisfied);
  const today = new Date().toISOString().slice(0, 10);

  const sendFeedback = async (text: string, satisfied?: boolean) => {
    setSending(true);
    try {
      if (order.odooId) {
        const res = await postOrderFeedbackToOdoo({
          data: { orderId: order.odooId, message: text, satisfied },
        });
        if (res.ok) {
          await onRefreshFromOdoo();
        }
      }
      onSave({
        ...order,
        feedback: [...order.feedback, { date: today, message: text, satisfied }],
        updates: order.odooId
          ? order.updates
          : [...order.updates, { date: today, message: text }],
      });
      setSent(
        satisfied
          ? "Wonderful — we've recorded your fit confirmation in Odoo 19."
          : "Thank you — your message has been posted to your clinic's Odoo chatter.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="rounded-[1.75rem] border bg-card p-6 shadow-card md:p-10" aria-labelledby="fb-title">
      <div className="grid gap-8 md:grid-cols-[1fr_1.3fr]">
        <div className="space-y-3">
          <span className="grid size-12 place-items-center rounded-xl bg-accent text-accent-foreground">
            <MessageSquareHeart className="size-6" aria-hidden="true" />
          </span>
          <h2 id="fb-title" className="text-3xl font-medium">How does it feel?</h2>
          <p className="text-muted-foreground">
            Tell us about comfort, fit or anything that's not quite right. Your clinic reads every message directly in Odoo.
          </p>
        </div>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!message.trim() || sending) return;
            const text = message.trim();
            setMessage("");
            await sendFeedback(text);
          }}
        >
          <label htmlFor="fb" className="block font-bold">Your message</label>
          <textarea id="fb" rows={4} className="field min-h-28" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="e.g. The left sleeve feels a little tight at the wrist." />
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="lg" disabled={!message.trim() || sending}>
              {sending ? "Sending..." : "Send feedback"}
            </Button>
            <Button
              type="button"
              size="lg"
              variant={confirmed ? "soft" : "outline"}
              disabled={confirmed || sending}
              onClick={() => sendFeedback("Fitting confirmed — happy with my garment.", true)}
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
