"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, QrCode, Download } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOutlets } from "@/hooks/use-outlets";
import { apiAuth } from "@/lib/api";

interface TableT {
  _id: string;
  slug: string;
  tableNumber: number;
  qrImageUrl?: string;
}

export default function AdminTablesPage() {
  const qc = useQueryClient();
  const { data: outlets = [] } = useOutlets();
  const [outletId, setOutletId] = useState("");
  const [newNumber, setNewNumber] = useState("");

  useEffect(() => {
    if (!outletId && outlets[0]) setOutletId(outlets[0]._id);
  }, [outlets, outletId]);

  const { data: tables = [] } = useQuery({
    queryKey: ["admin-tables", outletId],
    queryFn: async () => {
      const res = await apiAuth<TableT[]>(`/admin/tables?outletId=${outletId}`);
      return res.data ?? [];
    },
    enabled: !!outletId,
  });

  const addTable = useMutation({
    mutationFn: async (num: number) => {
      await apiAuth("/admin/tables", {
        method: "POST",
        body: JSON.stringify({ outletId, tableNumber: num, slug: `table-${num}` }),
      });
    },
    onSuccess: () => {
      setNewNumber("");
      qc.invalidateQueries({ queryKey: ["admin-tables"] });
    },
  });

  const genQr = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/tables/${id}/generate-qr`, { method: "POST" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tables"] }),
  });

  return (
    <AdminShell title="Tables & QR Codes">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
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
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Table #"
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="w-28"
          />
          <Button
            className="gap-1.5"
            disabled={!newNumber}
            onClick={() => addTable.mutate(Number(newNumber))}
          >
            <Plus className="h-4 w-4" /> Add Table
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tables.map((t) => (
          <div key={t._id} className="rounded-2xl border border-[#e8dcc8] bg-white p-4 text-center">
            <p className="font-semibold text-[#3d2914]">Table {t.tableNumber}</p>
            <p className="text-xs text-[#9a8b7a]">/order/{t.slug}</p>
            {t.qrImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.qrImageUrl} alt={`QR Table ${t.tableNumber}`} className="mx-auto mt-3 h-36 w-36" />
                <a
                  href={t.qrImageUrl}
                  download={`table-${t.tableNumber}-qr.png`}
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#8b1a1a]"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </>
            ) : (
              <div className="mx-auto mt-3 flex h-36 w-36 items-center justify-center rounded-lg bg-[#fbf3e8]">
                <QrCode className="h-8 w-8 text-[#c9a36b]" />
              </div>
            )}
            <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => genQr.mutate(t._id)}>
              {t.qrImageUrl ? "Regenerate QR" : "Generate QR"}
            </Button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
