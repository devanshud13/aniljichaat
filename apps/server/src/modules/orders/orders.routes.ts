import { Router, type IRouter } from "express";
import { updateOrderStatusSchema, updateOrderPaymentSchema } from "@anilji/shared";
import { validateBody } from "../../middleware/validate.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { Role } from "@anilji/shared";
import { sendSuccess } from "../../utils/response.js";
import * as ordersService from "./orders.service.js";
import { logAudit } from "../../services/audit.service.js";

const router: IRouter = Router();

function paramId(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

router.get("/:id/track", async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: "Tracking token required" });
      return;
    }
    const order = await ordersService.trackOrder(paramId(req.params.id), token);
    sendSuccess(res, order);
  } catch (e) {
    next(e);
  }
});

router.get(
  "/",
  authenticate,
  authorize(Role.ADMIN, Role.MANAGER, Role.KITCHEN),
  async (req, res, next) => {
    try {
      const orders = await ordersService.listOrders(
        req.user!,
        req.query.outletId as string | undefined,
        req.query.status as string | undefined
      );
      sendSuccess(res, orders);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id/status",
  authenticate,
  authorize(Role.ADMIN, Role.MANAGER, Role.KITCHEN),
  validateBody(updateOrderStatusSchema),
  async (req, res, next) => {
    try {
      const id = paramId(req.params.id);
      const { order, oldStatus } = await ordersService.updateOrderStatus(
        req.user!,
        id,
        req.body.status
      );
      void logAudit(req, {
        userId: req.user!.userId,
        action: "ORDER_STATUS_CHANGE",
        entityType: "Order",
        entityId: id,
        metadata: { from: oldStatus, to: req.body.status },
      });
      sendSuccess(res, order);
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  "/:id/payment",
  authenticate,
  authorize(Role.ADMIN, Role.MANAGER),
  validateBody(updateOrderPaymentSchema),
  async (req, res, next) => {
    try {
      const id = paramId(req.params.id);
      const order = await ordersService.updatePaymentStatus(
        req.user!,
        id,
        req.body.paymentStatus
      );
      void logAudit(req, {
        userId: req.user!.userId,
        action: "PAYMENT_UPDATE",
        entityType: "Order",
        entityId: id,
        metadata: { paymentStatus: req.body.paymentStatus },
      });
      sendSuccess(res, order);
    } catch (e) {
      next(e);
    }
  }
);

async function renderBill(order: Awaited<ReturnType<typeof ordersService.getOrderById>>) {
  const discount = (order as { discount?: number }).discount ?? 0;
  const offerTitle = (order as { offerTitle?: string }).offerTitle;
  return `
    <html><head><title>Bill #${order._id}</title></head>
    <body style="font-family:sans-serif;padding:24px">
    <h1>Anil Ji Chaat</h1>
    <p>${order.orderType === "TAKEAWAY" ? "Takeaway" : order.tableNumber ? `Table: ${order.tableNumber}` : "Dine-In"}</p>
    <p>Order: ${String(order._id).slice(-8).toUpperCase()}</p>
    <hr/>
    <ul>${order.items.map((i: { nameSnapshot: string; quantity: number; priceSnapshot: number }) => `<li>${i.nameSnapshot} x${i.quantity} — ₹${i.priceSnapshot * i.quantity}</li>`).join("")}</ul>
    <p>Subtotal: ₹${order.subtotal}</p>
    ${discount > 0 ? `<p>Discount${offerTitle ? ` (${offerTitle})` : ""}: −₹${discount}</p>` : ""}
    <p>Tax: ₹${order.tax}</p>
    <p><strong>Total: ₹${order.total}</strong></p>
    <p>Payment: ${order.paymentStatus}</p>
    </body></html>`;
}

const billHandler = async (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
  try {
    const order = await ordersService.getOrderById(paramId(req.params.id));
    res.setHeader("Content-Type", "text/html");
    res.send(await renderBill(order));
  } catch (e) {
    next(e);
  }
};

router.get("/:id/bill", authenticate, authorize(Role.ADMIN, Role.MANAGER), billHandler);
router.post("/:id/bill", authenticate, authorize(Role.ADMIN, Role.MANAGER), billHandler);

export default router;
