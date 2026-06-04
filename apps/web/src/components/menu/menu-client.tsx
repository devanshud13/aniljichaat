"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { MenuItemGrid, type MenuItemDisplay } from "@/components/menu/menu-item-grid";
import { cn } from "@/lib/utils";

interface MenuClientProps {
  categories: { _id: string; name: string; slug: string }[];
  items: (MenuItemDisplay & { categoryId: string })[];
}

export function MenuClient({ categories, items }: MenuClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | "all">("all");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchCat = category === "all" || String(item.categoryId) === category;
      const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [items, search, category]);

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search dishes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <div className="no-scrollbar flex flex-wrap gap-2 overflow-x-auto">
          <Chip active={category === "all"} onClick={() => setCategory("all")}>
            All
          </Chip>
          {categories.map((c) => (
            <Chip key={c._id} active={category === c._id} onClick={() => setCategory(c._id)}>
              {c.name}
            </Chip>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <MenuItemGrid items={filtered} interactive={false} imageHeightClass="h-52" />
      </div>
      <p className="mt-6 text-center text-sm text-[#5c4a3a]">
        To order, use{" "}
        <Link href="/order" className="font-semibold text-[#8b1a1a] underline">
          Order Now
        </Link>{" "}
        or scan your table QR.
      </p>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium",
        active ? "bg-[#8b1a1a] text-white" : "bg-[#f5e6d3] text-[#5c4a3a]"
      )}
    >
      {children}
    </button>
  );
}
