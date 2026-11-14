// AdaptFit patient portal domain: aligned 1:1 with Odoo 19 `adaptfit_apparel` models.
// Patient-facing only — internal artisan payout & private clinical fields are never exposed.
import type { OdooFabricRecord, OdooOrderRecord, OdooQaCheckRecord } from "./odoo-bridge";

export type ConditionId =
  | "condition_medical_port"
  | "condition_stroke_mobility"
  | "condition_wheelchair"
  | "condition_sensory"
  | "condition_amputation"
  | "condition_burn_graft";

export const CONDITIONS: { id: ConditionId; label: string; hint: string }[] = [
  { id: "condition_medical_port", label: "Chemo port, dialysis or catheter", hint: "Chest port, PICC, pacemaker or abdominal catheter" },
  { id: "condition_stroke_mobility", label: "Stroke or limited hand dexterity", hint: "Buttons or small fasteners are hard" },
  { id: "condition_wheelchair", label: "Wheelchair user (seated fit)", hint: "Seated most of the day — needs high-rise back" },
  { id: "condition_sensory", label: "Sensory sensitive / tactile defense", hint: "Tags, seams or rough fabric irritate" },
  { id: "condition_amputation", label: "Limb difference or amputation", hint: "Asymmetric limb lengths or prosthetic socket" },
  { id: "condition_burn_graft", label: "Burn survivor / skin graft", hint: "Needs zero-friction flat-lock seams & bamboo lining" },
];

export const COMFORT_PREFS = [
  "Strictly tagless heat labels",
  "Always use magnetic closures",
  "Strictly flat-lock frictionless seams",
  "Require hypoallergenic bamboo lining",
] as const;

export type GarmentId =
  | "shirt_top"
  | "trousers_pant"
  | "post_op_recovery"
  | "compression_sleeve"
  | "outerwear_jacket";

export const GARMENTS: { id: GarmentId; label: string; description: string }[] = [
  { id: "shirt_top", label: "Adaptive Shirt / Blouse", description: "Classic button-look with hidden magnetic placket" },
  { id: "trousers_pant", label: "Adaptive Seated / Split Pants", description: "Seated-cut high-rise back & easy-on leg access" },
  { id: "post_op_recovery", label: "Full Recovery Romper / Suit", description: "Post-operative full-access recovery garment" },
  { id: "compression_sleeve", label: "Custom Pressure / Compression Sleeve", description: "Tailored limb & prosthetic support sleeve" },
  { id: "outerwear_jacket", label: "Easy-On Outerwear / Coat", description: "Magnetic-closure outer layer with port access" },
];

export type Fabric = {
  id: string;
  odooId?: number;
  name: string;
  certification: string;
  description: string;
  co2SavedKg: number;
  waterSavedL: number;
  swatch: "cream" | "sage" | "teal" | "stone";
};

export const FABRICS: Fabric[] = [
  {
    id: "organic-bamboo",
    name: "GOTS Organic Bamboo",
    certification: "GOTS certified · Hypoallergenic",
    description: "Silky-soft, antibacterial and gentle on burn grafts & sensitive skin.",
    co2SavedKg: 4.2,
    waterSavedL: 1850,
    swatch: "sage",
  },
  {
    id: "oeko-tex-cotton",
    name: "OEKO-TEX 100 Organic Cotton",
    certification: "OEKO-TEX Standard 100",
    description: "Breathable, chemical-free weave ideal for everyday adaptive shirts.",
    co2SavedKg: 3.1,
    waterSavedL: 1420,
    swatch: "cream",
  },
  {
    id: "tencel-lyocell",
    name: "TENCEL™ Lyocell",
    certification: "FSC sourced · closed-loop",
    description: "Cool to touch and naturally moisture-wicking for seated wear.",
    co2SavedKg: 3.6,
    waterSavedL: 2150,
    swatch: "teal",
  },
  {
    id: "hemp-linen",
    name: "European Hemp Linen",
    certification: "European Flax® · low impact",
    description: "Durable, airy and softens with every wash.",
    co2SavedKg: 4.8,
    waterSavedL: 2500,
    swatch: "stone",
  },
];

