"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/brand-logo";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "About" },
  { href: "/clients", label: "Our Clients" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
  { href: "/outlets", label: "Outlets" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8dcc8] bg-[#fff8f0]/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 lg:gap-4">
        <Link
          href="/"
          className="group flex min-w-0 shrink-0 items-center gap-3 transition-opacity hover:opacity-90"
        >
          <BrandLogo priority className="transition-transform group-hover:scale-[1.02]" />
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="font-brand text-lg font-extrabold text-[#8b1a1a] md:text-xl">
              Anil Ji Chaat
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#e0892a]">
              Ambala · Since 1966
            </span>
          </span>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-end gap-0.5 md:flex lg:gap-1">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                title={l.label}
                className={cn(
                  "relative shrink-0 whitespace-nowrap rounded-full px-2 py-2 text-xs font-medium transition-colors lg:px-2.5 lg:text-sm",
                  active ? "text-[#8b1a1a]" : "text-[#5c4a3a] hover:text-[#8b1a1a]"
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-[#e0892a]" />
                )}
              </Link>
            );
          })}
          <Button asChild size="sm" className="ml-1 shrink-0 gap-1.5 rounded-full lg:ml-2">
            <Link href="/order">
              <ShoppingBag className="h-4 w-4" />
              Order Now
            </Link>
          </Button>
        </nav>

        <button
          className="rounded-lg p-2 text-[#8b1a1a] md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <nav
        className={cn(
          "overflow-hidden border-t border-[#e8dcc8] bg-[#fff8f0] transition-all md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-2 py-2 text-[#5c4a3a] hover:bg-[#f5e6d3]"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <Button asChild size="sm" className="mt-2 gap-1.5">
            <Link href="/order" onClick={() => setOpen(false)}>
              <ShoppingBag className="h-4 w-4" />
              Order Now
            </Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
