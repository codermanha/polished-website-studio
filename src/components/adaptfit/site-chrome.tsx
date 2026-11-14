import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/intake", label: "Request a fitting" },
  { to: "/track", label: "Track my order" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-md" aria-label="AdaptFit home">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 3 4 6l2 4 2-1v12h8V9l2 1 2-4-4-3" />
          <path d="M8 3c1 2 2.5 3 4 3s3-1 4-3" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="12" cy="16" r="1" fill="currentColor" />
        </svg>
      </span>
      <span className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Adapt<span className="text-primary">Fit</span>
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="container-site flex h-18 items-center justify-between gap-4 py-3">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2.5 font-bold text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "bg-secondary text-secondary-foreground hover:text-secondary-foreground" }}
              activeOptions={{ exact: true }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetTitle className="font-display text-xl">Menu</SheetTitle>
            <nav aria-label="Mobile" className="mt-6 flex flex-col gap-2">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex min-h-12 items-center rounded-xl px-4 text-lg font-bold text-foreground hover:bg-muted"
                  activeProps={{ className: "bg-secondary text-secondary-foreground" }}
                  activeOptions={{ exact: true }}
                >
                  {n.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t bg-card">
      <div className="container-site grid gap-10 py-14 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-muted-foreground">
            Adaptive clothing, tailored to your body and your care — made with certified sustainable fabrics.
          </p>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground">Patients</h2>
          <ul className="space-y-2">
            <li><Link to="/intake" className="font-bold hover:text-primary">Request a fitting</Link></li>
            <li><Link to="/track" className="font-bold hover:text-primary">Track my order</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-3 font-sans text-sm font-bold uppercase tracking-widest text-muted-foreground">Your privacy</h2>
          <p className="text-sm text-muted-foreground">
            Your tracking link is private to you. Clinical notes are only seen by your care team.
          </p>
        </div>
      </div>
      <div className="border-t">
        <div className="container-site py-5 text-sm text-muted-foreground">© 2026 AdaptFit Apparel. Dignity-first design.</div>
      </div>
    </footer>
  );
}
