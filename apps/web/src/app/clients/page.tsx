import Image from "next/image";
import { Building2 } from "lucide-react";
import { apiPublic } from "@/lib/api";

export const metadata = { title: "Our Clients" };
export const dynamic = "force-dynamic";

interface ClientItem {
  _id: string;
  name: string;
  imageUrl?: string;
}

export default async function ClientsPage() {
  let clients: ClientItem[] = [];
  try {
    const res = await apiPublic<ClientItem[]>("/public/clients");
    clients = res.data ?? [];
  } catch {
    clients = [];
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-brand text-4xl font-extrabold text-[#8b1a1a]">Our Clients</h1>
      <p className="mt-2 text-[#5c4a3a]">
        Trusted by leading hotels, caterers, and groups across India.
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {clients.length === 0 ? (
          <p className="text-[#5c4a3a]">Client list coming soon.</p>
        ) : (
          clients.map((c) => (
            <div
              key={c._id}
              className="flex flex-col items-center rounded-2xl border border-[#e8dcc8] bg-white p-6 text-center shadow-sm"
            >
              <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-[#fbf3e8]">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.name}
                    width={200}
                    height={112}
                    className="max-h-28 w-full object-contain p-2"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-[#8b1a1a]/40" />
                )}
              </div>
              <h2 className="mt-4 font-brand text-sm font-bold uppercase tracking-wide text-[#3d2914]">
                {c.name}
              </h2>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
