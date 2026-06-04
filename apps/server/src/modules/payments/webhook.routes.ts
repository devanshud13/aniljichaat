import { Router, type IRouter } from "express";
import crypto from "crypto";
import express from "express";
import { Order } from "@anilji/database";
import { PaymentStatus } from "@anilji/shared";
import { env } from "../../config/env.js";
import { emitToOutlet, emitToOrder, OrderEvents } from "../../socket/index.js";
import * as ordersService from "../orders/orders.service.js";
import { logger } from "../../utils/logger.js";

const router: IRouter = Router();

router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      if (env.RAZORPAY_WEBHOOK_SECRET && signature) {
        const expected = crypto
          .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
          .update(req.body)
          .digest("hex");
        if (expected !== signature) {
          res.status(400).json({ success: false });
          return;
        }
      }

      const body = JSON.parse(req.body.toString()) as {
        event: string;
        payload: {
          payment?: { entity: { order_id: string; id: string } };
        };
      };

      if (body.event === "payment.captured" && body.payload.payment?.entity) {
        const { order_id, id: paymentId } = body.payload.payment.entity;
        const order = await Order.findOne({ razorpayOrderId: order_id });
        if (order && order.paymentStatus !== PaymentStatus.PAID) {
          order.paymentStatus = PaymentStatus.PAID;
          order.razorpayPaymentId = paymentId;
          await order.save();
          const populated = await ordersService.getOrderById(order._id.toString());
          emitToOutlet(order.outletId.toString(), OrderEvents.PAYMENT, populated);
          emitToOrder(order._id.toString(), OrderEvents.PAYMENT, populated);
        }
      }

      res.json({ success: true });
    } catch (err) {
      logger.error("Webhook error", { err });
      res.status(500).json({ success: false });
    }
  }
);

export default router;
