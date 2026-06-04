"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, MapPin, Phone, Clock } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useOutlets, type AdminOutlet } from "@/hooks/use-outlets";
import { apiAuth } from "@/lib/api";
import { slugify } from "@/lib/utils";

export default function AdminOutletsPage() {
  const qc = useQueryClient();
  const { data: outlets = [] } = useOutlets();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminOutlet | null>(null);

  return (
    <AdminShell title="Outlets">
      <div className="mb-4 flex justify-end">
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Add Outlet
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {outlets.map((o) => (
          <div key={o._id} className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-brand text-lg font-extrabold text-[#8b1a1a]">{o.name}</h3>
                <span className="text-xs text-[#9a8b7a]">/{o.slug}</span>
              </div>
              <button
                onClick={() => {
                  setEditing(o);
                  setOpen(true);
                }}
                className="rounded-md p-1.5 hover:bg-[#f5e6d3]"
              >
                <Pencil className="h-4 w-4 text-[#5c4a3a]" />
              </button>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-[#5c4a3a]">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#e0892a]" /> {o.address}
              </p>
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#e0892a]" /> {o.timings}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#e0892a]" /> {o.phone}
              </p>
            </div>
            <span
              className={`mt-3 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                o.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
              }`}
            >
              {o.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>

      <OutletModal
        key={editing?._id ?? "new"}
        open={open}
        onClose={() => setOpen(false)}
        outlet={editing}
        onSaved={() => {
          setOpen(false);
          qc.invalidateQueries({ queryKey: ["admin-outlets"] });
        }}
      />
    </AdminShell>
  );
}

function OutletModal({
  open,
  onClose,
  outlet,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  outlet: AdminOutlet | null;
  onSaved: () => void;
}) {
  const editing = !!outlet;
  const [name, setName] = useState(outlet?.name ?? "");
  const [slug, setSlug] = useState(outlet?.slug ?? "");
  const [address, setAddress] = useState(outlet?.address ?? "");
  const [timings, setTimings] = useState(outlet?.timings ?? "");
  const [phone, setPhone] = useState(outlet?.phone ?? "");
  const [mapEmbedUrl, setMapEmbedUrl] = useState(outlet?.mapEmbedUrl ?? "");
  const [isActive, setIsActive] = useState(outlet?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name,
        slug: slug || slugify(name),
        address,
        timings,
        phone,
        mapEmbedUrl: mapEmbedUrl || undefined,
        isActive,
      };
      return editing
        ? apiAuth(`/admin/outlets/${outlet!._id}`, { method: "PATCH", body: JSON.stringify(payload) })
        : apiAuth("/admin/outlets", { method: "POST", body: JSON.stringify(payload) });
    },
  });

  async function handleSave() {
    setError("");
    if (!name || !address || !timings || phone.length < 10) {
      setError("Please fill name, address, timings and a valid phone.");
      return;
    }
    setSaving(true);
    const res = await save.mutateAsync();
    setSaving(false);
    if (res.success) onSaved();
    else setError(res.message ?? "Failed to save outlet");
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Outlet" : "Add Outlet"}>
      <div className="space-y-3">
        <Input
          placeholder="Outlet name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!editing) setSlug(slugify(e.target.value));
          }}
        />
        <Input placeholder="Slug (e.g. ambala)" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
        <textarea
          placeholder="Full address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          className="w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
        />
        <Input placeholder="Timings (e.g. 11 AM - 10 PM)" value={timings} onChange={(e) => setTimings(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input
          placeholder="Google Maps embed URL (optional)"
          value={mapEmbedUrl}
          onChange={(e) => setMapEmbedUrl(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active (visible on website)
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={saving} onClick={handleSave}>
          {saving ? "Saving..." : editing ? "Save Changes" : "Add Outlet"}
        </Button>
      </div>
    </Modal>
  );
}
