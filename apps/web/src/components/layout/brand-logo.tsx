import Image from "next/image";
import { cn } from "@/lib/utils";

/** Wide wordmark — use height + w-auto, not square dimensions. */
export function BrandLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt="Anil Ji Chaat"
      width={220}
      height={72}
      className={cn("h-12 w-auto shrink-0 object-contain sm:h-14 md:h-16", className)}
      priority={priority}
    />
  );
}