export function odooFabricToFabric(rec: OdooFabricRecord, index = 0): Fabric {
  const lower = rec.name.toLowerCase();
  const swatch: Fabric["swatch"] = lower.includes("bamboo")
    ? "sage"
    : lower.includes("tencel")
      ? "teal"
      : lower.includes("cotton")
        ? "cream"
        : (["sage", "cream", "teal", "stone"] as const)[index % 4]!;
  return {
    id: `odoo-fab-${rec.id}`,
    odooId: rec.id,
    name: rec.name,
    certification: rec.fabric_certification || "Certified Sustainable Fabric",
    description: `Saves ${rec.eco_co2_saved_per_m.toFixed(2)} kg CO₂ and ${Math.round(rec.eco_water_saved_per_m)} L water per metre.`,
    co2SavedKg: rec.eco_co2_saved_per_m,
    waterSavedL: rec.eco_water_saved_per_m,
    swatch,
  };
}

export type Zone = "placket" | "port" | "seams" | "sleeve" | "back" | "asym";

export type Accommodation = { id: string; name: string; description: string; zone: Zone };

export const ACCOMMODATIONS = {
  magnetic_placket: {
    id: "magnetic_placket",
    name: "Magnetic Placket (One-Handed)",
    description: "Hidden magnets close the front one-handed while keeping a classic button look.",
    zone: "placket",
  },
  port_zipper: {
    id: "port_zipper",
    name: "Concealed 2-Way Port Zipper",
    description: "Discreet zip access to your port or pacemaker so treatment happens fully dressed.",
    zone: "port",
  },
  flatlock_seams: {
    id: "flatlock_seams",
    name: "Zero-Friction Flat-Lock Seams",
    description: "Seams sit flat against the skin with strictly tagless heat-transferred labels.",
    zone: "seams",
  },
  seated_cut: {
    id: "seated_cut",
    name: "Seated Ergonomic High-Rise Back",
    description: "Higher rear rise and contoured front to sit comfortably in a wheelchair all day.",
    zone: "back",
  },
  prosthetic_shield: {
    id: "prosthetic_shield",
    name: "Abrasion-Proof Socket Shield",
    description: "Reinforced interior panel protecting fabric and skin around prosthetic sockets.",
    zone: "sleeve",
  },
  asymmetric_fit: {
    id: "asymmetric_fit",
    name: "Asymmetric Tailoring",
    description: "Each side is cut to its own inch measurements for a true, balanced fit.",
    zone: "asym",
  },
} satisfies Record<string, Accommodation>;

// 12 Asymmetric Body Measurements (Inches) matching Odoo `res.partner` & `adaptive.order`
export type Measurements = {
  meas_neck?: number;
  meas_shoulder?: number;
  meas_arm_left?: number;
  meas_arm_right?: number;
  meas_stump_circ_left?: number;
  meas_stump_circ_right?: number;
  meas_chest?: number;
  meas_waist?: number;
  meas_hip?: number;
  meas_inseam_left?: number;
  meas_inseam_right?: number;
  meas_seated_rise?: number;
};

/** Left/right difference (inches) at which asymmetric tailoring is recommended. */
export const ASYMMETRY_THRESHOLD_IN = 0.75;

export function hasAsymmetry(m: Measurements): boolean {
  const pairs: [number | undefined, number | undefined][] = [
    [m.meas_arm_left, m.meas_arm_right],
    [m.meas_stump_circ_left, m.meas_stump_circ_right],
    [m.meas_inseam_left, m.meas_inseam_right],
  ];
  return pairs.some(
    ([l, r]) => l != null && r != null && Math.abs(l - r) >= ASYMMETRY_THRESHOLD_IN,
  );
}

