"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Calculator" },
  { href: "/week", label: "Week" },
  { href: "/investments", label: "Investments" },
  { href: "/grades", label: "Member Grade" },
  { href: "/data", label: "Data" },
];

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b hairline bg-paper/95 sticky top-0 z-40">
      <nav
        aria-label="Primary"
        className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
      >
        <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <span
            aria-hidden="true"
            className="text-stamp text-lg leading-none transition-transform duration-300 group-hover:-translate-y-0.5"
          >
            ▲
          </span>
          <span className="font-semibold tracking-tight">Daymark</span>
        </Link>

        <ul className="hidden sm:flex items-center gap-1">
          {links.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`nav-link px-3 py-1.5 text-sm rounded-sm transition-colors ${
                    active
                      ? "text-stamp font-semibold"
                      : "text-ink-soft hover:text-ink"
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
          className="sm:hidden px-2 py-1.5 text-sm border hairline rounded-sm"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
        </button>
      </nav>

      <div
        id="mobile-menu"
        className={`expand sm:hidden border-t hairline bg-paper ${open ? "open" : ""}`}
        aria-hidden={!open}
      >
        <div className="expand-inner">
          <ul className="px-4 pb-3 pt-1 space-y-1">
            {links.map((l) => {
              const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className={`block px-3 py-2 text-sm rounded-sm ${
                      active ? "text-stamp font-semibold" : "text-ink-soft"
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
