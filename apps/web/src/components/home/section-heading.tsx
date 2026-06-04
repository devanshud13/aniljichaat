"use client";

import { motion } from "framer-motion";

interface SectionHeadingProps {
  label?: string;
  title: string;
  light?: boolean;
  align?: "center" | "left";
}

export function SectionHeading({
  label,
  title,
  light = false,
  align = "center",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={alignClass}
    >
      {label && (
        <p
          className={`font-elegant text-2xl md:text-[1.75rem] ${
            light ? "text-[#e5b54f]/90" : "text-[#8b1a1a]/80"
          }`}
        >
          {label}
        </p>
      )}
      <h2
        className={`font-serif text-3xl font-bold tracking-tight md:text-4xl ${
          light ? "text-white" : "text-[#2a1810]"
        } ${label ? "mt-1" : ""}`}
      >
        {title}
      </h2>
      <div
        className={`mt-4 flex items-center gap-2 ${align === "center" ? "justify-center" : ""}`}
      >
        <span className={`font-serif text-[10px] ${light ? "text-[#e5b54f]/80" : "text-[#c9a36b]"}`}>
          ◆
        </span>
        <span className={`h-px w-12 ${light ? "bg-[#e5b54f]/50" : "bg-[#c9a36b]/60"}`} />
        <span className={`flex items-center gap-1 ${light ? "text-[#e5b54f]" : "text-[#c9a36b]"}`}>
          <span className="text-xs">★</span>
          <span className="text-sm">★</span>
          <span className="text-xs">★</span>
        </span>
        <span className={`h-px w-12 ${light ? "bg-[#e5b54f]/50" : "bg-[#c9a36b]/60"}`} />
        <span className={`font-serif text-[10px] ${light ? "text-[#e5b54f]/80" : "text-[#c9a36b]"}`}>
          ◆
        </span>
      </div>
    </motion.div>
  );
}
