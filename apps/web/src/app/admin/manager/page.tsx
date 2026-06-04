"use client";

import { useOrders, orderLabel } from "@/hooks/use-orders";
import { useOrderPaymentMutation, useOrderStatusMutation } from "@/hooks/use-order-mutations";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { OrderStatus, PaymentStatus } from "@anilji/shared";

export default function AdminManagerPage() {
  const { data: orders = [], isLoading } = useOrders();
  const statusMutation = useOrderStatusMutation();
  const paymentMutation = useOrderPaymentMutation();

  function updateStatus(id: string, status: OrderStatus) {
    statusMutation.mutate({ orderId: id, status });
  }

  function markPaid(id: string) {
    paymentMutation.mutate({ orderId: id, paymentStatus: PaymentStatus.PAID });
  }

  function printBill(id: string) {
    window.open(`/api-proxy/orders/${id}/bill`, "_blank");
  }

  return (
    <AdminShell title="Manager — Orders">
      <div className="space-y-4">
        {isLoading && orders.length === 0 && (
          <p className="text-[#5c4a3a]">Loading orders…</p>
        )}
        {!isLoading && orders.length === 0 && (
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
                  <Button
                    size="sm"
                    disabled={paymentMutation.isPending}
                    onClick={() => markPaid(order._id)}
                  >
                    Mark Paid
                  </Button>
                )}
                {order.status === OrderStatus.READY && (
                  <Button
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => updateStatus(order._id, OrderStatus.DELIVERED)}
                  >
                    Delivered
                  </Button>
                )}
                {order.status === OrderStatus.DELIVERED && (
                  <Button
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => updateStatus(order._id, OrderStatus.COMPLETED)}
                  >
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
