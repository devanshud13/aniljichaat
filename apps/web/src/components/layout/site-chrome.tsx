"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

function hidePublicChrome(pathname: string) {
  return pathname.startsWith("/admin") || pathname === "/login";
}

export function SiteHeader() {
  const pathname = usePathname();
  if (hidePublicChrome(pathname)) return null;
  return <Header />;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (hidePublicChrome(pathname)) return null;
  return <Footer />;
}
