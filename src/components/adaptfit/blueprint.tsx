import type { Accommodation, GarmentId, Zone } from "@/lib/adaptfit";

// Marker positions on a 200x240 front-view blueprint.
const TOP_ZONES: Record<Zone, { x: number; y: number }> = {
  placket: { x: 100, y: 120 },
  port: { x: 128, y: 70 },
  seams: { x: 52, y: 170 },
  sleeve: { x: 36, y: 72 },
  back: { x: 148, y: 205 },
  asym: { x: 168, y: 110 },
};
const BOTTOM_ZONES: Record<Zone, { x: number; y: number }> = {
  placket: { x: 100, y: 40 },
  port: { x: 100, y: 40 },
  seams: { x: 62, y: 150 },
  sleeve: { x: 62, y: 150 },
  back: { x: 100, y: 22 },
  asym: { x: 140, y: 190 },
};

export function Blueprint({ garment, accommodations }: { garment: GarmentId; accommodations: Accommodation[] }) {
  const isBottom = garment === "trousers";
  const zones = isBottom ? BOTTOM_ZONES : TOP_ZONES;

  return (
    <figure className="space-y-5">
      <div className="relative overflow-hidden rounded-2xl border bg-primary-soft">
        <svg
          viewBox="0 0 200 240"
          className="mx-auto block h-72 w-full max-w-xs"
          role="img"
          aria-label={`Blueprint of your ${garment} showing ${accommodations.length} adaptive features`}
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M10 0H0V10" fill="none" className="stroke-primary/10" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="200" height="240" fill="url(#grid)" />
          {isBottom ? (
            <path
              d="M58 14h84l10 210h-38l-14-140-14 140H48z"
              className="fill-card stroke-primary"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          ) : (
            <path
              d={
                garment === "dress"
                  ? "M76 22c6 10 14 14 24 14s18-4 24-14l34 16 18 44-22 10-10-20 14 160H42l14-160-10 20-22-10 18-44z"
                  : "M76 22c6 10 14 14 24 14s18-4 24-14l34 16 18 50-24 10-10-24v130H58V74L48 98 24 88l18-50z"
              }
              className="fill-card stroke-primary"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          )}
          {!isBottom && <path d="M100 36v170" className="stroke-primary/40" strokeWidth="1.5" strokeDasharray="4 4" />}
          {accommodations.map((a, i) => {
            const p = zones[a.zone];
            const offset = accommodations.slice(0, i).filter((b) => zones[b.zone] === p).length * 18;
            return (
              <g key={a.id} transform={`translate(${p.x + offset} ${p.y})`}>
                <circle r="11" className="fill-primary" />
                <text textAnchor="middle" dy="4.5" className="fill-primary-foreground font-sans text-[12px] font-bold">
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
        <span className="absolute left-4 top-3 font-sans text-xs font-bold uppercase tracking-widest text-primary">
          Front view
        </span>
      </div>
      <figcaption>
        <ol className="space-y-3">
          {accommodations.map((a, i) => (
            <li key={a.id} className="flex gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <span>
                <span className="block font-bold">{a.name}</span>
                <span className="block text-sm text-muted-foreground">{a.description}</span>
              </span>
            </li>
          ))}
          {accommodations.length === 0 && (
            <li className="text-muted-foreground">Your clinician will confirm accommodations at review.</li>
          )}
        </ol>
      </figcaption>
    </figure>
  );
}
