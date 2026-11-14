import { describe, expect, it } from "vitest";

import { DEMO_ORDER, findOrderByRefs, hasAsymmetry, runClinicalAdvisor } from "./adaptfit";

const names = (r: ReturnType<typeof runClinicalAdvisor>) => r.map((a) => a.name);

describe("Clinical Advisor", () => {
  it("chemo port + limited dexterity on a shirt enables magnetic placket and port zipper", () => {
    const r = names(runClinicalAdvisor({ conditions: ["chemo_port", "limited_dexterity"], garment: "shirt", measurements: {} }));
    expect(r).toContain("Magnetic Placket");
    expect(r).toContain("Concealed Two-Way Port Zipper");
  });

  it("recommends asymmetric tailoring when left/right differ by 2 cm or more", () => {
    expect(hasAsymmetry({ armL: 58, armR: 60 })).toBe(true);
    expect(hasAsymmetry({ armL: 58, armR: 59.5 })).toBe(false);
  });
});

describe("Order lookup privacy", () => {
  const orders = [DEMO_ORDER];
  it("opens the order only when both references match", () => {
    expect(findOrderByRefs(orders, " adp/2026/0042 ", "pat-7q3k9m")?.token).toBe(DEMO_ORDER.token);
  });
  it("rejects a wrong patient reference", () => {
    expect(findOrderByRefs(orders, DEMO_ORDER.orderRef, "PAT-AAAAAA")).toBeUndefined();
  });
  it("rejects a missing order reference", () => {
    expect(findOrderByRefs(orders, "", DEMO_ORDER.patientRef)).toBeUndefined();
  });
});
