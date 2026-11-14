// AdaptFit patient portal domain: catalogue, clinical advisor rules, order lookup.
// Patient-facing only — internal artisan notes and payout fields are never modelled here.

export type ConditionId =
  | "chemo_port"
  | "limited_dexterity"
  | "wheelchair"
  | "sensory"
  | "hemiplegia"
  | "limited_shoulder";

export const CONDITIONS: { id: ConditionId; label: string; hint: string }[] = [
  { id: "chemo_port", label: "Chemo port or central line", hint: "Chest port, PICC or Hickman line" },
  { id: "limited_dexterity", label: "Limited hand dexterity", hint: "Buttons or small fasteners are hard" },
  { id: "wheelchair", label: "Wheelchair user", hint: "Seated most of the day" },
  { id: "sensory", label: "Sensory sensitivity", hint: "Tags, seams or rough fabric irritate" },
  { id: "hemiplegia", label: "One-sided weakness", hint: "Stroke, hemiplegia or limb difference" },
  { id: "limited_shoulder", label: "Limited shoulder movement", hint: "Arms difficult to lift overhead" },
];

export const COMFORT_PREFS = [
  "Tagless labels",
  "Relaxed fit",
  "Extra-soft finish",
  "Temperature regulating",
  "Easy-care / machine washable",
] as const;

export type GarmentId = "shirt" | "trousers" | "dress" | "jacket";

export const GARMENTS: { id: GarmentId; label: string; description: string }[] = [
  { id: "shirt", label: "Adaptive Shirt", description: "Everyday button-look shirt" },
  { id: "trousers", label: "Adaptive Trousers", description: "Seated-cut, easy-on trousers" },
  { id: "dress", label: "Adaptive Dress", description: "Wrap or shift silhouette" },
  { id: "jacket", label: "Adaptive Jacket", description: "Light layer with open-back option" },
];

export type Fabric = {
  id: string;
  name: string;
  certification: string;
  description: string;
  co2SavedKg: number;
  waterSavedL: number;
  swatch: "cream" | "sage" | "teal" | "stone";
};

export const FABRICS: Fabric[] = [
  {
    id: "organic-cotton",
    name: "Organic Cotton",
    certification: "GOTS certified",
    description: "Soft, breathable and gentle on sensitive skin.",
    co2SavedKg: 2.4,
    waterSavedL: 1820,
    swatch: "cream",
  },
  {
    id: "tencel",
    name: "TENCEL™ Lyocell",
    certification: "FSC sourced · closed-loop",
    description: "Silky-smooth, cool to touch, naturally moisture-wicking.",
    co2SavedKg: 3.1,
    waterSavedL: 2350,
    swatch: "sage",
  },
  {
    id: "bamboo-jersey",
    name: "Recycled Bamboo Jersey",
    certification: "OEKO-TEX Standard 100",
    description: "Stretchy and forgiving — ideal for seated wear.",
    co2SavedKg: 2.8,
    waterSavedL: 2010,
    swatch: "teal",
  },
  {
    id: "hemp-linen",
    name: "Hemp Linen",
    certification: "European Flax® · low impact",
    description: "Durable, airy and softens with every wash.",
    co2SavedKg: 3.6,
    waterSavedL: 2700,
    swatch: "stone",
  },
];

export type Zone = "placket" | "port" | "seams" | "sleeve" | "back" | "asym";

export type Accommodation = { id: string; name: string; description: string; zone: Zone };

export const ACCOMMODATIONS: Record<string, Accommodation> = {
  magnetic_placket: {
    id: "magnetic_placket",
    name: "Magnetic Placket",
    description: "Hidden magnets close the front one-handed, with no buttons to manage.",
    zone: "placket",
  },
  port_zipper: {
    id: "port_zipper",
    name: "Concealed Two-Way Port Zipper",
    description: "Discreet zip access to your port so treatment can happen fully dressed.",
    zone: "port",
  },
  flatlock_seams: {
    id: "flatlock_seams",
    name: "Zero-Friction Flat-Lock Seams",
    description: "Seams sit flat against the skin, with printed tagless labels.",
    zone: "seams",
  },
  seated_cut: {
    id: "seated_cut",
    name: "Seated-Cut Back Panel",
    description: "Higher back rise and shorter front to sit comfortably all day.",
    zone: "back",
  },
  asymmetric_fit: {
    id: "asymmetric_fit",
    name: "Asymmetric Tailoring",
    description: "Each side is cut to its own measurements for a true, balanced fit.",
    zone: "asym",
  },
  raglan_opening: {
    id: "raglan_opening",
    name: "Side-Opening Raglan Sleeve",
    description: "Sleeve opens along the shoulder so arms never need to lift overhead.",
    zone: "sleeve",
  },
};

