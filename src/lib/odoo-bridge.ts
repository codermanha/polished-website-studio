import { createServerFn } from "@tanstack/react-start";

type JsonRpcResponse<T = unknown> = {
  result?: T;
  error?: { message?: string; data?: { message?: string } };
};

function getOdooConfig() {
  return {
    url: (process.env["ODOO_URL"] || "http://localhost:8069").replace(/\/+$/, ""),
    db: process.env["ODOO_DB"] || "admin",
    user: process.env["ODOO_USER"] || "admin",
    password: process.env["ODOO_PASSWORD"] || "admin",
  };
}

async function jsonRpc<T>(service: string, method: string, args: unknown[]): Promise<T> {
  const cfg = getOdooConfig();
  const res = await fetch(`${cfg.url}/jsonrpc`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service, method, args },
      id: Date.now(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Odoo HTTP ${res.status}`);
  }
  const data = (await res.json()) as JsonRpcResponse<T>;
  if (data.error) {
    throw new Error(data.error.data?.message || data.error.message || "Odoo RPC error");
  }
  return data.result as T;
}

async function authenticateOdoo(): Promise<{ uid: number; db: string; password: string }> {
  const cfg = getOdooConfig();
  let db = cfg.db;
  let uid = await jsonRpc<number | false>("common", "authenticate", [db, cfg.user, cfg.password, {}]);
  if (!uid) {
    // Auto-discover database if default DB name differs
    const dbs = await jsonRpc<string[]>("db", "list", []);
    if (dbs && dbs.length > 0 && dbs[0] !== db) {
      db = dbs[0]!;
      uid = await jsonRpc<number | false>("common", "authenticate", [db, cfg.user, cfg.password, {}]);
    }
  }
  if (!uid) {
    throw new Error(`Odoo authentication failed on database "${db}"`);
  }
  return { uid, db, password: cfg.password };
}

async function executeKw<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const auth = await authenticateOdoo();
  return jsonRpc<T>("object", "execute_kw", [auth.db, auth.uid, auth.password, model, method, args, kwargs]);
}

export type OdooFabricRecord = {
  id: number;
  name: string;
  fabric_certification: string | false;
  eco_co2_saved_per_m: number;
  eco_water_saved_per_m: number;
};

export type OdooQaCheckRecord = {
  id: number;
  name: string;
  state: "pending" | "passed" | "rework";
  check_date: string | false;
  tactile_seam_audit: boolean;
  magnetic_polarity_test: boolean;
  port_access_clearance: boolean;
  asymmetric_tolerance_ok: boolean;
  rework_reason: string | false;
};

export type OdooMessageRecord = {
  id: number;
  date: string;
  body: string;
  author_id: [number, string] | false;
  message_type: string;
};

export type OdooOrderRecord = {
  id: number;
  name: string;
  patient_ref: string | false;
  partner_id: [number, string] | false;
  state: "draft" | "pattern" | "stitching" | "transit" | "fitting" | "delivered" | "cancel";
  urgency_level: "standard" | "urgent" | "clinical_rush";
  target_date: string | false;
  garment_type: "shirt_top" | "trousers_pant" | "post_op_recovery" | "compression_sleeve" | "outerwear_jacket";
  fabric_id: [number, string] | false;
  calculated_yardage: number;
  eco_carbon_saved_kg: number;
  eco_water_saved_l: number;
  advisor_summary: string | false;
  has_magnetic_placket: boolean;
  has_port_access_zip: boolean;
  port_location: string | false;
  has_prosthetic_reinforcement: boolean;
  has_flatlock_frictionless: boolean;
  has_high_seated_rise: boolean;
  has_tagless_label: boolean;
  blueprint_svg_preview: string | false;
  create_date: string | false;
  qa_passed: boolean;
  qa_checks?: OdooQaCheckRecord[];
  chatter_messages?: OdooMessageRecord[];
};

const ORDER_FIELDS = [
  "id",
  "name",
  "patient_ref",
  "partner_id",
  "state",
  "urgency_level",
  "target_date",
  "garment_type",
  "fabric_id",
  "calculated_yardage",
  "eco_carbon_saved_kg",
  "eco_water_saved_l",
  "advisor_summary",
  "has_magnetic_placket",
  "has_port_access_zip",
  "port_location",
  "has_prosthetic_reinforcement",
  "has_flatlock_frictionless",
  "has_high_seated_rise",
  "has_tagless_label",
  "blueprint_svg_preview",
  "create_date",
  "qa_passed",
];

async function enrichOrderWithQaAndChatter(order: OdooOrderRecord): Promise<OdooOrderRecord> {
  const [qaChecks, messages] = await Promise.all([
    executeKw<OdooQaCheckRecord[]>(
      "adaptive.qa.check",
      "search_read",
      [[["order_id", "=", order.id]]],
      {
        fields: [
          "id",
          "name",
          "state",
          "check_date",
          "tactile_seam_audit",
          "magnetic_polarity_test",
          "port_access_clearance",
          "asymmetric_tolerance_ok",
          "rework_reason",
        ],
        order: "create_date desc",
      },
    ).catch(() => [] as OdooQaCheckRecord[]),
    executeKw<OdooMessageRecord[]>(
      "mail.message",
      "search_read",
      [
        [
          ["model", "=", "adaptive.order"],
          ["res_id", "=", order.id],
          ["message_type", "in", ["comment", "notification"]],
          ["body", "!=", ""],
        ],
      ],
      {
        fields: ["id", "date", "body", "author_id", "message_type"],
        order: "date asc",
        limit: 20,
      },
    ).catch(() => [] as OdooMessageRecord[]),
  ]);
  return { ...order, qa_checks: qaChecks, chatter_messages: messages };
}

export const checkOdooHealth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const cfg = getOdooConfig();
    const version = await jsonRpc<{ server_version?: string }>("common", "version", []);
    const auth = await authenticateOdoo();
    return {
      connected: true as const,
      url: cfg.url,
      db: auth.db,
      version: version?.server_version ?? "19.0",
    };
  } catch (err) {
    return { connected: false as const, error: err instanceof Error ? err.message : "Offline" };
  }
});

export const fetchOdooFabrics = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const records = await executeKw<OdooFabricRecord[]>(
      "product.product",
      "search_read",
      [[["is_sustainable_fabric", "=", true]]],
      { fields: ["id", "name", "fabric_certification", "eco_co2_saved_per_m", "eco_water_saved_per_m"], order: "id asc" },
    );
    return { ok: true as const, fabrics: records };
  } catch {
    return { ok: false as const, fabrics: [] as OdooFabricRecord[] };
  }
});

export const fetchOdooImpact = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const orders = await executeKw<Pick<OdooOrderRecord, "state" | "eco_carbon_saved_kg" | "eco_water_saved_l">[]>(
      "adaptive.order",
      "search_read",
      [[["state", "!=", "cancel"]]],
      { fields: ["state", "eco_carbon_saved_kg", "eco_water_saved_l"] },
    );
    const delivered = orders.filter((o) => o.state === "delivered").length;
    const active = orders.filter((o) => o.state !== "delivered").length;
    const co2Kg = orders.reduce((sum, o) => sum + (o.eco_carbon_saved_kg || 0), 0);
    const waterL = orders.reduce((sum, o) => sum + (o.eco_water_saved_l || 0), 0);
    return { ok: true as const, total: orders.length, delivered, active, co2Kg, waterL };
  } catch {
    return { ok: false as const };
  }
});

export type CreateOdooOrderInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | undefined;
  conditions: string[];
  notes: string;
  garmentType: OdooOrderRecord["garment_type"];
  fabricId?: number | undefined;
  fabricName?: string | undefined;
  urgencyLevel: OdooOrderRecord["urgency_level"];
  targetDate?: string | undefined;
  measureAtClinic: boolean;
  measurements: Record<string, number>;
  prefs: {
    magnetic?: boolean | undefined;
    tagless?: boolean | undefined;
    flatlock?: boolean | undefined;
    bamboo?: boolean | undefined;
  };
};

export const submitOrderToOdoo = createServerFn({ method: "POST" })
  .inputValidator((d: CreateOdooOrderInput) => d)
  .handler(async ({ data }) => {
    const condSet = new Set(data.conditions);
    const m = data.measurements;

    // 1. Create res.partner with patient flags & 12 asymmetric inch measurements
    const partnerId = await executeKw<number>("res.partner", "create", [
      {
        name: `${data.firstName} ${data.lastName}`.trim(),
        email: data.email,
        phone: data.phone || false,
        is_adaptive_patient: true,
        condition_amputation: condSet.has("condition_amputation"),
        condition_burn_graft: condSet.has("condition_burn_graft"),
        condition_stroke_mobility: condSet.has("condition_stroke_mobility"),
        condition_medical_port: condSet.has("condition_medical_port"),
        condition_wheelchair: condSet.has("condition_wheelchair"),
        condition_sensory: condSet.has("condition_sensory"),
        medical_notes: data.notes || false,
        pref_magnetic_closures: Boolean(data.prefs.magnetic),
        pref_tagless_only: data.prefs.tagless ?? true,
        pref_flatlock_seams: Boolean(data.prefs.flatlock),
        pref_bamboo_lining: Boolean(data.prefs.bamboo),
        meas_neck: m["meas_neck"] || 0,
        meas_shoulder: m["meas_shoulder"] || 0,
        meas_arm_left: m["meas_arm_left"] || 0,
        meas_arm_right: m["meas_arm_right"] || 0,
        meas_stump_circ_left: m["meas_stump_circ_left"] || 0,
        meas_stump_circ_right: m["meas_stump_circ_right"] || 0,
        meas_chest: m["meas_chest"] || 0,
        meas_waist: m["meas_waist"] || 0,
        meas_hip: m["meas_hip"] || 0,
        meas_inseam_left: m["meas_inseam_left"] || 0,
        meas_inseam_right: m["meas_inseam_right"] || 0,
        meas_seated_rise: m["meas_seated_rise"] || 0,
      },
    ]);

    // 2. Resolve fabric_id in Odoo
    let fabricId = data.fabricId;
    if (!fabricId) {
      const fabrics = await executeKw<OdooFabricRecord[]>(
        "product.product",
        "search_read",
        [[["is_sustainable_fabric", "=", true]]],
        { fields: ["id", "name"], limit: 10 },
      );
      const matched = data.fabricName
        ? fabrics.find((f) => f.name.toLowerCase().includes(data.fabricName!.toLowerCase()))
        : undefined;
      fabricId = matched?.id ?? fabrics[0]?.id;
    }

    if (!fabricId) {
      throw new Error("No sustainable fabric product found in Odoo");
    }

    // 3. Create adaptive.order
    const orderId = await executeKw<number>("adaptive.order", "create", [
      {
        partner_id: partnerId,
        garment_type: data.garmentType,
        fabric_id: fabricId,
        urgency_level: data.urgencyLevel,
        target_date: data.targetDate || new Date().toISOString().slice(0, 10),
        clinical_notes_input: data.notes || false,
        order_neck: m["meas_neck"] || 0,
        order_shoulder: m["meas_shoulder"] || 0,
        order_arm_left: m["meas_arm_left"] || 0,
        order_arm_right: m["meas_arm_right"] || 0,
        order_stump_left: m["meas_stump_circ_left"] || 0,
        order_stump_right: m["meas_stump_circ_right"] || 0,
        order_chest: m["meas_chest"] || 0,
        order_waist: m["meas_waist"] || 0,
        order_inseam_left: m["meas_inseam_left"] || 0,
        order_inseam_right: m["meas_inseam_right"] || 0,
        order_seated_rise: m["meas_seated_rise"] || 0,
      },
    ]);

    // 4. Trigger Odoo Clinical Advisor
    await executeKw("adaptive.order", "action_run_clinical_advisor", [[orderId]]);

    // 5. Read back the enriched order with QA + Chatter
    const [order] = await executeKw<OdooOrderRecord[]>("adaptive.order", "read", [[orderId]], {
      fields: ORDER_FIELDS,
    });
    if (!order) {
      throw new Error("Failed to read created Odoo order");
    }
    return enrichOrderWithQaAndChatter(order);
  });

export const lookupOrderInOdoo = createServerFn({ method: "POST" })
  .inputValidator((d: { orderRef: string; patientRef: string }) => d)
  .handler(async ({ data }) => {
    try {
      const orders = await executeKw<OdooOrderRecord[]>(
        "adaptive.order",
        "search_read",
        [
          [
            ["name", "=ilike", data.orderRef.trim()],
            ["patient_ref", "=ilike", data.patientRef.trim()],
          ],
        ],
        { fields: ORDER_FIELDS, limit: 1 },
      );
      if (!orders[0]) {
        return { ok: true as const, order: null };
      }
      const enriched = await enrichOrderWithQaAndChatter(orders[0]);
      return { ok: true as const, order: enriched };
    } catch {
      return { ok: false as const, order: null };
    }
  });

export const fetchOrderByOdooId = createServerFn({ method: "POST" })
  .inputValidator((d: { id: number }) => d)
  .handler(async ({ data }) => {
    try {
      const orders = await executeKw<OdooOrderRecord[]>("adaptive.order", "read", [[data.id]], {
        fields: ORDER_FIELDS,
      });
      if (!orders[0]) {
        return { ok: true as const, order: null };
      }
      const enriched = await enrichOrderWithQaAndChatter(orders[0]);
      return { ok: true as const, order: enriched };
    } catch {
      return { ok: false as const, order: null };
    }
  });

export const postOrderFeedbackToOdoo = createServerFn({ method: "POST" })
  .inputValidator((d: { orderId: number; message: string; satisfied?: boolean | undefined }) => d)
  .handler(async ({ data }) => {
    try {
      const prefix = data.satisfied ? "[Patient Fit Confirmed] " : "[Patient Feedback] ";
      await executeKw("adaptive.order", "message_post", [[data.orderId]], {
        body: `${prefix}${data.message}`,
        message_type: "comment",
        subtype_xmlid: "mail.mt_comment",
      });
      return { ok: true as const };
    } catch (err) {
      return { ok: false as const, error: err instanceof Error ? err.message : "Failed to post to Odoo" };
    }
  });
