"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useOutlets } from "@/hooks/use-outlets";
import { apiAuth } from "@/lib/api";
import { slugify } from "@/lib/utils";
import { DiscountType } from "@anilji/shared";

interface Offer {
  _id: string;
  title: string;
  description?: string;
  discountType: string;
  value: number;
  isActive: boolean;
  isExclusive?: boolean;
  startAt: string;
  endAt: string;
}

export default function AdminOffersPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: offers = [] } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const res = await apiAuth<Offer[]>("/admin/offers");
      return res.data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async (o: Offer) => {
      await apiAuth(`/admin/offers/${o._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: !o.isActive }),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/offers/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-offers"] }),
  });

  return (
    <AdminShell title="Offers">
      <div className="mb-4 flex justify-end">
        <Button className="gap-1.5" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> Create Offer
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((o) => (
          <div key={o._id} className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-[#3d2914]">{o.title}</h3>
              <button onClick={() => remove.mutate(o._id)} className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-[#5c4a3a]">{o.description}</p>
            <p className="mt-2 font-bold text-[#c45c26]">
              {o.discountType === "PERCENTAGE" ? `${o.value}% OFF` : `₹${o.value} OFF`}
            </p>
            {o.isExclusive && (
              <span className="mt-2 inline-block rounded-full bg-[#8b1a1a] px-2 py-0.5 text-[10px] font-semibold text-white">
                Exclusive (checkout only)
              </span>
            )}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={o.isActive} onChange={() => toggle.mutate(o)} />
              Active
            </label>
          </div>
        ))}
      </div>

      <OfferModal
        open={open}
        onClose={() => setOpen(false)}
        onSaved={() => {
          setOpen(false);
          qc.invalidateQueries({ queryKey: ["admin-offers"] });
        }}
      />
    </AdminShell>
  );
}

function OfferModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { data: outlets = [] } = useOutlets();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState<string>(DiscountType.PERCENTAGE);
  const [value, setValue] = useState("");
  const [outletId, setOutletId] = useState("");
  const [startAt, setStartAt] = useState(new Date().toISOString().slice(0, 10));
  const [endAt, setEndAt] = useState(
    new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
  );
  const [isExclusive, setIsExclusive] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setError("");
    if (!title || !value) {
      setError("Title and value are required.");
      return;
    }
    setSaving(true);
    const res = await apiAuth("/admin/offers", {
      method: "POST",
      body: JSON.stringify({
        title,
        slug: slugify(title),
        description: description || undefined,
        discountType,
        value: Number(value),
        outletId: outletId || null,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
        isActive: true,
        isExclusive,
        promoCode: isExclusive && promoCode.trim() ? promoCode.trim().toUpperCase() : undefined,
      }),
    });
    setSaving(false);
    if (res.success) onSaved();
    else setError(res.message ?? "Failed to create offer");
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Offer">
      <div className="space-y-3">
        <Input placeholder="Offer title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value)}
            className="h-10 rounded-md border border-[#d4c4b0] bg-white px-3 text-sm"
          >
            <option value={DiscountType.PERCENTAGE}>Percentage</option>
            <option value={DiscountType.FLAT}>Flat ₹</option>
          </select>
          <Input type="number" placeholder="Value" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <select
          value={outletId}
          onChange={(e) => setOutletId(e.target.value)}
          className="h-10 w-full rounded-md border border-[#d4c4b0] bg-white px-3 text-sm"
        >
          <option value="">All Outlets</option>
          {outlets.map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-[#9a8b7a]">
            Start
            <Input type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </label>
          <label className="text-xs text-[#9a8b7a]">
            End
            <Input type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isExclusive}
            onChange={(e) => setIsExclusive(e.target.checked)}
          />
          Exclusive offer (hidden on Home & Offers — apply via code at checkout only)
        </label>
        {isExclusive && (
          <Input
            placeholder="Promo code (e.g. VIP20)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
          />
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={saving} onClick={save}>
          {saving ? "Creating..." : "Create Offer"}
        </Button>
      </div>
    </Modal>
  );
}