/** Clinical Advisor (mirrors Odoo `adaptive.order._build_clinical_recommendations`). */
export function runClinicalAdvisor(input: {
  conditions: ConditionId[];
  garment: GarmentId;
  measurements: Measurements;
  notes?: string;
}): Accommodation[] {
  const ids = new Set<string>();
  const c = new Set(input.conditions);
  const notes = (input.notes || "").toLowerCase();
  const isTop = input.garment !== "trousers_pant";

  if (
    (c.has("condition_stroke_mobility") || /stroke|grip|hemiplegia|dexterity|magnet/.test(notes)) &&
    isTop
  ) {
    ids.add("magnetic_placket");
  }
  if (
    (c.has("condition_medical_port") || /port|chemo|dialysis|catheter|pacemaker|picc/.test(notes)) &&
    isTop
  ) {
    ids.add("port_zipper");
  }
  if (
    c.has("condition_burn_graft") ||
    c.has("condition_sensory") ||
    /burn|graft|scar|friction|sensitive/.test(notes)
  ) {
    ids.add("flatlock_seams");
  }
  if (c.has("condition_amputation") || /amput|prosthe|socket/.test(notes)) {
    ids.add("prosthetic_shield");
    ids.add("asymmetric_fit");
  }
  if (c.has("condition_wheelchair") || /wheelchair|seated/.test(notes)) {
    ids.add("seated_cut");
  }
  if (hasAsymmetry(input.measurements)) {
    ids.add("asymmetric_fit");
  }

  return Object.values(ACCOMMODATIONS).filter((a) => ids.has(a.id));
}

// 6 Production Stages matching Odoo `adaptive.order.state`
export const STAGES = [
  { id: "draft", label: "Intake & Sizing", detail: "We have your clinical & sizing details" },
  { id: "pattern", label: "Pattern & Cutting", detail: "Your asymmetric pattern is drafted" },
  { id: "stitching", label: "Artisan Assembly", detail: "A master artisan is sewing your garment" },
  { id: "transit", label: "Clinic Transit", detail: "On the way to the clinic for QA" },
  { id: "fitting", label: "Clinical Fitting Trial", detail: "4-point QA & fitting check" },
  { id: "delivered", label: "Delivered & Settled", detail: "Completed & delivered with care" },
] as const;

const ODOO_STATE_INDEX: Record<string, number> = {
  draft: 0,
  pattern: 1,
  stitching: 2,
  transit: 3,
  fitting: 4,
  delivered: 5,
};

export type ClinicUpdate = { date: string; message: string };

export type PatientOrder = {
  token: string;
  odooId?: number | undefined;
  orderRef: string;
  patientRef: string;
  firstName: string;
  garment: GarmentId;
  fabricId: string;
  fabricName?: string | undefined;
  co2SavedKg?: number | undefined;
  waterSavedL?: number | undefined;
  yardageM?: number | undefined;
  stage: number; // 0..5
  accommodations: Accommodation[];
  advisorSummary?: string | undefined;
  odooSvg?: string | undefined;
  qaPassed?: boolean | undefined;
  qaChecks?: OdooQaCheckRecord[] | undefined;
  measureAtClinic: boolean;
  urgency: "standard" | "urgent" | "clinical_rush";
  targetDate?: string | undefined;
  createdAt: string;
  updates: ClinicUpdate[];
  feedback: { date: string; message: string; satisfied?: boolean | undefined }[];
};

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function odooRecordToPatientOrder(rec: OdooOrderRecord, firstNameFallback = "Patient"): PatientOrder {
  const acc: Accommodation[] = [];
  if (rec.has_magnetic_placket) acc.push(ACCOMMODATIONS.magnetic_placket);
  if (rec.has_port_access_zip) acc.push(ACCOMMODATIONS.port_zipper);
  if (rec.has_flatlock_frictionless) acc.push(ACCOMMODATIONS.flatlock_seams);
  if (rec.has_high_seated_rise) acc.push(ACCOMMODATIONS.seated_cut);
  if (rec.has_prosthetic_reinforcement) acc.push(ACCOMMODATIONS.prosthetic_shield);

  const stage = ODOO_STATE_INDEX[rec.state] ?? 0;
  const partnerName = Array.isArray(rec.partner_id) ? rec.partner_id[1].split(" ")[0] : firstNameFallback;
  const fabricName = Array.isArray(rec.fabric_id) ? rec.fabric_id[1] : undefined;

  const chatterUpdates: ClinicUpdate[] = (rec.chatter_messages ?? [])
    .map((m) => ({
      date: (m.date || new Date().toISOString()).slice(0, 10),
      message: stripHtml(m.body || ""),
    }))
    .filter((u) => u.message.length > 0);

  if (chatterUpdates.length === 0) {
    chatterUpdates.push({
      date: (rec.create_date || new Date().toISOString()).slice(0, 10),
      message: rec.advisor_summary
        ? `Odoo Clinical Advisor: ${rec.advisor_summary}`
        : "Synced live from Odoo 19 AdaptFit ERP.",
    });
  }

  return {
    token: `odoo-${rec.id}`,
    odooId: rec.id,
    orderRef: rec.name,
    patientRef: rec.patient_ref || "PAT-NEW",
    firstName: partnerName || firstNameFallback,
    garment: rec.garment_type || "shirt_top",
    fabricId: Array.isArray(rec.fabric_id) ? `odoo-fab-${rec.fabric_id[0]}` : "organic-bamboo",
    fabricName,
    co2SavedKg: rec.eco_carbon_saved_kg || undefined,
    waterSavedL: rec.eco_water_saved_l || undefined,
    yardageM: rec.calculated_yardage || undefined,
    stage,
    accommodations: acc,
    advisorSummary: rec.advisor_summary || undefined,
    odooSvg: rec.blueprint_svg_preview || undefined,
    qaPassed: rec.qa_passed,
    qaChecks: rec.qa_checks,
    measureAtClinic: false,
    urgency: rec.urgency_level || "standard",
    targetDate: rec.target_date || undefined,
    createdAt: (rec.create_date || new Date().toISOString()).slice(0, 10),
    updates: chatterUpdates,
    feedback: [],
  };
}

