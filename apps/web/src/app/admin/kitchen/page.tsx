"use client";

import { useOrders, orderLabel } from "@/hooks/use-orders";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { apiAuth } from "@/lib/api";
import { OrderStatus } from "@anilji/shared";

export default function AdminKitchenPage() {
  const { data: orders = [], refetch } = useOrders();
  const kitchenStatuses: string[] = [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY];
  const active = orders.filter((o) => kitchenStatuses.includes(o.status));

  async function updateStatus(id: string, status: OrderStatus) {
    await apiAuth(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    refetch();
  }

  return (
    <AdminShell title="Kitchen — Active Orders">
      <div className="space-y-4">
        {active.length === 0 && (
          <p className="text-[#5c4a3a]">No active orders in the kitchen queue.</p>
        )}
        {active.map((order) => (
          <Card key={order._id} className="border-l-4 border-l-[#c45c26]">
            <CardContent className="p-6">
              <CardTitle>
                {orderLabel(order)} — {order.status}
              </CardTitle>
              <ul className="mt-2 text-sm">
                {order.items.map((i, idx) => (
                  <li key={idx}>
                    {i.nameSnapshot} x{i.quantity}
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                {order.status === OrderStatus.NEW && (
                  <Button onClick={() => updateStatus(order._id, OrderStatus.PREPARING)}>
                    Start Preparing
                  </Button>
                )}
                {order.status === OrderStatus.PREPARING && (
                  <Button onClick={() => updateStatus(order._id, OrderStatus.READY)}>
                    Mark Ready
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
