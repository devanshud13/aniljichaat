"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { OrderStatus, PaymentStatus } from "@anilji/shared";
import { apiAuth } from "@/lib/api";
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

function patchOrderInList(
  orders: OrderWithItems[] | undefined,
  orderId: string,
  patch: Partial<OrderWithItems>
): OrderWithItems[] | undefined {
  if (!orders) return orders;
  return orders.map((o) => (o._id === orderId ? { ...o, ...patch } : o));
}

export function useOrderStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const res = await apiAuth<OrderWithItems>(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.success) throw new Error(res.message ?? "Status update failed");
      return res.data;
    },
    onMutate: async ({ orderId, status }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshots = queryClient.getQueriesData<OrderWithItems[]>({ queryKey: ["orders"] });
      queryClient.setQueriesData<OrderWithItems[]>({ queryKey: ["orders"] }, (old) =>
        patchOrderInList(old, orderId, { status })
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (serverOrder, { orderId }) => {
      if (!serverOrder) return;
      queryClient.setQueriesData<OrderWithItems[]>({ queryKey: ["orders"] }, (old) =>
        patchOrderInList(old, orderId, serverOrder as OrderWithItems)
      );
    },
  });
}

export function useOrderPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, paymentStatus }: { orderId: string; paymentStatus: PaymentStatus }) => {
      const res = await apiAuth<OrderWithItems>(`/orders/${orderId}/payment`, {
        method: "PATCH",
        body: JSON.stringify({ paymentStatus }),
      });
      if (!res.success) throw new Error(res.message ?? "Payment update failed");
      return res.data;
    },
    onMutate: async ({ orderId, paymentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const snapshots = queryClient.getQueriesData<OrderWithItems[]>({ queryKey: ["orders"] });
      queryClient.setQueriesData<OrderWithItems[]>({ queryKey: ["orders"] }, (old) =>
        patchOrderInList(old, orderId, { paymentStatus })
      );
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSuccess: (serverOrder, { orderId }) => {
      if (!serverOrder) return;
      queryClient.setQueriesData<OrderWithItems[]>({ queryKey: ["orders"] }, (old) =>
        patchOrderInList(old, orderId, serverOrder as OrderWithItems)
      );
    },
  });
}

/** Merge socket payload into orders cache (avoids full refetch). */
export function mergeOrderFromSocket(
  queryClient: ReturnType<typeof useQueryClient>,
  payload: OrderWithItems & { _id?: string; id?: string }
) {
  const orderId = payload._id ?? payload.id;
  if (!orderId) return;
  queryClient.setQueriesData<OrderWithItems[]>({ queryKey: ["orders"] }, (old) =>
    patchOrderInList(old, String(orderId), payload as OrderWithItems)
  );
}