export type Measurements = {
  shoulderL?: number;
  shoulderR?: number;
  armL?: number;
  armR?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  inseamL?: number;
  inseamR?: number;
};

/** Left/right difference (cm) at which the advisor recommends asymmetric tailoring. */
export const ASYMMETRY_THRESHOLD_CM = 2;

export function hasAsymmetry(m: Measurements): boolean {
  const pairs: [number | undefined, number | undefined][] = [
    [m.shoulderL, m.shoulderR],
    [m.armL, m.armR],
    [m.inseamL, m.inseamR],
  ];
  return pairs.some(
    ([l, r]) => l != null && r != null && Math.abs(l - r) >= ASYMMETRY_THRESHOLD_CM,
  );
}

/** Clinical Advisor: maps conditions + measurements to recommended accommodations. */
export function runClinicalAdvisor(input: {
  conditions: ConditionId[];
  garment: GarmentId;
  measurements: Measurements;
}): Accommodation[] {
  const ids = new Set<string>();
  const c = new Set(input.conditions);
  const isTop = input.garment !== "trousers";

  if (c.has("limited_dexterity") && isTop) ids.add("magnetic_placket");
  if (c.has("chemo_port") && isTop) ids.add("port_zipper");
  if (c.has("sensory")) ids.add("flatlock_seams");
  if (c.has("wheelchair")) ids.add("seated_cut");
  if (c.has("limited_shoulder") && isTop) ids.add("raglan_opening");
  if (c.has("hemiplegia") || hasAsymmetry(input.measurements)) ids.add("asymmetric_fit");
  if (c.has("hemiplegia") && isTop) ids.add("magnetic_placket");

  return Object.values(ACCOMMODATIONS).filter((a) => ids.has(a.id));
}

export const STAGES = [
  { id: "received", label: "Request received", detail: "We have your details" },
  { id: "review", label: "Clinical review", detail: "A clinician checks your needs" },
  { id: "pattern", label: "Pattern & blueprint", detail: "Your pattern is drafted" },
  { id: "crafting", label: "Being crafted", detail: "An artisan is sewing your garment" },
  { id: "quality", label: "Quality check", detail: "Every closure is tested" },
  { id: "fitting", label: "Ready for fitting", detail: "Book your fitting or delivery" },
] as const;

export type ClinicUpdate = { date: string; message: string };

export type PatientOrder = {
  token: string;
  orderRef: string;
  patientRef: string;
  firstName: string;
  garment: GarmentId;
  fabricId: string;
  stage: number; // 0..5
  accommodations: Accommodation[];
  measureAtClinic: boolean;
  urgency: "standard" | "priority";
  targetDate?: string;
  createdAt: string;
  updates: ClinicUpdate[];
  feedback: { date: string; message: string; satisfied?: boolean }[];
};

export const DEMO_ORDER: PatientOrder = {
  token: "demo-7f3c2a91",
  orderRef: "ADP/2026/0042",
  patientRef: "PAT-7Q3K9M",
  firstName: "Amira",
  garment: "shirt",
  fabricId: "tencel",
  stage: 3,
  accommodations: [ACCOMMODATIONS.magnetic_placket, ACCOMMODATIONS.port_zipper, ACCOMMODATIONS.flatlock_seams],
  measureAtClinic: false,
  urgency: "priority",
  targetDate: "2026-11-28",
  createdAt: "2026-11-02",
  updates: [
    { date: "2026-11-02", message: "Thank you, Amira — your request is in. We'll review it within 2 working days." },
    { date: "2026-11-04", message: "Clinical review complete. Magnetic placket and port zipper confirmed." },
    { date: "2026-11-09", message: "Your TENCEL™ fabric has been cut. Sewing has started in our studio." },
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
  return FABRICS.find((f) => f.id === id) ?? FABRICS[0];
}

export function garmentLabel(id: GarmentId): string {
  return GARMENTS.find((g) => g.id === id)?.label ?? "Garment";
}

const REF_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function makePatientRef(rand: () => number = Math.random): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += REF_CHARS[Math.floor(rand() * REF_CHARS.length)];
  return `PAT-${s}`;
}

export function makeOrderRef(rand: () => number = Math.random): string {
  return `ADP/2026/${String(Math.floor(rand() * 9000) + 1000)}`;
}

/** Community-wide impact baseline (garments delivered before this device's orders). */
export const COMMUNITY_BASELINE = { delivered: 1284, active: 96, co2Kg: 3742, waterL: 2_816_400 };
