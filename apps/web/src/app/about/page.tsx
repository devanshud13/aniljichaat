import { apiPublic } from "@/lib/api";

export const metadata = { title: "About Us" };

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  let data: Record<string, { title?: string; text?: string }> = {};
  try {
    const res = await apiPublic<Record<string, { title?: string; text?: string }>>(
      "/public/content/ambala/about"
    );
    data = res.data ?? {};
  } catch {
    data = {};
  }

  const sections = [
    { key: "about.history", title: "Our History" },
    { key: "about.mission", title: "Our Mission" },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-brand text-4xl font-extrabold text-[#8b1a1a]">About Us</h1>
      <div className="mt-12 space-y-12">
        {sections.map((s) => {
          const block = data[s.key];
          return (
            <section key={s.key}>
              <h2 className="font-brand text-2xl font-bold text-[#8b1a1a]">{block?.title ?? s.title}</h2>
              <p className="mt-4 leading-relaxed text-[#5c4a3a]">
                {block?.text ??
                  "Anil Ji Chaat has been serving authentic street food in Ambala for years, bringing joy one plate at a time."}
              </p>
            </section>
          );
        })}
        <section>
          <h2 className="font-brand text-2xl font-bold text-[#8b1a1a]">Why Choose Us</h2>
          <ul className="mt-4 list-inside list-disc space-y-2 text-[#5c4a3a]">
            <li>Fresh ingredients daily</li>
            <li>Hygienic preparation</li>
            <li>Authentic recipes</li>
            <li>Friendly service</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
