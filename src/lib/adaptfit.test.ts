import { describe, expect, it } from "vitest";

import { DEMO_ORDER, findOrderByRefs, hasAsymmetry, runClinicalAdvisor } from "./adaptfit";

const names = (r: ReturnType<typeof runClinicalAdvisor>) => r.map((a) => a.name);

describe("Clinical Advisor", () => {
  it("chemo port + limited dexterity on a shirt enables magnetic placket and port zipper", () => {
    const r = names(
      runClinicalAdvisor({
        conditions: ["condition_medical_port", "condition_stroke_mobility"],
        garment: "shirt_top",
        measurements: {},
      }),
    );
    expect(r).toContain("Magnetic Placket (One-Handed)");
    expect(r).toContain("Concealed 2-Way Port Zipper");
  });

  it("recommends asymmetric tailoring when left/right differ by 0.75 in or more", () => {
    expect(hasAsymmetry({ meas_arm_left: 22, meas_arm_right: 24.5 })).toBe(true);
    expect(hasAsymmetry({ meas_arm_left: 22, meas_arm_right: 22.5 })).toBe(false);
  });
});

describe("Order lookup privacy", () => {
  const orders = [DEMO_ORDER];
  it("opens the order only when both references match", () => {
    expect(findOrderByRefs(orders, " adapt/2026/0042 ", "pat-001")?.token).toBe(DEMO_ORDER.token);
  });
  it("rejects a wrong patient reference", () => {
    expect(findOrderByRefs(orders, DEMO_ORDER.orderRef, "PAT-AAAAAA")).toBeUndefined();
  });
  it("rejects a missing order reference", () => {
    expect(findOrderByRefs(orders, "", DEMO_ORDER.patientRef)).toBeUndefined();
  });
});