export const DEMO_ORDER: PatientOrder = {
  token: "demo-7f3c2a91",
  orderRef: "ADAPT/2026/0042",
  patientRef: "PAT-001",
  firstName: "Amira",
  garment: "shirt_top",
  fabricId: "organic-bamboo",
  stage: 2,
  accommodations: [ACCOMMODATIONS.magnetic_placket, ACCOMMODATIONS.port_zipper, ACCOMMODATIONS.flatlock_seams],
  measureAtClinic: false,
  urgency: "clinical_rush",
  targetDate: "2026-11-28",
  createdAt: "2026-11-02",
  updates: [
    { date: "2026-11-02", message: "Thank you, Amira — your request is in. Clinical Advisor confirmed magnetic placket & port zipper." },
    { date: "2026-11-04", message: "Discreet Zero-PII QR Job Card dispatched to workshop." },
    { date: "2026-11-09", message: "GOTS Organic Bamboo cut (2.1m). Artisan assembly in progress." },
  ],
  feedback: [],
};

export function normalizeRef(s: string): string {
  return s.trim().toUpperCase().replace(/\s+/g, "");
}

/** Both references must match the same order — one alone never unlocks a record. */
export function findOrderByRefs(
  orders: PatientOrder[],
  orderRef: string,
  patientRef: string,
): PatientOrder | undefined {
  const o = normalizeRef(orderRef);
  const p = normalizeRef(patientRef);
  if (!o || !p) return undefined;
  return orders.find((x) => normalizeRef(x.orderRef) === o && normalizeRef(x.patientRef) === p);
}

export function fabricById(id: string): Fabric {
  return FABRICS.find((f) => f.id === id) ?? (FABRICS[0] as Fabric);
}

export function garmentLabel(id: GarmentId): string {
  return GARMENTS.find((g) => g.id === id)?.label ?? "Adaptive Garment";
}

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makePatientRef(rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_CHARS[Math.floor(rand() * REF_CHARS.length)];
  return `PAT-${s}`;
}

export function makeOrderRef(rand: () => number = Math.random): string {
  return `ADAPT/2026/${String(Math.floor(rand() * 9000) + 1000)}`;
}

/** Community-wide impact baseline (garments delivered before this device's orders). */
export const COMMUNITY_BASELINE = { delivered: 1284, active: 96, co2Kg: 3742, waterL: 2_816_400 };
