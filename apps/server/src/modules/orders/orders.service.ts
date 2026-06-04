import crypto from "crypto";
import {
  Order,
  OrderItem,
  Offer,
  Outlet,
  Table,
  type ITable,
} from "@anilji/database";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  Role,
  DiscountType,
  canKitchenTransition,
  canManagerTransition,
} from "@anilji/shared";
import { NotFoundError, ForbiddenError, ValidationError } from "../../utils/errors.js";
import { emitToOutlet, emitToOrder, OrderEvents } from "../../socket/index.js";
import type { TokenPayload } from "../../services/jwt.service.js";

export async function createOrder(input: {
  outletSlug: string;
  tableSlug?: string;
  orderType?: OrderType;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  items: { menuItemId: string; quantity: number }[];
  notes?: string;
  offerId?: string;
  paymentMethod: PaymentMethod;
}) {
  const outlet = await Outlet.findOne({ slug: input.outletSlug, isActive: true });
  if (!outlet) throw new NotFoundError("Outlet not found");

  let table: ITable | null = null;
  if (input.tableSlug) {
    table = await Table.findOne({ outletId: outlet._id, slug: input.tableSlug });
    if (!table) throw new NotFoundError("Table not found");
  }

  const orderType: OrderType = table
    ? OrderType.DINE_IN
    : input.orderType ?? OrderType.DINE_IN;

  let subtotal = 0;
  const lineItems: {
    menuItemId: string;
    nameSnapshot: string;
    priceSnapshot: number;
    quantity: number;
  }[] = [];

  const { resolveOrderMenuItem } = await import("../menu/menu.service.js");

  for (const item of input.items) {
    const menuItem = await resolveOrderMenuItem(outlet._id, item.menuItemId);
    if (!menuItem) throw new ValidationError(`Item ${item.menuItemId} unavailable`);
    subtotal += menuItem.price * item.quantity;
    lineItems.push({
      menuItemId: menuItem._id.toString(),
      nameSnapshot: menuItem.name,
      priceSnapshot: menuItem.price,
      quantity: item.quantity,
    });
  }

  let discount = 0;
  let offerTitle: string | undefined;
  let offerId: string | undefined;

  if (input.offerId) {
    const now = new Date();
    const offer = await Offer.findOne({
      _id: input.offerId,
      isActive: true,
      startAt: { $lte: now },
      endAt: { $gte: now },
      $or: [{ outletId: null }, { outletId: outlet._id }],
    });
    if (!offer) throw new ValidationError("Invalid or expired offer");
    if (offer.discountType === DiscountType.PERCENTAGE) {
      discount = Math.round((subtotal * offer.value) / 100);
    } else {
      discount = Math.min(subtotal, offer.value);
    }
    offerTitle = offer.title;
    offerId = offer._id.toString();
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const tax = Math.round(afterDiscount * 0.05);
  const total = afterDiscount + tax;
  const trackingToken = crypto.randomBytes(32).toString("hex");

  const order = await Order.create({
    outletId: outlet._id,
    tableId: table?._id ?? null,
    tableNumber: table?.tableNumber ?? null,
    orderType,
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerEmail: input.customerEmail?.trim().toLowerCase() || undefined,
    status: OrderStatus.NEW,
    paymentStatus: PaymentStatus.UNPAID,
    paymentMethod: input.paymentMethod,
    subtotal,
    discount,
    offerId: offerId ?? null,
    offerTitle,
    tax,
    total,
    notes: input.notes,
    trackingToken,
  });

  await OrderItem.insertMany(
    lineItems.map((li) => ({
      orderId: order._id,
      menuItemId: li.menuItemId,
      nameSnapshot: li.nameSnapshot,
      priceSnapshot: li.priceSnapshot,
      quantity: li.quantity,
    }))
  );

  const populated = await getOrderById(order._id.toString());
  emitToOutlet(outlet._id.toString(), OrderEvents.NEW, populated);
  emitToOrder(order._id.toString(), OrderEvents.NEW, populated);

  return populated;
}

export async function getOrderById(id: string) {
  const order = await Order.findById(id).populate("outletId", "name slug");
  if (!order) throw new NotFoundError("Order not found");
  const items = await OrderItem.find({ orderId: order._id });
  return { ...order.toObject(), items };
}

export async function trackOrder(id: string, token: string) {
  const order = await Order.findOne({ _id: id, trackingToken: token });
  if (!order) throw new NotFoundError("Order not found");
  const items = await OrderItem.find({ orderId: order._id });
  return {
    id: order._id,
    status: order.status,
    paymentStatus: order.paymentStatus,
    orderType: order.orderType,
    tableNumber: order.tableNumber,
    total: order.total,
    items,
  };
}

export async function listOrders(user: TokenPayload, outletId?: string, status?: string) {
  const filter: Record<string, unknown> = {};
  if (outletId) filter.outletId = outletId;
  else if (user.role !== Role.ADMIN && user.outletIds.length) {
    filter.outletId = { $in: user.outletIds };
  }
  if (status) filter.status = status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);
  const result = await Promise.all(
    orders.map(async (o) => {
      const items = await OrderItem.find({ orderId: o._id });
      return { ...o.toObject(), items };
    })
  );
  return result;
}

export async function updateOrderStatus(
  user: TokenPayload,
  orderId: string,
  newStatus: OrderStatus
) {
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");

  if (user.role !== Role.ADMIN) {
    if (!user.outletIds.includes(order.outletId.toString())) {
      throw new ForbiddenError();
    }
    if (user.role === Role.KITCHEN && !canKitchenTransition(order.status, newStatus)) {
      throw new ForbiddenError("Kitchen cannot perform this status change");
    }
    if (user.role === Role.MANAGER && !canManagerTransition(order.status, newStatus)) {
      throw new ForbiddenError("Manager cannot perform this status change");
    }
  }

  const oldStatus = order.status;
  order.status = newStatus;
  await order.save();

  const populated = await getOrderById(orderId);
  const outletId = order.outletId.toString();
  const eventMap: Partial<Record<OrderStatus, string>> = {
    [OrderStatus.PREPARING]: OrderEvents.PREPARING,
    [OrderStatus.READY]: OrderEvents.READY,
    [OrderStatus.DELIVERED]: OrderEvents.DELIVERED,
    [OrderStatus.COMPLETED]: OrderEvents.COMPLETED,
  };
  const event = eventMap[newStatus] ?? OrderEvents.PREPARING;
  emitToOutlet(outletId, event, populated);
  emitToOrder(orderId, event, populated);

  if (newStatus === OrderStatus.COMPLETED && oldStatus !== OrderStatus.COMPLETED) {
    void import("../../services/email/order-thank-you.email.js").then(({ trySendThankYouOnComplete }) =>
      trySendThankYouOnComplete(orderId)
    );
  }

  return { order: populated, oldStatus };
}

export async function updatePaymentStatus(
  user: TokenPayload,
  orderId: string,
  paymentStatus: PaymentStatus
) {
  if (user.role !== Role.MANAGER && user.role !== Role.ADMIN) {
    throw new ForbiddenError();
  }
  const order = await Order.findById(orderId);
  if (!order) throw new NotFoundError("Order not found");
  order.paymentStatus = paymentStatus;
  await order.save();
  const populated = await getOrderById(orderId);
  if (paymentStatus === PaymentStatus.PAID) {
    emitToOutlet(order.outletId.toString(), OrderEvents.PAYMENT, populated);
  }
  return populated;
}

