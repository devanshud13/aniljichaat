export const Role = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  KITCHEN: "KITCHEN",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const OrderStatus = {
  NEW: "NEW",
  PREPARING: "PREPARING",
  READY: "READY",
  DELIVERED: "DELIVERED",
  COMPLETED: "COMPLETED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  CASH: "CASH",
  RAZORPAY: "RAZORPAY",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const OrderType = {
  DINE_IN: "DINE_IN",
  TAKEAWAY: "TAKEAWAY",
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FLAT: "FLAT",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const GalleryType = {
  IMAGE: "image",
  VIDEO: "video",
} as const;
export type GalleryType = (typeof GalleryType)[keyof typeof GalleryType];

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
];

export function getNextOrderStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1] ?? null;
}

export function canKitchenTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (
    (from === OrderStatus.NEW && to === OrderStatus.PREPARING) ||
    (from === OrderStatus.PREPARING && to === OrderStatus.READY)
  );
}

export function canManagerTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (
    (from === OrderStatus.READY && to === OrderStatus.DELIVERED) ||
    (from === OrderStatus.DELIVERED && to === OrderStatus.COMPLETED)
  );
}
