"use client";

import { useQuery } from "@tanstack/react-query";
import { apiAuth } from "@/lib/api";

export interface AdminOutlet {
  _id: string;
  name: string;
  slug: string;
  address: string;
  timings: string;
  phone: string;
  mapEmbedUrl?: string;
  isActive: boolean;
}

export function useOutlets() {
  return useQuery({
    queryKey: ["admin-outlets"],
    queryFn: async () => {
      const res = await apiAuth<AdminOutlet[]>("/admin/outlets");
      return res.data ?? [];
    },
  });
}
