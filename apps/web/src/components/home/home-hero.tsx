import Image from "next/image";
import Link from "next/link";
import { BookOpen, Heart, MapPin, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeHeroProps {
  subtitle?: string;
}

export function HomeHero({
  subtitle = "From the heart of Ambala to your plate — experience the magic of real chaat.",
}: HomeHeroProps) {
  return (
    <section className="relative min-h-[560px] overflow-hidden md:min-h-[620px] lg:min-h-[680px]">
      <Image
        src="/chat_image.png"
        alt=""
        fill
        priority
        className="object-cover object-[65%_center] sm:object-[70%_center]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0505]/92 via-[#1a0c0c]/72 to-[#0a0505]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0505]/70 via-transparent to-[#0a0505]/20" />

      <div
        className="absolute right-4 top-20 z-20 hidden rounded-full border-2 border-dashed border-[#e5b54f]/80 bg-[#1a0c0c]/75 px-5 py-4 text-center shadow-xl backdrop-blur-sm md:right-8 md:top-24 lg:block"
        aria-hidden
      >
        <p className="font-serif text-sm leading-snug text-white">
          The Taste
          <br />
          <span className="text-lg font-bold text-[#e5b54f]">You Love</span>
          <br />
          <span className="text-xs tracking-wide text-white/80">Since Years</span>
        </p>
      </div>

      <Link
        href="/order"
        className="absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 items-center gap-2 rounded-l-lg bg-[#e5b54f] px-2.5 py-5 text-xs font-serif font-bold tracking-wide text-[#2a1810] shadow-lg transition-colors hover:bg-[#d4a347] lg:flex lg:flex-col"
      >
        <QrCode className="h-5 w-5 shrink-0" />
        <span className="[writing-mode:vertical-rl] rotate-180">Scan QR to Order</span>
      </Link>

      <div className="relative mx-auto flex max-w-7xl items-center px-4 pb-28 pt-14 md:pb-32 md:pt-16 lg:px-8 lg:pb-36 lg:pt-20">
        <div className="max-w-xl text-center lg:text-left">
          <p className="flex items-center justify-center gap-2.5 text-white lg:justify-start">
            <span className="font-elegant text-[2rem] leading-none tracking-wide sm:text-[2.35rem] md:text-[2.6rem]">
              Ambala&apos;s Most Loved
            </span>
            <Heart className="mt-1 h-5 w-5 shrink-0 stroke-[#e5b54f]" strokeWidth={1.25} fill="none" />
          </p>

          <h1 className="mt-1 leading-[0.9]">
            <span className="block font-serif text-[2.75rem] font-extrabold tracking-tight text-white sm:text-[3.25rem] md:text-[3.75rem] lg:text-[4.25rem]">
              Anil Ji
            </span>
            <span className="font-brush -mt-1 block text-[4.5rem] leading-[0.85] text-[#e5b54f] drop-shadow-sm sm:text-[5.25rem] md:text-[6rem] lg:text-[6.75rem]">
              Chaat
            </span>
          </h1>

          <div className="mx-auto mt-6 flex max-w-sm items-center justify-center gap-2 lg:mx-0 lg:justify-start">
            <span className="font-serif text-[10px] text-[#e5b54f]/90">◆</span>
            <span className="h-px flex-1 max-w-14 bg-[#e5b54f]/55" />
            <span className="flex items-center gap-1.5 text-[#e5b54f]">
              <span className="text-xs">★</span>
              <span className="text-base">★</span>
              <span className="text-xs">★</span>
            </span>
            <span className="h-px flex-1 max-w-14 bg-[#e5b54f]/55" />
            <span className="font-serif text-[10px] text-[#e5b54f]/90">◆</span>
          </div>

          <p className="mt-6 font-serif text-xl font-bold text-white md:text-2xl">
            Authentic Taste. Royal Experience.
          </p>
          <p className="mx-auto mt-4 max-w-md font-sans text-[15px] font-light leading-relaxed text-white/80 md:text-base lg:mx-0">
            {subtitle}
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4 lg:justify-start">
            <Button
              asChild
              size="lg"
              className="font-ui h-[3.25rem] gap-2.5 rounded-xl bg-[#e5b54f] px-8 text-[15px] font-semibold tracking-[0.02em] text-[#1a1208] shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:bg-[#d4a347]"
            >
              <Link href="/menu">
                Explore Menu
                <BookOpen className="h-[1.125rem] w-[1.125rem] stroke-[2.25]" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="font-ui h-[3.25rem] gap-2.5 rounded-xl border-2 border-white/90 bg-white/5 px-8 text-[15px] font-semibold tracking-[0.02em] text-white backdrop-blur-sm hover:bg-white/15"
            >
              <Link href="/outlets">
                Find Outlet
                <MapPin className="h-[1.125rem] w-[1.125rem] stroke-[2.25]" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 leading-[0]">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="block h-[4.5rem] w-full sm:h-24 md:h-28 lg:h-32"
          aria-hidden
        >
          <path
            d="M0,78 C240,115 400,25 620,55 C840,85 1020,20 1260,48 C1360,62 1410,42 1440,35 L1440,120 L0,120 Z"
            fill="#fff8f0"
          />
        </svg>
      </div>
    </section>
  );
}
