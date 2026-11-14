import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Droplets, Leaf, Magnet, Ruler, ShieldCheck, Sparkles, Syringe } from "lucide-react";
import { useEffect, useState } from "react";

import detailImg from "@/assets/detail-closures.jpg";
import fabricsImg from "@/assets/fabrics.jpg";
import heroImg from "@/assets/hero-adaptive.jpg";
import { Swatch } from "@/components/adaptfit/swatch";
import { Button } from "@/components/ui/button";
import { COMMUNITY_BASELINE, FABRICS, fabricById, odooFabricToFabric, type Fabric } from "@/lib/adaptfit";
import { fetchOdooFabrics, fetchOdooImpact } from "@/lib/odoo-bridge";
import { loadOrders } from "@/lib/order-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AdaptFit — Adaptive clothing, tailored with dignity" },
      {
        name: "description",
        content:
          "Magnetic closures, concealed port access and asymmetric fit — adaptive clothing made from certified sustainable fabrics.",
      },
      { property: "og:title", content: "AdaptFit — Adaptive clothing, tailored with dignity" },
      {
        property: "og:description",
        content: "Adaptive clothing made for your body and your care, in certified sustainable fabrics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const FEATURES = [
  {
    icon: Magnet,
    title: "One-handed magnetic closures",
    body: "Hidden magnets behind a classic button look. Close your shirt with one hand, in seconds.",
  },
  {
    icon: Syringe,
    title: "Concealed medical port access",
    body: "A discreet two-way zipper lets nurses reach your port while you stay comfortably dressed.",
  },
  {
    icon: Sparkles,
    title: "Zero-friction seams",
    body: "Flat-lock seams and printed labels — nothing rubs, scratches or presses on sensitive skin.",
  },
  {
    icon: Ruler,
    title: "Asymmetric body fit",
    body: "Each side is measured and cut on its own, so your garment fits the body you actually have.",
  },
];

const STEPS = [
  { n: "01", title: "Tell us about you", body: "A short guided form — or we can measure you at the clinic." },
  { n: "02", title: "We design your garment", body: "Our clinical advisor recommends features; a clinician confirms." },
  { n: "03", title: "Crafted & fitted", body: "Follow every stage online, then confirm the fit is just right." },
];

function useImpact() {
  const [impact, setImpact] = useState({ ...COMMUNITY_BASELINE, syncedOdoo: false });
  useEffect(() => {
    const local = loadOrders().slice(1);
    const localStats = {
      delivered: COMMUNITY_BASELINE.delivered,
      active: COMMUNITY_BASELINE.active + local.length,
      co2Kg: COMMUNITY_BASELINE.co2Kg + local.reduce((s, o) => s + fabricById(o.fabricId).co2SavedKg, 0),
      waterL: COMMUNITY_BASELINE.waterL + local.reduce((s, o) => s + fabricById(o.fabricId).waterSavedL, 0),
      syncedOdoo: false,
    };
    setImpact(localStats);

    fetchOdooImpact()
      .then((res) => {
        if (res.ok) {
          setImpact({
            delivered: COMMUNITY_BASELINE.delivered + res.delivered,
            active: COMMUNITY_BASELINE.active + res.active,
            co2Kg: COMMUNITY_BASELINE.co2Kg + res.co2Kg,
            waterL: COMMUNITY_BASELINE.waterL + res.waterL,
            syncedOdoo: true,
          });
        }
      })
      .catch(() => {});
  }, []);
  return impact;
}

function useLiveFabrics() {
  const [fabrics, setFabrics] = useState<Fabric[]>(FABRICS);
  useEffect(() => {
    fetchOdooFabrics()
      .then((res) => {
        if (res.ok && res.fabrics.length > 0) {
          setFabrics(res.fabrics.map((f, i) => odooFabricToFabric(f, i)));
        }
      })
      .catch(() => {});
  }, []);
  return fabrics;
}

