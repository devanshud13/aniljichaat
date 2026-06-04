"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/image-upload";
import { apiAuth } from "@/lib/api";

interface ClientRow {
  _id: string;
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminClientsPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [editing, setEditing] = useState<ClientRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePublicId, setEditImagePublicId] = useState("");

  const { data: clients = [] } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const res = await apiAuth<ClientRow[]>("/admin/clients");
      return res.data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      await apiAuth("/admin/clients", {
        method: "POST",
        body: JSON.stringify({
          name,
          imageUrl: imageUrl || undefined,
          imagePublicId: imagePublicId || undefined,
          sortOrder: clients.length,
        }),
      });
    },
    onSuccess: () => {
      setName("");
      setImageUrl("");
      setImagePublicId("");
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await apiAuth(`/admin/clients/${editing._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editName,
          imageUrl: editImageUrl || undefined,
          imagePublicId: editImagePublicId || undefined,
        }),
      });
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/clients/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-clients"] }),
  });

  function startEdit(c: ClientRow) {
    setEditing(c);
    setEditName(c.name);
    setEditImageUrl(c.imageUrl ?? "");
    setEditImagePublicId(c.imagePublicId ?? "");
  }

  return (
    <AdminShell title="Our Clients">
      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
        <h2 className="font-semibold text-[#3d2914]">Add client</h2>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end">
          <ImageUpload
            value={imageUrl}
            onUploaded={(r) => {
              setImageUrl(r.url);
              setImagePublicId(r.publicId);
            }}
            onClear={() => {
              setImageUrl("");
              setImagePublicId("");
            }}
          />
          <div className="flex flex-1 flex-col gap-3">
            <Input placeholder="Client name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button disabled={!name.trim() || add.isPending} onClick={() => add.mutate()}>
              {add.isPending ? "Adding..." : "Add client"}
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-semibold text-[#3d2914]">Clients ({clients.length})</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {clients.map((c) => (
          <div key={c._id} className="rounded-xl border border-[#e8dcc8] bg-white p-4">
            <div className="flex h-32 items-center justify-center rounded-lg bg-[#fbf3e8]">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt={c.name} className="max-h-28 max-w-full object-contain p-2" />
              ) : (
                <span className="text-xs text-[#9a8b7a]">No logo</span>
              )}
            </div>
            <p className="mt-3 text-sm font-semibold text-[#3d2914]">{c.name}</p>
            <div className="mt-2 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => startEdit(c)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600"
                onClick={() => remove.mutate(c._id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-[#3d2914]">Edit client</h3>
            <div className="mt-4 space-y-4">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              <ImageUpload
                value={editImageUrl}
                onUploaded={(r) => {
                  setEditImageUrl(r.url);
                  setEditImagePublicId(r.publicId);
                }}
                onClear={() => {
                  setEditImageUrl("");
                  setEditImagePublicId("");
                }}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button disabled={saveEdit.isPending} onClick={() => saveEdit.mutate()}>
                  {saveEdit.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
