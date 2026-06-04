"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/image-upload";
import { apiAuth } from "@/lib/api";

interface AchievementRow {
  _id: string;
  caption: string;
  imageUrl: string;
  imagePublicId: string;
  sortOrder: number;
}

export default function AdminAchievementsPage() {
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePublicId, setImagePublicId] = useState("");
  const [editing, setEditing] = useState<AchievementRow | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePublicId, setEditImagePublicId] = useState("");

  const { data: items = [] } = useQuery({
    queryKey: ["admin-achievements"],
    queryFn: async () => {
      const res = await apiAuth<AchievementRow[]>("/admin/achievements");
      return res.data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      await apiAuth("/admin/achievements", {
        method: "POST",
        body: JSON.stringify({
          caption,
          imageUrl,
          imagePublicId,
          sortOrder: items.length,
        }),
      });
    },
    onSuccess: () => {
      setCaption("");
      setImageUrl("");
      setImagePublicId("");
      qc.invalidateQueries({ queryKey: ["admin-achievements"] });
    },
  });

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      await apiAuth(`/admin/achievements/${editing._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          caption: editCaption,
          imageUrl: editImageUrl,
          imagePublicId: editImagePublicId,
        }),
      });
    },
    onSuccess: () => {
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-achievements"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/achievements/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-achievements"] }),
  });

  function startEdit(a: AchievementRow) {
    setEditing(a);
    setEditCaption(a.caption);
    setEditImageUrl(a.imageUrl);
    setEditImagePublicId(a.imagePublicId);
  }

  return (
    <AdminShell title="Achievements">
      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
        <h2 className="font-semibold text-[#3d2914]">Add achievement</h2>
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
            <Input
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <Button
              disabled={!caption.trim() || !imageUrl || add.isPending}
              onClick={() => add.mutate()}
            >
              {add.isPending ? "Adding..." : "Add achievement"}
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-semibold text-[#3d2914]">Achievements ({items.length})</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <div key={a._id} className="overflow-hidden rounded-xl border border-[#e8dcc8] bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.imageUrl} alt={a.caption} className="h-40 w-full object-cover" />
            <div className="flex items-start justify-between gap-2 p-3">
              <p className="text-sm text-[#3d2914]">{a.caption}</p>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600"
                  onClick={() => remove.mutate(a._id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-[#3d2914]">Edit achievement</h3>
            <div className="mt-4 space-y-4">
              <Input value={editCaption} onChange={(e) => setEditCaption(e.target.value)} />
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
