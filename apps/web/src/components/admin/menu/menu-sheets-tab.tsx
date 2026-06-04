"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiAuth } from "@/lib/api";
import { cn, slugify } from "@/lib/utils";

interface Sheet {
  _id: string;
  name: string;
  slug: string;
}
interface CatalogItem {
  _id: string;
  name: string;
  price: number;
  categoryId: string | { _id: string; name: string };
}
interface SheetEntry {
  _id: string;
  menuItemId: CatalogItem | string;
}

export function MenuSheetsTab() {
  const qc = useQueryClient();
  const [selectedSheetId, setSelectedSheetId] = useState("");
  const [newSheetName, setNewSheetName] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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

  const { data: sheetEntries = [] } = useQuery({
    queryKey: ["admin-sheet-items", selectedSheetId],
    queryFn: async () => {
      const res = await apiAuth<SheetEntry[]>(`/admin/menu/sheets/${selectedSheetId}/items`);
      return res.data ?? [];
    },
    enabled: !!selectedSheetId,
  });

  useEffect(() => {
    if (!selectedSheetId && sheets[0]) setSelectedSheetId(sheets[0]._id);
  }, [sheets, selectedSheetId]);

  useEffect(() => {
    const ids = sheetEntries
      .map((e) => (typeof e.menuItemId === "object" ? e.menuItemId._id : e.menuItemId))
      .filter(Boolean) as string[];
    setPicked(new Set(ids));
  }, [sheetEntries, selectedSheetId]);

  const createSheet = useMutation({
    mutationFn: async (name: string) => {
      await apiAuth("/admin/menu/sheets", {
        method: "POST",
        body: JSON.stringify({
          name,
          slug: slugify(name),
          sortOrder: sheets.length,
          isActive: true,
        }),
      });
    },
    onSuccess: () => {
      setNewSheetName("");
      qc.invalidateQueries({ queryKey: ["admin-menu-sheets"] });
    },
  });

  const deleteSheet = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/menu/sheets/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      setSelectedSheetId("");
      qc.invalidateQueries({ queryKey: ["admin-menu-sheets"] });
    },
  });

  const saveSheetItems = useMutation({
    mutationFn: async () => {
      await apiAuth(`/admin/menu/sheets/${selectedSheetId}/items`, {
        method: "PUT",
        body: JSON.stringify({ menuItemIds: [...picked] }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sheet-items", selectedSheetId] });
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((i) => i.name.toLowerCase().includes(q));
  }, [catalog, search]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-4">
        <h3 className="text-sm font-semibold text-[#3d2914]">Menu Sheets</h3>
        <p className="mt-1 text-xs text-[#9a8b7a]">e.g. menu-1, menu-2</p>
        <div className="mt-3 flex gap-2">
          <Input
            placeholder="New sheet name"
            value={newSheetName}
            onChange={(e) => setNewSheetName(e.target.value)}
          />
          <Button
            size="sm"
            disabled={!newSheetName.trim()}
            onClick={() => createSheet.mutate(newSheetName.trim())}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ul className="mt-4 space-y-1">
          {sheets.map((s) => (
            <li
              key={s._id}
              className={cn(
                "flex items-center justify-between rounded-lg px-2 py-1 text-sm",
                selectedSheetId === s._id ? "bg-[#8b1a1a] text-white" : "hover:bg-[#f5e6d3]"
              )}
            >
              <button type="button" className="flex-1 px-2 py-1.5 text-left" onClick={() => setSelectedSheetId(s._id)}>
                {s.name}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete sheet ${s.name}?`)) deleteSheet.mutate(s._id);
                }}
                className={cn("p-1.5", selectedSheetId === s._id ? "text-white/80" : "text-red-600")}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
        {!selectedSheetId ? (
          <p className="text-sm text-[#5c4a3a]">Create or select a menu sheet.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#5c4a3a]">
                Pick items from master menu for this sheet ({picked.size} selected)
              </p>
              <Button disabled={saveSheetItems.isPending} onClick={() => saveSheetItems.mutate()}>
                {saveSheetItems.isPending ? "Saving..." : "Save sheet items"}
              </Button>
            </div>
            <Input
              className="mt-3"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-4 max-h-[480px] space-y-1 overflow-y-auto">
              {filtered.map((item) => (
                <label
                  key={item._id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-[#fbf3e8]"
                >
                  <input
                    type="checkbox"
                    checked={picked.has(item._id)}
                    onChange={() => toggle(item._id)}
                  />
                  <span className="flex-1 text-sm text-[#3d2914]">{item.name}</span>
                  <span className="text-xs text-[#c45c26]">₹{item.price}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
