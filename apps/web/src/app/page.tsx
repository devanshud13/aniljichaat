import { apiPublic } from "@/lib/api";
import { HomeHero } from "@/components/home/home-hero";
import { HomeSections } from "@/components/home/home-sections";

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [content, menu, offers] = await Promise.all([
      apiPublic<Record<string, unknown>>("/public/content/ambala/home"),
      apiPublic<{
        items: {
          name: string;
          price: number;
          description?: string;
          slug: string;
          imageUrl?: string;
        }[];
      }>("/public/menu/ambala"),
      apiPublic<{ title: string; description?: string }[]>("/public/offers/ambala"),
    ]);
    return {
      content: content.data ?? {},
      items:
        (
          menu.data as {
            items?: { name: string; price: number; description?: string; imageUrl?: string }[];
          }
        )?.items?.slice(0, 6) ?? [],
      offers: offers.data ?? [],
    };
  } catch {
    return { content: {}, items: [], offers: [] };
  }
}

export default async function HomePage() {
  const { content, items, offers } = await getHomeData();
  const hero = (content["home.hero"] as { title?: string; subtitle?: string }) ?? {
    title: "Anil Ji Chaat",
    subtitle: "Authentic Street Food from the Heart of Ambala",
  };

  return (
    <>
      <HomeHero subtitle={hero.subtitle} />
      <HomeSections items={items} offers={offers} content={content} />
    </>
  );
}
