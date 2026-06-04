"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { optimizedImageUrl } from "@/lib/image-url";
import {
  UtensilsCrossed,
  Tag,
  Quote,
  MapPin,
  Clock,
  ArrowRight,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

interface HomeSectionsProps {
  items: { name: string; price: number; description?: string; imageUrl?: string }[];
  offers: { title: string; description?: string }[];
  content: Record<string, unknown>;
}

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.45 },
};

export function HomeSections({ items, offers, content }: HomeSectionsProps) {
  const about = content["home.about"] as { title?: string; text?: string } | undefined;
  const testimonials = content["home.testimonials"] as {
    items?: { name: string; text: string; rating: number }[];
  };

  return (
    <>
      {/* Popular items */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-6 md:pt-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#fff8f0] to-transparent" />
        <SectionHeading label="Taste the Favourites" title="Our Popular Items" />
        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.article
              key={item.name}
              {...fadeUp}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group overflow-hidden rounded-2xl border border-[#e8dcc8]/80 bg-white shadow-[0_4px_24px_rgba(61,41,20,0.06)] transition-all duration-300 hover:-translate-y-1.5 hover:border-[#e5b54f]/50 hover:shadow-[0_16px_40px_rgba(139,26,26,0.12)]"
            >
              <div className="relative overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={optimizedImageUrl(item.imageUrl, 480)}
                    alt={item.name}
                    width={480}
                    height={208}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-[#f5e6d3] to-[#fff0dc]">
                    <UtensilsCrossed className="h-12 w-12 text-[#c9a36b]/70" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0c0c]/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="p-5">
                <h3 className="font-serif text-lg font-bold text-[#2a1810]">{item.name}</h3>
                {item.description && (
                  <p className="mt-2 line-clamp-2 font-sans text-sm leading-relaxed text-[#5c4a3a]/90">
                    {item.description}
                  </p>
                )}
                <p className="mt-4 font-serif text-xl font-bold text-[#8b1a1a]">₹{item.price}</p>
              </div>
            </motion.article>
          ))}
        </div>
        <motion.div {...fadeUp} className="mt-10 text-center">
          <Button
            asChild
            className="font-ui h-12 rounded-xl bg-[#8b1a1a] px-8 text-[15px] font-semibold tracking-wide text-white shadow-lg hover:bg-[#6d1515]"
          >
            <Link href="/menu">
              View Full Menu
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>
      </section>

      {/* Our Story */}
      {about && (
        <section className="relative overflow-hidden bg-[#1a0c0c] px-4 py-20 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5b54f' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#8b1a1a]/40 via-transparent to-[#0a0505]/80" />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <motion.div {...fadeUp} className="lg:pr-4">
              <SectionHeading label="Since 1966" title={about.title ?? "Our Story"} light align="left" />
            </motion.div>
            <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
              <p className="font-sans text-base font-light leading-relaxed text-white/85 md:text-lg">
                {about.text}
              </p>
              <Button
                asChild
                className="font-ui mt-8 h-12 rounded-xl border-2 border-[#e5b54f] bg-transparent px-8 text-[15px] font-semibold text-[#e5b54f] hover:bg-[#e5b54f]/10"
              >
                <Link href="/about">
                  Read Our Story
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Current Offers */}
      {offers.length > 0 && (
        <section className="bg-gradient-to-b from-[#fff8f0] to-[#f5ebe0] px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <SectionHeading label="Limited Time" title="Current Offers" />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {offers.map((o, i) => (
                <motion.div
                  key={o.title}
                  {...fadeUp}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-[#e5b54f]/30 bg-white p-6 shadow-md transition-all hover:-translate-y-1 hover:shadow-xl md:p-8"
                >
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#e5b54f]/10 transition-transform group-hover:scale-110" />
                  <div className="relative flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8b1a1a] text-[#e5b54f] shadow-inner">
                      <Tag className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#2a1810]">{o.title}</h3>
                      {o.description && (
                        <p className="mt-2 font-sans text-sm leading-relaxed text-[#5c4a3a]">
                          {o.description}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <motion.div {...fadeUp} className="mt-10 text-center">
              <Button
                asChild
                className="font-ui h-12 rounded-xl bg-[#e5b54f] px-8 text-[15px] font-semibold text-[#1a1208] hover:bg-[#d4a347]"
              >
                <Link href="/order">Order &amp; Save</Link>
              </Button>
            </motion.div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials?.items && testimonials.items.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-20">
          <SectionHeading label="Guest Love" title="What People Say" />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {testimonials.items.map((t, i) => (
              <motion.blockquote
                key={t.name}
                {...fadeUp}
                transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl border border-[#e8dcc8] bg-white p-8 shadow-[0_8px_30px_rgba(61,41,20,0.06)] transition-shadow hover:shadow-[0_12px_40px_rgba(139,26,26,0.1)]"
              >
                <Quote className="absolute left-6 top-6 h-10 w-10 text-[#e5b54f]/25" />
                <div className="relative">
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star
                        key={si}
                        className={cn(
                          "h-4 w-4",
                          si < (t.rating ?? 5)
                            ? "fill-[#e5b54f] text-[#e5b54f]"
                            : "fill-none text-[#e8dcc8]"
                        )}
                      />
                    ))}
                  </div>
                  <p className="font-serif text-lg italic leading-relaxed text-[#3d2914]">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <footer className="mt-6 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8b1a1a] font-ui text-sm font-bold text-[#e5b54f]">
                      {t.name.charAt(0)}
                    </span>
                    <cite className="font-ui text-sm font-semibold not-italic text-[#5c4a3a]">
                      {t.name}
                    </cite>
                  </footer>
                </div>
              </motion.blockquote>
            ))}
          </div>
        </section>
      )}

      {/* Visit Us */}
      <section className="relative overflow-hidden px-4 py-24">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/chat_image.png)" }}
        />
        <div className="absolute inset-0 bg-[#1a0c0c]/88" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#8b1a1a]/30 to-transparent" />
        <motion.div
          {...fadeUp}
          className="relative mx-auto max-w-2xl text-center"
        >
          <SectionHeading label="Jaggi City Centre" title="Visit Us Today" light />
          <p className="mx-auto mt-6 flex items-center justify-center gap-2 font-sans text-base text-white/80">
            <MapPin className="h-5 w-5 shrink-0 text-[#e5b54f]" />
            Sena Nagar, Ambala City, Haryana
          </p>
          <p className="mt-2 flex items-center justify-center gap-2 font-sans text-sm text-white/65">
            <Clock className="h-4 w-4 text-[#e5b54f]/80" />
            Open daily · 11:00 AM – 10:00 PM
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              asChild
              className="font-ui h-12 rounded-xl bg-[#e5b54f] px-8 text-[15px] font-semibold text-[#1a1208] hover:bg-[#d4a347]"
            >
              <Link href="/contact">
                Get Directions
                <MapPin className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              className="font-ui h-12 rounded-xl border-2 border-white/80 bg-transparent px-8 text-[15px] font-semibold text-white hover:bg-white/10"
            >
              <Link href="/order">Order Online</Link>
            </Button>
          </div>
        </motion.div>
      </section>
    </>
  );
}
