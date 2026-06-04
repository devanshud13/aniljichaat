import type { Metadata } from "next";
import {
  Playfair_Display,
  DM_Sans,
  Baloo_2,
  Allura,
  Kaushan_Script,
  Outfit,
} from "next/font/google";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/layout/site-chrome";
import { Providers } from "@/components/providers";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

/** Thin script — "Ambala's Most Loved" */
const allura = Allura({
  variable: "--font-elegant",
  subsets: ["latin"],
  weight: "400",
});

/** Bold brush — "Chaat" */
const kaushan = Kaushan_Script({
  variable: "--font-brush",
  subsets: ["latin"],
  weight: "400",
});

/** Hero CTAs & clean UI labels */
const outfit = Outfit({
  variable: "--font-ui",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Anil Ji Chaat | Authentic Street Food in Ambala",
    template: "%s | Anil Ji Chaat",
  },
  description:
    "Premium chaat, golgappe, and street food at Jaggi City Centre, Ambala. Order online or visit us today.",
  openGraph: {
    title: "Anil Ji Chaat",
    description: "Authentic Street Food in Ambala, Haryana",
    locale: "en_IN",
    type: "website",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Anil Ji Chaat",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Jaggi City Centre, Sena Nagar",
    addressLocality: "Ambala City",
    addressRegion: "Haryana",
    addressCountry: "IN",
  },
  servesCuisine: "Indian Street Food",
  priceRange: "₹₹",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${playfair.variable} ${dmSans.variable} ${baloo.variable} ${allura.variable} ${kaushan.variable} ${outfit.variable} antialiased`}
      >
        <Providers>
          <SiteHeader />
          <main className="min-h-[70vh]">{children}</main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
