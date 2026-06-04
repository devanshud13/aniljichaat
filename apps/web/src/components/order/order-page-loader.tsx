"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { GeneralOrderClient } from "@/components/order/general-order-client";
import { apiPublic } from "@/lib/api";

const DEFAULT_OUTLET = "ambala";

export function OrderPageLoader() {
  const [loading, setLoading] = useState(true);
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
          setItems(res.data.items);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b1a1a]" />
      </div>
    );
  }

  return <GeneralOrderClient outletSlug={DEFAULT_OUTLET} categories={categories} items={items} />;
}