function Home() {
  const impact = useImpact();
  const fabrics = useLiveFabrics();
  const fmt = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

  return (
    <>
      {/* Hero */}
      <section className="bg-hero">
        <div className="container-site grid items-center gap-10 py-14 md:grid-cols-[1.05fr_1fr] md:py-20">
          <div className="space-y-7">
            <p className="eyebrow">Adaptive clothing · made to measure</p>
            <h1 className="text-[2.6rem] font-medium text-foreground sm:text-5xl md:text-[3.4rem]">
              Clothes that work <em className="text-primary">with</em> your body, not against it.
            </h1>
            <p className="max-w-md text-lg text-muted-foreground">
              AdaptFit tailors everyday garments around your care needs — easy closures, hidden port access and a
              fit that's truly yours.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/intake">
                  Request a fitting <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/track">Track my order</Link>
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm font-bold text-muted-foreground">
              <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" /> Clinician reviewed</li>
              <li className="flex items-center gap-2"><Leaf className="size-4 text-eco" aria-hidden="true" /> Certified sustainable</li>
            </ul>
          </div>
          <div className="relative">
            <img
              src={heroImg}
              alt="A smiling woman in a wheelchair wearing a soft sage linen AdaptFit shirt by a bright window"
              width={1280}
              height={1024}
              className="aspect-[4/5] w-full rounded-[2rem] object-cover shadow-lift md:aspect-[5/6]"
            />
            <div className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-lift sm:left-auto sm:right-[-1rem] sm:w-64">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Magnet className="size-5" aria-hidden="true" />
              </span>
              <span className="text-sm leading-snug">
                <span className="block font-bold">Dressed in under a minute</span>
                <span className="text-muted-foreground">with one-handed closures</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container-site py-20" aria-labelledby="features-title">
        <div className="mb-12 max-w-xl space-y-3">
          <p className="eyebrow">Designed around you</p>
          <h2 id="features-title" className="text-4xl font-medium">Four details that change everything</h2>
          <p className="text-muted-foreground">
            Every AdaptFit garment looks like the clothes you love — the adaptations are hidden in the craft.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.title} className="rounded-2xl border bg-card p-6 shadow-card">
                <span className="mb-5 grid size-12 place-items-center rounded-xl bg-secondary text-primary">
                  <f.icon className="size-6" aria-hidden="true" />
                </span>
                <h3 className="mb-2 font-sans text-lg font-bold tracking-normal">{f.title}</h3>
                <p className="text-[0.95rem] text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </div>
          <img
            src={detailImg}
            alt="Close-up of a teal shirt showing a hidden magnetic placket and a concealed shoulder zipper"
            width={1024}
            height={1024}
            loading="lazy"
            className="hidden h-full w-full rounded-2xl object-cover shadow-card md:block"
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-primary-deep text-primary-foreground" aria-labelledby="how-title">
        <div className="container-site py-20">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-md space-y-3">
              <p className="eyebrow text-primary-foreground/70">How it works</p>
              <h2 id="how-title" className="text-4xl font-medium">From request to fitting, in three calm steps</h2>
            </div>
            <Button asChild variant="onDark" size="lg">
              <Link to="/intake">Start my request <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
          <ol className="grid gap-px overflow-hidden rounded-2xl bg-primary-foreground/15 md:grid-cols-3">
            {STEPS.map((s) => (
              <li key={s.n} className="bg-primary-deep p-7">
                <span className="font-display text-5xl text-primary-foreground/40">{s.n}</span>
                <h3 className="mt-4 font-sans text-xl font-bold tracking-normal">{s.title}</h3>
                <p className="mt-2 text-primary-foreground/75">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Fabrics */}
      <section className="container-site py-20" aria-labelledby="fabrics-title">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <img
            src={fabricsImg}
            alt="Folded swatches of organic cotton, TENCEL lyocell, recycled bamboo jersey and hemp linen"
            width={1280}
            height={896}
            loading="lazy"
            className="w-full rounded-2xl object-cover shadow-card"
          />
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="eyebrow text-eco">Certified sustainable</p>
              <h2 id="fabrics-title" className="text-4xl font-medium">Fabrics kind to skin, and to the planet</h2>
            </div>
            <ul className="divide-y rounded-2xl border bg-card">
              {fabrics.map((f) => (
                <li key={f.id} className="flex items-center gap-4 p-4">
                  <Swatch tone={f.swatch} className="size-10" />
                  <span className="flex-1">
                    <span className="block font-bold">{f.name}</span>
                    <span className="block text-sm text-muted-foreground">{f.description}</span>
                  </span>
                  <span className="hidden rounded-full bg-eco-soft px-3 py-1 text-xs font-bold text-eco sm:inline">
                    {f.certification}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="container-site" aria-labelledby="impact-title">
        <div className="rounded-[2rem] border bg-card p-8 shadow-card md:p-12">
          <div className="mb-10 flex flex-col justify-between gap-3 md:flex-row md:items-end">
            <div className="space-y-3">
              <p className="eyebrow text-eco">
                {impact.syncedOdoo ? "Community impact · synced with Odoo 19" : "Community impact · live"}
              </p>
              <h2 id="impact-title" className="text-4xl font-medium">What we've saved together</h2>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Compared with conventional fabrics, across every AdaptFit garment made so far.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-6 md:grid-cols-4" aria-live="polite">
            <Stat icon={<Leaf className="size-5" aria-hidden="true" />} label="kg CO₂ prevented" value={fmt.format(impact.co2Kg)} eco />
            <Stat icon={<Droplets className="size-5" aria-hidden="true" />} label="litres of water saved" value={fmt.format(impact.waterL)} eco />
            <Stat label="garments delivered" value={fmt.format(impact.delivered)} />
            <Stat label="being made now" value={fmt.format(impact.active)} />
          </dl>
        </div>
      </section>

      {/* CTA */}
      <section className="container-site pt-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-secondary p-8 md:flex-row md:items-center md:p-12">
          <div className="space-y-2">
            <h2 className="text-3xl font-medium text-secondary-foreground">Ready when you are.</h2>
            <p className="text-secondary-foreground/80">It takes about 5 minutes. A caregiver can fill it in for you.</p>
          </div>
          <Button asChild size="lg">
            <Link to="/intake">Request a fitting <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, icon, eco }: { label: string; value: string; icon?: React.ReactNode; eco?: boolean }) {
  return (
    <div className="space-y-2 border-l-2 border-border pl-5">
      <dt className={eco ? "flex items-center gap-2 text-sm font-bold text-eco" : "text-sm font-bold text-muted-foreground"}>
        {icon}
        {label}
      </dt>
      <dd className="font-display text-4xl font-medium text-foreground md:text-[2.6rem]">{value}</dd>
    </div>
  );
}
