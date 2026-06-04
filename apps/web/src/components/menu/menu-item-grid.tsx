"use client";

import { Minus, Plus, UtensilsCrossed } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MenuItemDisplay {
  _id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
}

interface MenuItemGridProps {
  items: MenuItemDisplay[];
  getQty?: (id: string) => number;
  onAdd?: (item: MenuItemDisplay) => void;
  onChangeQty?: (id: string, delta: number) => void;
  imageHeightClass?: string;
  /** When false, only displays items (e.g. public menu page). */
  interactive?: boolean;
}

export function MenuItemGrid({
  items,
  getQty,
  onAdd,
  onChangeQty,
  imageHeightClass = "h-48",
  interactive = true,
}: MenuItemGridProps) {
  if (items.length === 0) {
    return <p className="text-[#5c4a3a]">No items in this category.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const q = interactive ? (getQty?.(item._id) ?? 0) : 0;
        return (
          <motion.div
            key={item._id}
            layout
            className="flex flex-col overflow-hidden rounded-2xl border border-[#e8dcc8] bg-white shadow-sm"
          >
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                className={cn("w-full object-cover", imageHeightClass)}
              />
            ) : (
              <div
                className={cn(
                  "flex w-full items-center justify-center bg-gradient-to-br from-[#f5e6d3] to-[#ffe9c7]",
                  imageHeightClass
                )}
              >
                <UtensilsCrossed className="h-10 w-10 text-[#c9a36b]" />
              </div>
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-semibold text-[#3d2914]">{item.name}</h3>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-[#5c4a3a]">{item.description}</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-[#c45c26]">₹{item.price}</span>
                {interactive && (
                  <>
                    {q === 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full"
                        onClick={() => onAdd?.(item)}
                      >
                        Add
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-full bg-[#8b1a1a] px-1 text-white">
                        <button
                          type="button"
                          className="p-1.5"
                          onClick={() => onChangeQty?.(item._id, -1)}
                          aria-label="Decrease"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-4 text-center text-sm font-semibold">{q}</span>
                        <button
                          type="button"
                          className="p-1.5"
                          onClick={() => onChangeQty?.(item._id, 1)}
                          aria-label="Increase"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
