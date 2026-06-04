"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { MenuClient } from "@/components/menu/menu-client";
import { apiPublic } from "@/lib/api";

const DEFAULT_OUTLET = "ambala";

export function MenuPageLoader() {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ _id: string; name: string; slug: string }[]>([]);
  const [items, setItems] = useState<
    (import("@/components/menu/menu-item-grid").MenuItemDisplay & { categoryId: string })[]
  >([]);

  useEffect(() => {
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
    }>(`/public/menu/${DEFAULT_OUTLET}`)
      .then((res) => {
        if (res.success && res.data) {
          setCategories(res.data.categories);
          setItems(
            res.data.items.map((i) => ({
              ...i,
              categoryId: String(i.categoryId),
            }))
          );
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b1a1a]" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="mt-8 rounded-lg bg-[#fbf3e8] p-6 text-center text-[#5c4a3a]">
        Menu is empty. Add items in Admin → Menu Management (and ensure API server is running).
      </p>
    );
  }

  return <MenuClient categories={categories} items={items} />;
}
