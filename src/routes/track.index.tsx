import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, KeyRound, Lock } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { DEMO_ORDER, findOrderByRefs, odooRecordToPatientOrder } from "@/lib/adaptfit";
import { lookupOrderInOdoo } from "@/lib/odoo-bridge";
import { loadOrders, saveOrder } from "@/lib/order-store";

export const Route = createFileRoute("/track/")({
  head: () => ({
    meta: [
      { title: "Track my order — AdaptFit" },
      { name: "description", content: "Find your adaptive garment using your order and patient reference." },
      { property: "og:title", content: "Track my order — AdaptFit" },
      { property: "og:description", content: "Follow every stage of your AdaptFit garment, from review to fitting." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackLookup,
});

function TrackLookup() {
  const navigate = useNavigate();
  const [orderRef, setOrderRef] = useState("");
  const [patientRef, setPatientRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="bg-hero">
      <div className="container-site grid gap-10 py-14 md:grid-cols-[1fr_1.1fr] md:py-20">
        <div className="space-y-5">
          <p className="eyebrow">Track my order</p>
          <h1 className="text-4xl font-medium md:text-5xl">See how your garment is coming along</h1>
          <p className="text-lg text-muted-foreground">
            Use the private link in your email, or enter both references below. You'll find them on your confirmation.
          </p>
          <div className="flex gap-3 rounded-2xl border bg-card p-4 text-sm">
            <Lock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p>For your privacy, both references must match the same order. Clinical notes are never shown here.</p>
          </div>
        </div>

        <form
          className="space-y-5 self-start rounded-[1.75rem] border bg-card p-6 shadow-card md:p-8"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const res = await lookupOrderInOdoo({ data: { orderRef, patientRef } });
            if (res.ok && res.order) {
              const mapped = odooRecordToPatientOrder(res.order);
              saveOrder(mapped);
              navigate({ to: "/track/$token", params: { token: mapped.token } });
              return;
            }
            const match = findOrderByRefs(loadOrders(), orderRef, patientRef);
            if (!match) {
              setError("We couldn't find an order with those details. Please check both references and try again.");
              return;
            }
            navigate({ to: "/track/$token", params: { token: match.token } });
          }}
        >
          <span className="grid size-12 place-items-center rounded-xl bg-secondary text-primary">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <label htmlFor="orderRef" className="block font-bold">Order reference</label>
            <input id="orderRef" className="field font-mono uppercase" placeholder="AD-1049" value={orderRef} onChange={(e) => setOrderRef(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <label htmlFor="patientRef" className="block font-bold">Patient reference ID</label>
            <input id="patientRef" className="field font-mono uppercase" placeholder="PT-8042" value={patientRef} onChange={(e) => setPatientRef(e.target.value)} autoComplete="off" />
          </div>
          <p role="alert" aria-live="polite" className={error ? "rounded-xl bg-destructive/10 px-4 py-3 font-bold text-destructive" : "sr-only"}>
            {error}
          </p>
          <Button type="submit" size="lg" className="w-full">
            Find my order <ArrowRight aria-hidden="true" />
          </Button>
          <div className="space-y-2 border-t pt-4 text-sm text-muted-foreground">
            <p>
              Try live Odoo 19 orders:{" "}
              <button
                type="button"
                className="font-bold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setOrderRef("AD-1049");
                  setPatientRef("PT-8042");
                }}
              >
                AD-1049 · PT-8042
              </button>{" "}
              or{" "}
              <button
                type="button"
                className="font-bold text-primary underline-offset-4 hover:underline"
                onClick={() => {
                  setOrderRef("AD-1050");
                  setPatientRef("PT-8043");
                }}
              >
                AD-1050 · PT-8043
              </button>
            </p>
            <p>
              Or view the{" "}
              <Link to="/track/$token" params={{ token: DEMO_ORDER.token }} className="font-bold text-primary underline-offset-4 hover:underline">
                offline sample order
              </Link>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
