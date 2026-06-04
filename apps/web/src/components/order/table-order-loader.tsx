"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GeneralOrderClient } from "@/components/order/general-order-client";
import { apiPublic } from "@/lib/api";

interface Props {
  outletSlug: string;
  tableSlug: string;
}

export function TableOrderLoader({ outletSlug, tableSlug }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [table, setTable] = useState<{ slug: string; tableNumber: number } | null>(null);
  const [outletName, setOutletName] = useState("Anil Ji Chaat");
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [items, setItems] = useState<
    {
      _id: string;
      name: string;
      price: number;
      description?: string;
      categoryId: string;
      imageUrl?: string;
    }[]
  >([]);

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([
      apiPublic<{
        outlet: { name: string };
        table: { slug: string; tableNumber: number };
      }>(`/public/tables/${outletSlug}/${tableSlug}`),
      apiPublic<{
        categories: { _id: string; name: string; slug: string }[];
        items: {
          _id: string;
          name: string;
          price: number;
          description?: string;
          categoryId: string;
          imageUrl?: string;
        }[];
      }>(`/public/menu/${outletSlug}`),
    ])
      .then(([tableRes, menuRes]) => {
        if (!tableRes.success || !tableRes.data?.table) {
          setError(
            tableRes.message ??
              `Table "${tableSlug}" not found for outlet "${outletSlug}". Check Tables in admin or run seed.`
          );
          setTable(null);
          return;
        }
        setTable(tableRes.data.table);
        setOutletName(tableRes.data.outlet.name);
        if (menuRes.success && menuRes.data) {
          setCategories(menuRes.data.categories);
          setItems(menuRes.data.items);
        }
      })
      .catch(() => {
        setError("Could not connect to server. Start API with: npx pnpm@9.15.0 dev:server");
      })
      .finally(() => setLoading(false));
  }, [outletSlug, tableSlug]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#5c4a3a]">
        <Loader2 className="h-6 w-6 animate-spin text-[#8b1a1a]" />
        Loading menu…
      </div>
    );
  }

  if (!table) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-brand text-2xl font-extrabold text-[#8b1a1a]">Invalid Table QR</h1>
        <p className="mt-2 text-sm text-[#5c4a3a]">{error || "Please scan a valid table QR code."}</p>
        <p className="mt-4 text-xs text-[#9a8b7a]">
          URL: /order/{tableSlug}?outlet={outletSlug}
        </p>
      </div>
    );
  }

  return (
    <GeneralOrderClient
      outletSlug={outletSlug}
      outletName={outletName}
      table={table}
      categories={categories}
      items={items}
    />
  );
}
