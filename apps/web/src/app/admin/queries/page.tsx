"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Trash2, Check } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { apiAuth } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ContactQuery {
  _id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminQueriesPage() {
  const qc = useQueryClient();

  const { data: queries = [], isLoading } = useQuery({
    queryKey: ["admin-queries"],
    queryFn: async () => {
      const res = await apiAuth<ContactQuery[]>("/admin/contact-messages");
      return res.data ?? [];
    },
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/contact-messages/${id}/read`, { method: "PATCH" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-queries"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      await apiAuth(`/admin/contact-messages/${id}`, { method: "DELETE" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-queries"] }),
  });

  const unread = queries.filter((q) => !q.isRead).length;

  return (
    <AdminShell title="Contact Queries">
      <p className="mb-4 text-sm text-[#5c4a3a]">
        Messages from the Contact Us form.{" "}
        {unread > 0 && (
          <span className="font-semibold text-[#8b1a1a]">{unread} unread</span>
        )}
      </p>

      {isLoading ? (
        <p className="text-[#5c4a3a]">Loading...</p>
      ) : queries.length === 0 ? (
        <p className="rounded-xl border border-[#e8dcc8] bg-white p-8 text-center text-[#5c4a3a]">
          No queries yet.
        </p>
      ) : (
        <div className="space-y-4">
          {queries.map((q) => (
            <article
              key={q._id}
              className={cn(
                "rounded-2xl border bg-white p-5",
                q.isRead ? "border-[#e8dcc8]" : "border-[#8b1a1a]/40 ring-1 ring-[#8b1a1a]/20"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-[#3d2914]">{q.name}</h3>
                  <p className="mt-1 text-xs text-[#9a8b7a]">
                    {new Date(q.createdAt).toLocaleString("en-IN")}
                    {!q.isRead && (
                      <span className="ml-2 rounded-full bg-[#8b1a1a] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                        New
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!q.isRead && (
                    <Button size="sm" variant="outline" onClick={() => markRead.mutate(q._id)}>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Mark read
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => remove.mutate(q._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-4 text-sm text-[#5c4a3a]">
                <a href={`tel:${q.phone}`} className="flex items-center gap-1 hover:text-[#8b1a1a]">
                  <Phone className="h-4 w-4" />
                  {q.phone}
                </a>
                <a href={`mailto:${q.email}`} className="flex items-center gap-1 hover:text-[#8b1a1a]">
                  <Mail className="h-4 w-4" />
                  {q.email}
                </a>
              </div>

              <p className="mt-4 whitespace-pre-wrap rounded-lg bg-[#fbf3e8] p-4 text-sm text-[#3d2914]">
                {q.message}
              </p>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
