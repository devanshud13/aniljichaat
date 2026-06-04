"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ImageUpload } from "@/components/admin/image-upload";
import { apiAuth } from "@/lib/api";
import { slugify } from "@/lib/utils";

interface Category {
  _id: string;
  name: string;
  slug: string;
}
interface Item {
  _id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string | { _id: string; name: string };
  imageUrl?: string;
  imagePublicId?: string;
  isAvailable: boolean;
}

export function MasterMenuTab() {
  const qc = useQueryClient();
  const [itemModal, setItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [catModal, setCatModal] = useState(false);
  const [newCat, setNewCat] = useState("");

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-catalog-categories"],
    queryFn: async () => {
      const res = await apiAuth<Category[]>("/admin/menu/categories?catalog=true");
      return res.data ?? [];
    },
  });

  const { data: items = [] } = useQuery({
    queryKey: ["admin-catalog-items"],
    queryFn: async () => {
      const res = await apiAuth<Item[]>("/admin/menu/items?catalog=true");
      return res.data ?? [];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-catalog-items"] });
    qc.invalidateQueries({ queryKey: ["admin-catalog-categories"] });
  };

  const createCat = useMutation({
    mutationFn: async (name: string) => {
      await apiAuth("/admin/menu/categories", {
        method: "POST",
        body: JSON.stringify({
          outletId: null,
          name,
          slug: slugify(name),
          sortOrder: categories.length,
          isActive: true,
        }),
      });
    },
    onSuccess: () => {
      setNewCat("");
      refresh();
    },
  });

  const deleteCat = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/menu/categories/${id}`, { method: "DELETE" });
    },
    onSuccess: refresh,
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/menu/items/${id}`, { method: "DELETE" });
    },
    onSuccess: refresh,
  });

  const catName = (c: Item["categoryId"]) =>
    typeof c === "object" ? c.name : categories.find((x) => x._id === c)?.name ?? "—";

  return (
    <>
      <div className="mb-4 flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={() => setCatModal(true)}>
          Manage Categories
        </Button>
        <Button
          className="gap-1.5"
          onClick={() => {
            setEditingItem(null);
            setItemModal(true);
          }}
          disabled={categories.length === 0}
        >
          <Plus className="h-4 w-4" /> Add Item
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="rounded-lg bg-[#fbf3e8] p-4 text-sm text-[#5c4a3a]">
          Create a category first. All items here are shared across outlets — upload each image once.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item._id} className="overflow-hidden rounded-xl border border-[#e8dcc8] bg-white">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="h-32 w-full object-cover" />
            ) : (
              <div className="h-32 w-full bg-gradient-to-br from-[#f5e6d3] to-[#ffe9c7]" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-[#3d2914]">{item.name}</h3>
              <p className="text-xs text-[#9a8b7a]">{catName(item.categoryId)}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-bold text-[#c45c26]">₹{item.price}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingItem(item);
                      setItemModal(true);
                    }}
                    className="rounded-md p-1.5 hover:bg-[#f5e6d3]"
                  >
                    <Pencil className="h-4 w-4 text-[#5c4a3a]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Delete ${item.name}?`)) deleteItem.mutate(item._id);
                    }}
                    className="rounded-md p-1.5 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ItemModal
        key={editingItem?._id ?? "new"}
        open={itemModal}
        onClose={() => setItemModal(false)}
        categories={categories}
        item={editingItem}
        onSaved={() => {
          setItemModal(false);
          refresh();
        }}
      />

      <Modal open={catModal} onClose={() => setCatModal(false)} title="Categories">
        <div className="flex gap-2">
          <Input
            placeholder="New category name"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <Button onClick={() => newCat.trim() && createCat.mutate(newCat.trim())}>Add</Button>
        </div>
        <ul className="mt-4 space-y-2">
          {categories.map((c) => (
            <li key={c._id} className="flex items-center justify-between rounded-lg bg-[#fbf3e8] px-3 py-2">
              <span className="text-sm">{c.name}</span>
              <button type="button" onClick={() => deleteCat.mutate(c._id)} className="text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </Modal>
    </>
  );
}

function ItemModal({
  open,
  onClose,
  categories,
  item,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  item: Item | null;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(item?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState(
    typeof item?.categoryId === "object" ? item.categoryId._id : item?.categoryId ?? categories[0]?._id ?? ""
  );
  const [imageUrl, setImageUrl] = useState(item?.imageUrl ?? "");
  const [imagePublicId, setImagePublicId] = useState(item?.imagePublicId ?? "");
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const editing = !!item;

  async function save() {
    setError("");
    if (!name.trim() || !price || !categoryId) {
      setError("Name, price and category are required.");
      return;
    }
    setSaving(true);
    const payload = {
      outletId: null,
      categoryId,
      name: name.trim(),
      slug: slugify(name),
      description: description || undefined,
      price: Number(price),
      imageUrl: imageUrl || undefined,
      imagePublicId: imagePublicId || undefined,
      isAvailable,
      sortOrder: 0,
    };
    const res = editing
      ? await apiAuth(`/admin/menu/items/${item!._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        })
      : await apiAuth("/admin/menu/items", { method: "POST", body: JSON.stringify(payload) });
    setSaving(false);
    if (res.success) onSaved();
    else setError(res.message ?? "Failed to save");
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit Item" : "Add Menu Item"}>
      <div className="space-y-3">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)">
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-md border border-[#d4c4b0] bg-white px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Image">
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
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} />
          Active in master catalog
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={saving} onClick={save}>
          {saving ? "Saving..." : editing ? "Save Changes" : "Add Item"}
        </Button>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">
        {label}
      </span>
      {children}
    </label>
  );
}
