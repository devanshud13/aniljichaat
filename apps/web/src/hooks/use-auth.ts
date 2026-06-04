"use client";

import { useQuery } from "@tanstack/react-query";
import { apiAuth } from "@/lib/api";
import type { AuthUser } from "@/lib/permissions";

export function useAuthUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await apiAuth<AuthUser>("/auth/me");
      if (!res.success || !res.data) return null;
      return res.data;
    },
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: false,
  });
}
