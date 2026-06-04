"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiAuth } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { mergeOrderFromSocket, type OrderWithItems } from "./use-order-mutations";

export type { OrderWithItems };

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
    staleTime: 15_000,
    refetchInterval: 60_000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onOrderEvent = (payload: OrderWithItems) => {
      mergeOrderFromSocket(queryClient, payload);
    };

    const onNewOrder = () => {
      void queryClient.invalidateQueries({ queryKey: ["orders"] });
    };

    socket.on("order:new", onNewOrder);
    socket.on("order:preparing", onOrderEvent);
    socket.on("order:ready", onOrderEvent);
    socket.on("order:delivered", onOrderEvent);
    socket.on("order:completed", onOrderEvent);
    socket.on("payment:completed", onOrderEvent);

    return () => {
      socket.off("order:new", onNewOrder);
      socket.off("order:preparing", onOrderEvent);
      socket.off("order:ready", onOrderEvent);
      socket.off("order:delivered", onOrderEvent);
      socket.off("order:completed", onOrderEvent);
      socket.off("payment:completed", onOrderEvent);
    };
  }, [queryClient]);

  return query;
}
