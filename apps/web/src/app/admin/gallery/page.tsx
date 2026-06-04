"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/image-upload";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

interface GalleryItem {
  _id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  publicId: string;
}

export default function AdminGalleryPage() {
  const qc = useQueryClient();
  const [type, setType] = useState<"image" | "video">("image");
  const [url, setUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [caption, setCaption] = useState("");

  const { data: gallery = [] } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const res = await apiAuth<GalleryItem[]>("/admin/gallery");
      return res.data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      await apiAuth("/admin/gallery", {
        method: "POST",
        body: JSON.stringify({ type, url, publicId, caption: caption || undefined, sortOrder: gallery.length }),
      });
    },
    onSuccess: () => {
      setUrl("");
      setPublicId("");
      setCaption("");
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/gallery/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-gallery"] }),
  });

  return (
    <AdminShell title="Gallery">
      <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
        <h2 className="font-semibold text-[#3d2914]">Upload to Gallery</h2>
        <div className="mt-3 flex gap-2">
          {(["image", "video"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setUrl("");
                setPublicId("");
              }}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium capitalize",
                type === t ? "bg-[#8b1a1a] text-white" : "bg-[#f5e6d3] text-[#5c4a3a]"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end">
          <ImageUpload
            type={type}
            value={url}
            onUploaded={(r) => {
              setUrl(r.url);
              setPublicId(r.publicId);
            }}
            onClear={() => {
              setUrl("");
              setPublicId("");
            }}
          />
          <div className="flex-1 space-y-3">
            <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} />
            <Button disabled={!url || add.isPending} onClick={() => add.mutate()}>
              {add.isPending ? "Adding..." : "Add to Gallery"}
            </Button>
          </div>
        </div>
      </div>

      <h2 className="mt-8 font-semibold text-[#3d2914]">Current Gallery ({gallery.length})</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {gallery.map((g) => (
          <div key={g._id} className="group relative overflow-hidden rounded-xl border border-[#e8dcc8] bg-white">
            {g.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={g.url} alt={g.caption ?? ""} className="h-40 w-full object-cover" />
            ) : (
              <video src={g.url} className="h-40 w-full object-cover" controls />
            )}
            {g.caption && <p className="px-3 py-2 text-xs text-[#5c4a3a]">{g.caption}</p>}
            <button
              onClick={() => remove.mutate(g._id)}
              className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
