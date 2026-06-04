import Image from "next/image";
import { apiPublic } from "@/lib/api";

export const metadata = { title: "Achievements" };
export const dynamic = "force-dynamic";

interface AchievementItem {
  _id: string;
  caption: string;
  imageUrl: string;
}

export default async function AchievementsPage() {
  let items: AchievementItem[] = [];
  try {
    const res = await apiPublic<AchievementItem[]>("/public/achievements");
    items = res.data ?? [];
  } catch {
    items = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-brand text-4xl font-extrabold text-[#8b1a1a]">Achievements</h1>
      <p className="mt-2 text-[#5c4a3a]">Milestones and moments we are proud of.</p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 ? (
          <p className="text-[#5c4a3a]">Achievements coming soon.</p>
        ) : (
          items.map((item) => (
            <div
              key={item._id}
              className="overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white shadow-sm"
            >
              <div className="relative aspect-[4/3] bg-[#fbf3e8]">
                <Image
                  src={item.imageUrl}
                  alt={item.caption}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <p className="px-4 py-3 text-center text-sm font-medium text-[#3d2914]">
                {item.caption}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
