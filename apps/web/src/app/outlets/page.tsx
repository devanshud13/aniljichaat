import { apiPublic } from "@/lib/api";

export const metadata = { title: "Outlets" };
export const dynamic = "force-dynamic";

export default async function OutletsPage() {
  let outlets: {
    name: string;
    slug: string;
    address: string;
    timings: string;
    phone: string;
    mapEmbedUrl?: string;
  }[] = [];
  try {
  const res = await apiPublic<
    {
      name: string;
      slug: string;
      address: string;
      timings: string;
      phone: string;
      mapEmbedUrl?: string;
    }[]
  >("/public/outlets");
  outlets = res.data ?? [];
  } catch {
    outlets = [{
      name: "Anil Ji Chaat - Ambala",
      slug: "ambala",
      address: "Jaggi City Centre, Sena Nagar, Ambala City, Haryana",
      timings: "11:00 AM - 10:00 PM",
      phone: "+919876543210",
    }];
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-brand text-4xl font-extrabold text-[#8b1a1a]">Our Outlets</h1>
      <div className="mt-8 space-y-8">
        {outlets.map((o) => (
          <div key={o.slug} className="rounded-xl border border-[#e8dcc8] bg-white p-6">
            <h2 className="font-brand text-2xl font-bold text-[#8b1a1a]">{o.name}</h2>
            <p className="mt-2 text-[#5c4a3a]">{o.address}</p>
            <p className="mt-2">Hours: {o.timings}</p>
            <p className="mt-2">Phone: {o.phone}</p>
            {o.mapEmbedUrl && (
              <iframe
                src={o.mapEmbedUrl}
                className="mt-4 h-64 w-full rounded-lg border-0"
                loading="lazy"
                title={`Map - ${o.name}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
