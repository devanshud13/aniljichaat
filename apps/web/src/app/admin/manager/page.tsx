"use client";

import { useOrders, orderLabel } from "@/hooks/use-orders";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { apiAuth } from "@/lib/api";
import { OrderStatus, PaymentStatus } from "@anilji/shared";

export default function AdminManagerPage() {
  const { data: orders = [], refetch } = useOrders();

  async function updateStatus(id: string, status: OrderStatus) {
    await apiAuth(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    refetch();
  }

  async function markPaid(id: string) {
    await apiAuth(`/orders/${id}/payment`, {
      method: "PATCH",
      body: JSON.stringify({ paymentStatus: PaymentStatus.PAID }),
    });
    refetch();
  }

  function printBill(id: string) {
    window.open(`/api-proxy/orders/${id}/bill`, "_blank");
  }

  return (
    <AdminShell title="Manager — Orders">
      <div className="space-y-4">
        {orders.length === 0 && (
          <p className="text-[#5c4a3a]">No orders yet. New orders will appear here in real time.</p>
        )}
        {orders.map((order) => (
          <Card key={order._id}>
            <CardContent className="p-6">
              <CardTitle>
                {orderLabel(order)} — {order.status}
                <span
                  className={`ml-2 text-sm ${order.paymentStatus === "PAID" ? "text-green-600" : "text-amber-600"}`}
                >
                  ({order.paymentStatus})
                </span>
              </CardTitle>
              <p className="mt-1 text-sm">₹{order.total} · {order.paymentMethod}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {order.paymentStatus === PaymentStatus.UNPAID && order.paymentMethod === "CASH" && (
                  <Button size="sm" onClick={() => markPaid(order._id)}>
                    Mark Paid
                  </Button>
                )}
                {order.status === OrderStatus.READY && (
                  <Button size="sm" onClick={() => updateStatus(order._id, OrderStatus.DELIVERED)}>
                    Delivered
                  </Button>
                )}
                {order.status === OrderStatus.DELIVERED && (
                  <Button size="sm" onClick={() => updateStatus(order._id, OrderStatus.COMPLETED)}>
                    Complete
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => printBill(order._id)}>
                  Print Bill
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
