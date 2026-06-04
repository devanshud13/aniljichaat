import Image from "next/image";
import { apiPublic } from "@/lib/api";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  let items: { url: string; type: string; caption?: string }[] = [];
  try {
    const res = await apiPublic<{ url: string; type: string; caption?: string }[]>(
      "/public/gallery/ambala"
    );
    items = res.data ?? [];
  } catch {
    items = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-[#8b1a1a]">Gallery</h1>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.length === 0 ? (
          <p className="text-[#5c4a3a]">Gallery coming soon.</p>
        ) : (
          items.map((item, i) => (
            <div key={i} className="mb-4 break-inside-avoid overflow-hidden rounded-xl">
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={item.caption ?? "Gallery"}
                  width={400}
                  height={300}
                  className="w-full object-cover"
                />
              ) : (
                <video src={item.url} controls className="w-full rounded-xl" />
              )}
              {item.caption && <p className="mt-2 text-sm">{item.caption}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
