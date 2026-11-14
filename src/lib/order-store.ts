// Browser-side order store for the demo portal. Read only after hydration (useEffect).
import { DEMO_ORDER, type PatientOrder } from "./adaptfit";

const KEY = "adaptfit.orders.v1";

export function loadOrders(): PatientOrder[] {
  if (typeof window === "undefined") return [DEMO_ORDER];
  try {
    const raw = window.localStorage.getItem(KEY);
    const saved: PatientOrder[] = raw ? JSON.parse(raw) : [];
    const demo = saved.find((o) => o.token === DEMO_ORDER.token);
    return [demo ?? DEMO_ORDER, ...saved.filter((o) => o.token !== DEMO_ORDER.token)];
  } catch {
    return [DEMO_ORDER];
  }
}

export function saveOrder(order: PatientOrder) {
  const orders = loadOrders().filter((o) => o.token !== order.token);
  window.localStorage.setItem(KEY, JSON.stringify([...orders, order]));
}
