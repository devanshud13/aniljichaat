import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { apiPublic } from "@/lib/api";

export const metadata = { title: "Offers" };
export const dynamic = "force-dynamic";

export default async function OffersPage() {
  let offers: { title: string; description?: string; discountType: string; value: number }[] = [];
  try {
    const res = await apiPublic<
      { title: string; description?: string; discountType: string; value: number }[]
    >("/public/offers/ambala");
    offers = res.data ?? [];
  } catch {
    offers = [];
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-serif text-4xl font-bold text-[#8b1a1a]">Offers</h1>
      <div className="mt-8 space-y-4">
        {offers.length === 0 ? (
          <p>No active offers right now. Check back soon!</p>
        ) : (
          offers.map((o) => (
            <Card key={o.title}>
              <CardContent className="p-6">
                <CardTitle>{o.title}</CardTitle>
                <p className="mt-2">{o.description}</p>
                <p className="mt-2 font-semibold text-[#c45c26]">
                  {o.discountType === "PERCENTAGE" ? `${o.value}% OFF` : `₹${o.value} OFF`}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
