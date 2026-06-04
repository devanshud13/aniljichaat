"use client";

import Link from "next/link";
import { MapPin, Clock, Phone, ArrowUpRight } from "lucide-react";
import { BrandLogo } from "@/components/layout/brand-logo";

const quickLinks = [
  { href: "/menu", label: "Menu" },
  { href: "/about", label: "Our Story" },
  { href: "/clients", label: "Our Clients" },
  { href: "/achievements", label: "Achievements" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#120808] text-[#f5e6d3]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e5b54f]/50 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23e5b54f' fill-opacity='1'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 md:py-16">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <BrandLogo className="h-12 md:h-14" />
            <p className="font-elegant mt-4 text-2xl text-[#e5b54f]/90">Anil Ji Chaat</p>
            <p className="mt-3 max-w-sm font-sans text-sm font-light leading-relaxed text-[#f5e6d3]/75">
              Authentic street food from the heart of Ambala. Royal taste, homely warmth — since
              1966.
            </p>
            <div className="mt-6 space-y-3 font-sans text-sm text-[#f5e6d3]/80">
              <p className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e5b54f]" />
                Jaggi City Centre, Sena Nagar, Ambala City, Haryana
              </p>
              <p className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[#e5b54f]" />
                11:00 AM – 10:00 PM · Every day
              </p>
              <p className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#e5b54f]" />
                <a href="tel:+919876543210" className="transition-colors hover:text-[#e5b54f]">
                  +91 98765 43210
                </a>
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <h4 className="font-serif text-lg font-bold text-[#e5b54f]">Explore</h4>
            <div className="mt-1 h-0.5 w-10 bg-[#e5b54f]/40" />
            <ul className="mt-5 space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group font-ui flex items-center gap-1 text-sm font-medium text-[#f5e6d3]/75 transition-colors hover:text-[#e5b54f]"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <h4 className="font-serif text-lg font-bold text-[#e5b54f]">Order</h4>
            <div className="mt-1 h-0.5 w-10 bg-[#e5b54f]/40" />
            <p className="mt-5 font-sans text-sm font-light leading-relaxed text-[#f5e6d3]/75">
              Dine in, takeaway, or scan the table QR at our outlet.
            </p>
            <Link
              href="/order"
              className="font-ui mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-[#e5b54f] px-6 text-sm font-semibold text-[#1a1208] transition-colors hover:bg-[#d4a347]"
            >
              Order Now
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#e5b54f]/15 pt-8 text-center md:flex-row md:text-left">
          <p className="font-sans text-xs text-[#f5e6d3]/45">
            © {new Date().getFullYear()} Anil Ji Chaat. All rights reserved.
          </p>
          <p className="font-elegant text-lg text-[#e5b54f]/60">Ambala&apos;s Most Loved</p>
        </div>
      </div>
    </footer>
  );
}
