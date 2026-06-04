import { Router, type IRouter } from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { Order } from "@anilji/database";
import { PaymentStatus } from "@anilji/shared";
import { razorpayCreateSchema, razorpayVerifySchema } from "@anilji/shared";
import { validateBody } from "../../middleware/validate.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError, ValidationError } from "../../utils/errors.js";
import { env } from "../../config/env.js";
import { emitToOutlet, emitToOrder, OrderEvents } from "../../socket/index.js";
import * as ordersService from "../orders/orders.service.js";

const router: IRouter = Router();

function getRazorpay() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    return null;
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

router.post("/razorpay/create-order", validateBody(razorpayCreateSchema), async (req, res, next) => {
  try {
    const order = await Order.findById(req.body.orderId);
    if (!order) throw new NotFoundError("Order not found");
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new ValidationError("Order already paid");
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      sendSuccess(res, {
        razorpayOrderId: `mock_${order._id}`,
        amount: order.total * 100,
        currency: "INR",
        keyId: "mock_key",
      });
      return;
    }

    const rzOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order._id.toString(),
    });

    order.razorpayOrderId = rzOrder.id;
    await order.save();

    sendSuccess(res, {
      razorpayOrderId: rzOrder.id,
      amount: rzOrder.amount,
      currency: rzOrder.currency,
      keyId: env.RAZORPAY_KEY_ID,
    });
  } catch (e) {
    next(e);
  }
});

router.post("/razorpay/verify", validateBody(razorpayVerifySchema), async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const order = await Order.findById(orderId);
    if (!order) throw new NotFoundError("Order not found");

    if (env.RAZORPAY_KEY_SECRET) {
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expected = crypto
        .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest("hex");
      if (expected !== razorpay_signature) {
        throw new ValidationError("Invalid payment signature");
      }
    }

    order.paymentStatus = PaymentStatus.PAID;
    order.razorpayOrderId = razorpay_order_id;
    order.razorpayPaymentId = razorpay_payment_id;
    await order.save();

    const populated = await ordersService.getOrderById(orderId);
    emitToOutlet(order.outletId.toString(), OrderEvents.PAYMENT, populated);
    emitToOrder(orderId, OrderEvents.PAYMENT, populated);

    sendSuccess(res, populated, "Payment verified");
  } catch (e) {
    next(e);
  }
});

export default router;
