import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Hospital, Lock } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { Swatch } from "@/components/adaptfit/swatch";
import { Button } from "@/components/ui/button";
import {
  COMFORT_PREFS,
  CONDITIONS,
  FABRICS,
  GARMENTS,
  makeOrderRef,
  makePatientRef,
  runClinicalAdvisor,
  type ConditionId,
  type GarmentId,
  type Measurements,
  type PatientOrder,
} from "@/lib/adaptfit";
import { saveOrder } from "@/lib/order-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/intake")({
  head: () => ({
    meta: [
      { title: "Request a fitting — AdaptFit" },
      { name: "description", content: "A short guided form to request your adaptive, made-to-measure garment." },
      { property: "og:title", content: "Request a fitting — AdaptFit" },
      { property: "og:description", content: "Tell us about your comfort needs and we'll design a garment around you." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Intake,
});

const STEPS = ["About you", "Garment & fabric", "Measurements"];

type Form = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  conditions: ConditionId[];
  comfort: string[];
  notes: string;
  garment: GarmentId;
  fabricId: string;
  urgency: "standard" | "priority";
  targetDate: string;
  measureAtClinic: boolean;
  m: Record<keyof Measurements, string>;
};

const EMPTY_M: Form["m"] = {
  shoulderL: "", shoulderR: "", armL: "", armR: "", chest: "", waist: "", hip: "", inseamL: "", inseamR: "",
};

function Intake() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [f, setF] = useState<Form>({
    firstName: "", lastName: "", email: "", phone: "",
    conditions: [], comfort: [], notes: "",
    garment: "shirt", fabricId: "organic-cotton", urgency: "standard", targetDate: "",
    measureAtClinic: false, m: EMPTY_M,
  });
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));
  const toggle = <K extends "conditions" | "comfort">(k: K, v: Form[K][number]) =>
    setF((p) => ({
      ...p,
      [k]: (p[k] as string[]).includes(v) ? (p[k] as string[]).filter((x) => x !== v) : [...(p[k] as string[]), v],
    }));

  const go = (n: number) => {
    setStep(n);
    setError(null);
    window.scrollTo({ top: 0 });
    requestAnimationFrame(() => headingRef.current?.focus());
  };

  const next = () => {
    if (step === 0) {
      if (!f.firstName.trim() || !f.lastName.trim()) return setError("Please enter a first and last name.");
      if (!/^\S+@\S+\.\S+$/.test(f.email)) return setError("Please enter a valid email so we can send your tracking link.");
    }
    go(step + 1);
  };

  const submit = () => {
    const measurements: Measurements = {};
    if (!f.measureAtClinic) {
      for (const [k, v] of Object.entries(f.m)) if (v !== "") measurements[k as keyof Measurements] = Number(v);
    }
    const order: PatientOrder = {
      token: crypto.randomUUID(),
      orderRef: makeOrderRef(),
      patientRef: makePatientRef(),
      firstName: f.firstName.trim(),
      garment: f.garment,
      fabricId: f.fabricId,
      stage: 0,
      accommodations: runClinicalAdvisor({ conditions: f.conditions, garment: f.garment, measurements }),
      measureAtClinic: f.measureAtClinic,
      urgency: f.urgency,
      targetDate: f.targetDate || undefined,
      createdAt: new Date().toISOString().slice(0, 10),
      updates: [
        {
          date: new Date().toISOString().slice(0, 10),
          message: `Thank you, ${f.firstName.trim()} — your request is in. A clinician will review it within 2 working days.`,
        },
      ],
      feedback: [],
    };
    saveOrder(order);
    navigate({ to: "/track/$token", params: { token: order.token }, search: { welcome: 1 } });
  };

  return (
    <div className="bg-hero">
      <div className="container-site max-w-3xl py-12 md:py-16">
        <Link to="/" className="mb-6 inline-flex min-h-12 items-center gap-2 font-bold text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to home
        </Link>
        <p className="eyebrow mb-3">Request a fitting</p>
        <h1 ref={headingRef} tabIndex={-1} className="mb-3 text-4xl font-medium outline-none md:text-5xl">
          {["Let's start with you", "Choose your garment", "Your measurements"][step]}
        </h1>
        <p className="mb-8 text-muted-foreground">Step {step + 1} of 3 · takes about 5 minutes · you can go back at any time.</p>

        {/* Stepper */}
        <ol className="mb-8 grid grid-cols-3 gap-2" aria-label="Form progress">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <span className={cn("mb-2 block h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-border")} />
              <span className={cn("flex items-center gap-1.5 text-sm font-bold", i <= step ? "text-foreground" : "text-muted-foreground")}>
                {i < step && <Check className="size-4 text-primary" aria-hidden="true" />}
                {s}
              </span>
            </li>
          ))}
        </ol>

        <form
          className="space-y-8 rounded-[1.75rem] border bg-card p-6 shadow-card md:p-10"
          onSubmit={(e) => {
            e.preventDefault();
            if (step < 2) next();
            else submit();
          }}
          noValidate
        >
          {step === 0 && (
            <>
              <Fieldset legend="Your details">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First name" id="firstName">
                    <input id="firstName" className="field" autoComplete="given-name" value={f.firstName} onChange={(e) => set("firstName", e.target.value)} required />
                  </Field>
                  <Field label="Last name" id="lastName">
                    <input id="lastName" className="field" autoComplete="family-name" value={f.lastName} onChange={(e) => set("lastName", e.target.value)} required />
                  </Field>
                  <Field label="Email" id="email" hint="We'll send your private tracking link here.">
                    <input id="email" type="email" className="field" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} required />
                  </Field>
                  <Field label="Phone (optional)" id="phone">
                    <input id="phone" type="tel" className="field" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
                  </Field>
                </div>
              </Fieldset>

              <Fieldset legend="What would make dressing easier?" description="Select all that apply. This helps us recommend the right features.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {CONDITIONS.map((c) => (
                    <CheckTile key={c.id} checked={f.conditions.includes(c.id)} onChange={() => toggle("conditions", c.id)} label={c.label} hint={c.hint} />
                  ))}
                </div>
              </Fieldset>

              <Fieldset legend="Comfort preferences">
                <div className="flex flex-wrap gap-2">
                  {COMFORT_PREFS.map((c) => {
                    const on = f.comfort.includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        aria-pressed={on}
                        onClick={() => toggle("comfort", c)}
                        className={cn(
                          "inline-flex min-h-12 items-center gap-2 rounded-full border-2 px-5 font-bold transition-colors",
                          on ? "border-primary bg-secondary text-secondary-foreground" : "border-input bg-card hover:border-primary",
                        )}
                      >
                        {on && <Check className="size-4" aria-hidden="true" />}
                        {c}
                      </button>
                    );
                  })}
                </div>
              </Fieldset>

              <Field label="Anything else your care team should know? (optional)" id="notes" hint={<span className="inline-flex items-center gap-1.5"><Lock className="size-3.5" aria-hidden="true" /> Only visible to your clinician.</span>}>
                <textarea id="notes" rows={3} className="field min-h-24" value={f.notes} onChange={(e) => set("notes", e.target.value)} />
              </Field>
            </>
          )}

          {step === 1 && (
            <>
              <Fieldset legend="Garment type">
                <div className="grid gap-3 sm:grid-cols-2">
                  {GARMENTS.map((g) => (
                    <RadioTile key={g.id} name="garment" checked={f.garment === g.id} onChange={() => set("garment", g.id)} label={g.label} hint={g.description} />
                  ))}
                </div>
              </Fieldset>
              <Fieldset legend="Sustainable fabric">
                <div className="grid gap-3 sm:grid-cols-2">
                  {FABRICS.map((fab) => (
                    <RadioTile
                      key={fab.id}
                      name="fabric"
                      checked={f.fabricId === fab.id}
                      onChange={() => set("fabricId", fab.id)}
                      label={fab.name}
                      hint={`${fab.certification} · saves ${fab.co2SavedKg} kg CO₂`}
                      leading={<Swatch tone={fab.swatch} className="size-9" />}
                    />
                  ))}
                </div>
              </Fieldset>
              <Fieldset legend="Timing">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="grid grid-cols-2 gap-3">
                    {(["standard", "priority"] as const).map((u) => (
                      <RadioTile key={u} name="urgency" checked={f.urgency === u} onChange={() => set("urgency", u)} label={u === "standard" ? "Standard" : "Priority"} hint={u === "standard" ? "3–4 weeks" : "Upcoming treatment"} />
                    ))}
                  </div>
                  <Field label="Needed by (optional)" id="target">
                    <input id="target" type="date" className="field" value={f.targetDate} onChange={(e) => set("targetDate", e.target.value)} />
                  </Field>
                </div>
              </Fieldset>
            </>
          )}

          {step === 2 && (
            <>
              <CheckTile
                checked={f.measureAtClinic}
                onChange={() => set("measureAtClinic", !f.measureAtClinic)}
                label="Measure me at the clinic instead"
                hint="No problem at all — we'll take measurements at your first appointment."
                icon={<Hospital className="size-5" aria-hidden="true" />}
              />
              {!f.measureAtClinic && (
                <>
                  <Fieldset legend="Left & right measurements (cm)" description="Many bodies differ side to side — measuring each helps us fit you properly.">
                    <div className="overflow-hidden rounded-2xl border">
                      <div className="grid grid-cols-[1fr_6rem_6rem] gap-3 bg-muted px-4 py-2 text-sm font-bold text-muted-foreground sm:grid-cols-[1fr_8rem_8rem]">
                        <span>Measurement</span><span>Left</span><span>Right</span>
                      </div>
                      {([["Shoulder width", "shoulderL", "shoulderR"], ["Arm length", "armL", "armR"], ["Inside leg", "inseamL", "inseamR"]] as const).map(([label, l, r]) => (
                        <div key={label} className="grid grid-cols-[1fr_6rem_6rem] items-center gap-3 border-t px-4 py-3 sm:grid-cols-[1fr_8rem_8rem]">
                          <span className="font-bold">{label}</span>
                          <MInput label={`${label}, left`} value={f.m[l]} onChange={(v) => set("m", { ...f.m, [l]: v })} />
                          <MInput label={`${label}, right`} value={f.m[r]} onChange={(v) => set("m", { ...f.m, [r]: v })} />
                        </div>
                      ))}
                    </div>
                  </Fieldset>
                  <Fieldset legend="Body (cm)">
                    <div className="grid grid-cols-3 gap-4">
                      {([["Chest", "chest"], ["Waist", "waist"], ["Hip", "hip"]] as const).map(([label, k]) => (
                        <Field key={k} label={label} id={k}>
                          <MInput id={k} value={f.m[k]} onChange={(v) => set("m", { ...f.m, [k]: v })} />
                        </Field>
                      ))}
                    </div>
                  </Fieldset>
                </>
              )}
            </>
          )}

          <p role="alert" aria-live="assertive" className={cn("rounded-xl bg-destructive/10 px-4 py-3 font-bold text-destructive", !error && "hidden")}>
            {error}
          </p>

          <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
            {step > 0 ? (
              <Button type="button" variant="outline" size="lg" onClick={() => go(step - 1)}>
                <ArrowLeft aria-hidden="true" /> Back
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" size="lg">
              {step < 2 ? <>Continue <ArrowRight aria-hidden="true" /></> : <>Send my request <Check aria-hidden="true" /></>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Fieldset({ legend, description, children }: { legend: string; description?: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="font-display text-2xl font-medium">{legend}</legend>
      {description && <p className="-mt-2 text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  );
}

function Field({ label, id, hint, children }: { label: string; id: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block font-bold">{label}</label>
      {children}
      {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MInput({ id, label, value, onChange }: { id?: string; label?: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      id={id}
      aria-label={label}
      type="number"
      inputMode="decimal"
      min={0}
      step="0.5"
      className="field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function CheckTile({ checked, onChange, label, hint, icon }: { checked: boolean; onChange: () => void; label: string; hint?: string; icon?: ReactNode }) {
  return (
    <label className={cn("flex min-h-16 cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-colors", checked ? "border-primary bg-primary-soft" : "border-input hover:border-primary/60")}>
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} />
      <span aria-hidden="true" className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40", checked ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card")}>
        {checked && <Check className="size-4" />}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2 font-bold">{icon}{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}

function RadioTile({ name, checked, onChange, label, hint, leading }: { name: string; checked: boolean; onChange: () => void; label: string; hint?: string; leading?: ReactNode }) {
  return (
    <label className={cn("flex min-h-16 cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-colors has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/40", checked ? "border-primary bg-primary-soft" : "border-input hover:border-primary/60")}>
      <input type="radio" name={name} className="sr-only" checked={checked} onChange={onChange} />
      {leading}
      <span className="flex-1">
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-muted-foreground">{hint}</span>}
      </span>
      <span aria-hidden="true" className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2", checked ? "border-primary" : "border-input")}>
        {checked && <span className="size-3 rounded-full bg-primary" />}
      </span>
    </label>
  );
}
