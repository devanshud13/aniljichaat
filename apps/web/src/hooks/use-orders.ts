"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiAuth } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export interface OrderWithItems {
  _id: string;
  tableNumber?: number | null;
  orderType?: string;
  customerName?: string;
  customerPhone?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  total: number;
  createdAt: string;
  items: { nameSnapshot: string; quantity: number; priceSnapshot: number }[];
}

export function orderLabel(o: { orderType?: string; tableNumber?: number | null; customerName?: string }): string {
  if (o.orderType === "TAKEAWAY") return o.customerName ? `Takeaway · ${o.customerName}` : "Takeaway";
  if (o.tableNumber) return `Table ${o.tableNumber}`;
  return "Dine-In";
}

export function useOrders(outletId?: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["orders", outletId],
    queryFn: async () => {
      const q = outletId ? `?outletId=${outletId}` : "";
      const res = await apiAuth<OrderWithItems[]>(`/orders${q}`);
      return res.data ?? [];
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orders"] });
    socket.on("order:new", invalidate);
    socket.on("order:preparing", invalidate);
    socket.on("order:ready", invalidate);
    socket.on("order:delivered", invalidate);
    socket.on("order:completed", invalidate);
    socket.on("payment:completed", invalidate);
    return () => {
      socket.off("order:new", invalidate);
      socket.off("order:preparing", invalidate);
      socket.off("order:ready", invalidate);
      socket.off("order:delivered", invalidate);
      socket.off("order:completed", invalidate);
      socket.off("payment:completed", invalidate);
    };
  }, [queryClient]);

  return query;
}
