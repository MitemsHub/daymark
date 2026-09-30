"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Calculator" },
  { href: "/week", label: "Week" },
  { href: "/callover", label: "Call Over" },
  { href: "/investments", label: "Investments" },
  { href: "/grades", label: "Member Grade" },
  { href: "/data", label: "Data" },
];

/** The favicon's daymark mark, inline. Beacon on its ink baseline. */
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="6" fill="#f7f5f0" />
      <rect x="4" y="4" width="24" height="5" rx="1.5" fill="#16302b" />
      <path d="M16 11.2 L20.4 20.4 H11.6 Z" fill="#b3491d" />
      <rect x="6" y="21.6" width="20" height="2.2" rx="1.1" fill="#16302b" />
    </svg>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b hairline bg-paper/95 backdrop-blur-sm sticky top-0 z-40">
      <nav
        aria-label="Primary"
        className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4"
      >
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <Mark className="w-8 h-8 rounded-md transition-transform duration-300 group-hover:-translate-y-0.5" />
          <span className="display text-lg tracking-tight">Daymark</span>
        </Link>

        <ul className="hidden sm:flex items-center gap-6">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-link inline-block py-1 text-[13px] font-medium uppercase tracking-[0.1em] transition-colors ${
                    active ? "text-stamp" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="sm:hidden flex flex-col justify-center gap-[5px] w-9 h-9 border hairline rounded-sm px-2"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={`block h-[2px] w-full rounded-full bg-ink transition-transform duration-300 ${open ? "rotate-45 translate-y-[3.5px]" : ""}`}
          />
          <span
            className={`block h-[2px] w-full rounded-full bg-ink transition-transform duration-300 ${open ? "-rotate-45 -translate-y-[3.5px]" : ""}`}
          />
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`expand sm:hidden border-t hairline bg-paper ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="expand-inner">
          <ul className="px-4 pb-4 pt-2 space-y-0.5">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className={`block px-3 py-2.5 text-sm uppercase tracking-[0.08em] rounded-sm ${
                      active ? "text-stamp font-semibold bg-stamp-wash/60" : "text-ink-soft"
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </header>
  );
}
