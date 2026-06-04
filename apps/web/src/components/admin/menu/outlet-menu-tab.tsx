"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useOutlets } from "@/hooks/use-outlets";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Sheet {
  _id: string;
  name: string;
}
interface CatalogItem {
  _id: string;
  name: string;
  price: number;
  imageUrl?: string;
}
interface AvailabilityRow {
  menuItemId: string;
  isAvailable: boolean;
  priceOverride?: number;
}

export function OutletMenuTab() {
  const qc = useQueryClient();
  const { data: outlets = [] } = useOutlets();
  const [outletId, setOutletId] = useState("");
  const [sheetIds, setSheetIds] = useState<Set<string>>(new Set());
  const [availability, setAvailability] = useState<Map<string, AvailabilityRow>>(new Map());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!outletId && outlets[0]) setOutletId(outlets[0]._id);
  }, [outlets, outletId]);

  const { data: sheets = [] } = useQuery({
    queryKey: ["admin-menu-sheets"],
    queryFn: async () => {
      const res = await apiAuth<Sheet[]>("/admin/menu/sheets");
      return res.data ?? [];
    },
  });

  const { data: catalog = [] } = useQuery({
    queryKey: ["admin-catalog-items"],
    queryFn: async () => {
      const res = await apiAuth<CatalogItem[]>("/admin/menu/items?catalog=true");
      return res.data ?? [];
    },
  });

  const { data: outletConfig, isLoading } = useQuery({
    queryKey: ["admin-outlet-menu", outletId],
    queryFn: async () => {
      const res = await apiAuth<{
        sheetIds: string[];
        sheetItemIds: string[];
        availability: { menuItemId: string; isAvailable: boolean; priceOverride?: number }[];
      }>(`/admin/menu/outlets/${outletId}/config`);
      return res.data;
    },
    enabled: !!outletId,
  });

  useEffect(() => {
    if (!outletConfig) return;
    setSheetIds(new Set(outletConfig.sheetIds));
    const map = new Map<string, AvailabilityRow>();
    for (const row of outletConfig.availability) {
      const id =
        typeof row.menuItemId === "object"
          ? (row.menuItemId as { _id?: string })._id ?? String(row.menuItemId)
          : String(row.menuItemId);
      map.set(id, { menuItemId: id, isAvailable: row.isAvailable, priceOverride: row.priceOverride });
    }
    setAvailability(map);
  }, [outletConfig]);

  const sheetItemIds = useMemo(() => new Set(outletConfig?.sheetItemIds ?? []), [outletConfig]);

  const itemsInSheets = useMemo(
    () => catalog.filter((c) => sheetItemIds.has(c._id)),
    [catalog, sheetItemIds]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return itemsInSheets;
    return itemsInSheets.filter((i) => i.name.toLowerCase().includes(q));
  }, [itemsInSheets, search]);

  const saveConfig = useMutation({
    mutationFn: async () => {
      await apiAuth(`/admin/menu/outlets/${outletId}/config`, {
        method: "PUT",
        body: JSON.stringify({ sheetIds: [...sheetIds] }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-outlet-menu", outletId] }),
  });

  const saveAvailability = useMutation({
    mutationFn: async () => {
      const items = itemsInSheets.map((item) => {
        const row = availability.get(item._id);
        return {
          menuItemId: item._id,
          isAvailable: row?.isAvailable ?? false,
          priceOverride: row?.priceOverride ?? null,
        };
      });
      await apiAuth(`/admin/menu/outlets/${outletId}/availability`, {
        method: "PUT",
        body: JSON.stringify({ items }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-outlet-menu", outletId] }),
  });

  function toggleSheet(id: string) {
    setSheetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAvailable(itemId: string) {
    setAvailability((prev) => {
      const next = new Map(prev);
      const cur = next.get(itemId);
      next.set(itemId, {
        menuItemId: itemId,
        isAvailable: !(cur?.isAvailable ?? false),
        priceOverride: cur?.priceOverride,
      });
      return next;
    });
  }

  function setAllAvailable(on: boolean) {
    setAvailability((prev) => {
      const next = new Map(prev);
      for (const item of itemsInSheets) {
        const cur = next.get(item._id);
        next.set(item._id, {
          menuItemId: item._id,
          isAvailable: on,
          priceOverride: cur?.priceOverride,
        });
      }
      return next;
    });
  }

  const enabledCount = itemsInSheets.filter((i) => availability.get(i._id)?.isAvailable).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <select
          value={outletId}
          onChange={(e) => setOutletId(e.target.value)}
          className="rounded-md border border-[#d4c4b0] bg-white px-3 py-2 text-sm"
        >
          {outlets.map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
          ))}
        </select>
        <span className="text-sm text-[#5c4a3a]">
          {enabledCount} / {itemsInSheets.length} items available for customers
        </span>
      </div>

      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
        <h3 className="font-semibold text-[#3d2914]">Assign menu sheets to this outlet</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {sheets.map((s) => (
            <button
              key={s._id}
              type="button"
              onClick={() => toggleSheet(s._id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium",
                sheetIds.has(s._id) ? "bg-[#8b1a1a] text-white" : "bg-[#f5e6d3] text-[#5c4a3a]"
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
        <Button className="mt-4" disabled={saveConfig.isPending} onClick={() => saveConfig.mutate()}>
          {saveConfig.isPending ? "Saving..." : "Save sheet assignment"}
        </Button>
      </div>

      <div className="mt-6 rounded-2xl border border-[#e8dcc8] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold text-[#3d2914]">Item availability at this outlet</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setAllAvailable(true)}>
              Enable all
            </Button>
            <Button size="sm" variant="outline" onClick={() => setAllAvailable(false)}>
              Disable all
            </Button>
            <Button size="sm" disabled={saveAvailability.isPending} onClick={() => saveAvailability.mutate()}>
              {saveAvailability.isPending ? "Saving..." : "Save availability"}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="mt-4 text-sm text-[#5c4a3a]">Loading...</p>
        ) : sheetIds.size === 0 ? (
          <p className="mt-4 text-sm text-[#5c4a3a]">Assign at least one menu sheet above.</p>
        ) : itemsInSheets.length === 0 ? (
          <p className="mt-4 text-sm text-[#5c4a3a]">Selected sheets have no items yet.</p>
        ) : (
          <>
            <input
              type="search"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mt-3 w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
            />
            <div className="mt-4 max-h-[520px] space-y-1 overflow-y-auto">
              {filtered.map((item) => {
                const on = availability.get(item._id)?.isAvailable ?? false;
                return (
                  <label
                    key={item._id}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2",
                      on ? "bg-green-50" : "hover:bg-[#fbf3e8]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleAvailable(item._id)}
                    />
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[#f5e6d3]" />
                    )}
                    <span className="flex-1 text-sm text-[#3d2914]">{item.name}</span>
                    <span className="text-xs text-[#c45c26]">₹{item.price}</span>
                  </label>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
