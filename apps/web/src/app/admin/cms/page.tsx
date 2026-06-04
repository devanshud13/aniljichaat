"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Check } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiAuth } from "@/lib/api";

type FieldType = "text" | "textarea" | "testimonials";

interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
}

interface BlockDef {
  key: string;
  group: string;
  title: string;
  fields: FieldDef[];
}

const BLOCKS: BlockDef[] = [
  {
    key: "home.hero",
    group: "Home Page",
    title: "Hero Banner",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "subtitle", label: "Subtitle", type: "textarea" },
      { name: "cta", label: "Button Text", type: "text" },
      { name: "ctaLink", label: "Button Link", type: "text" },
    ],
  },
  {
    key: "home.about",
    group: "Home Page",
    title: "About Preview",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "text", label: "Text", type: "textarea" },
    ],
  },
  {
    key: "home.testimonials",
    group: "Home Page",
    title: "Testimonials",
    fields: [{ name: "items", label: "Reviews", type: "testimonials" }],
  },
  {
    key: "about.history",
    group: "About Page",
    title: "Our History",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "text", label: "Text", type: "textarea" },
    ],
  },
  {
    key: "about.mission",
    group: "About Page",
    title: "Our Mission",
    fields: [
      { name: "title", label: "Title", type: "text" },
      { name: "text", label: "Text", type: "textarea" },
    ],
  },
  {
    key: "contact.details",
    group: "Contact",
    title: "Contact Details",
    fields: [
      { name: "address", label: "Address", type: "textarea" },
      { name: "phone", label: "Phone", type: "text" },
      { name: "email", label: "Email", type: "text" },
      { name: "hours", label: "Hours", type: "text" },
    ],
  },
];

type CmsData = Record<string, unknown>;

export default function AdminCmsPage() {
  const { data: blocks = [] } = useQuery({
    queryKey: ["admin-cms"],
    queryFn: async () => {
      const res = await apiAuth<{ key: string; data: CmsData }[]>("/admin/cms");
      return res.data ?? [];
    },
  });

  const groups = Array.from(new Set(BLOCKS.map((b) => b.group)));

  return (
    <AdminShell title="Website Content">
      <p className="mb-6 max-w-2xl text-sm text-[#5c4a3a]">
        Edit the text shown across your public website. Changes are saved per block and appear instantly on the site.
      </p>
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group}>
            <h2 className="mb-3 font-brand text-lg font-extrabold text-[#8b1a1a]">{group}</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {BLOCKS.filter((b) => b.group === group).map((block) => (
                <BlockEditor
                  key={block.key}
                  block={block}
                  initial={(blocks.find((b) => b.key === block.key)?.data ?? {}) as CmsData}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function BlockEditor({ block, initial }: { block: BlockDef; initial: CmsData }) {
  const qc = useQueryClient();
  const [data, setData] = useState<CmsData>(initial);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialJson = JSON.stringify(initial);
  useEffect(() => {
    setData(JSON.parse(initialJson) as CmsData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialJson]);

  function set(name: string, value: unknown) {
    setData((d) => ({ ...d, [name]: value }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await apiAuth("/admin/cms", {
      method: "PUT",
      body: JSON.stringify({ key: block.key, locale: "en", data }),
    });
    setSaving(false);
    if (res.success) {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["admin-cms"] });
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#3d2914]">{block.title}</h3>
        <code className="text-[10px] text-[#b6a48f]">{block.key}</code>
      </div>
      <div className="mt-3 space-y-3">
        {block.fields.map((field) => (
          <div key={field.name}>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">
              {field.label}
            </span>
            {field.type === "text" && (
              <Input
                value={(data[field.name] as string) ?? ""}
                onChange={(e) => set(field.name, e.target.value)}
              />
            )}
            {field.type === "textarea" && (
              <textarea
                value={(data[field.name] as string) ?? ""}
                onChange={(e) => set(field.name, e.target.value)}
                rows={3}
                className="w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
              />
            )}
            {field.type === "testimonials" && (
              <TestimonialsEditor
                value={(data[field.name] as { name: string; text: string; rating: number }[]) ?? []}
                onChange={(v) => set(field.name, v)}
              />
            )}
          </div>
        ))}
      </div>
      <Button className="mt-4 gap-2" onClick={save} disabled={saving}>
        {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        {saved ? "Saved" : saving ? "Saving..." : "Save"}
      </Button>
    </div>
  );
}

function TestimonialsEditor({
  value,
  onChange,
}: {
  value: { name: string; text: string; rating: number }[];
  onChange: (v: { name: string; text: string; rating: number }[]) => void;
}) {
  return (
    <div className="space-y-2">
      {value.map((t, i) => (
        <div key={i} className="rounded-lg bg-[#fbf3e8] p-3">
          <Input
            className="mb-2"
            placeholder="Customer name"
            value={t.name}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...t, name: e.target.value };
              onChange(next);
            }}
          />
          <textarea
            placeholder="Review"
            value={t.text}
            onChange={(e) => {
              const next = [...value];
              next[i] = { ...t, text: e.target.value };
              onChange(next);
            }}
            rows={2}
            className="w-full rounded-md border border-[#d4c4b0] px-3 py-2 text-sm"
          />
          <button
            onClick={() => onChange(value.filter((_, idx) => idx !== i))}
            className="mt-1 text-xs text-red-600"
          >
            Remove
          </button>
        </div>
      ))}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onChange([...value, { name: "", text: "", rating: 5 }])}
      >
        + Add Review
      </Button>
    </div>
  );
}
