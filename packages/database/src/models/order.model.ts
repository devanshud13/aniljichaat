import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { OrderStatus, OrderType, PaymentMethod, PaymentStatus } from "@anilji/shared";

export interface IOrder extends Document {
  outletId: mongoose.Types.ObjectId;
  tableId?: mongoose.Types.ObjectId | null;
  tableNumber?: number | null;
  orderType: OrderType;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  thankYouEmailSent?: boolean;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  subtotal: number;
  discount: number;
  offerId?: mongoose.Types.ObjectId | null;
  offerTitle?: string;
  tax: number;
  total: number;
  notes?: string;
  trackingToken: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", required: true },
    tableId: { type: Schema.Types.ObjectId, ref: "Table", default: null },
    tableNumber: { type: Number, default: null },
    orderType: { type: String, enum: ["DINE_IN", "TAKEAWAY"], default: "DINE_IN" },
    customerName: { type: String },
    customerPhone: { type: String },
    customerEmail: { type: String, trim: true, lowercase: true },
    thankYouEmailSent: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["NEW", "PREPARING", "READY", "DELIVERED", "COMPLETED"],
      default: "NEW",
    },
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID", "REFUNDED"],
      default: "UNPAID",
    },
    paymentMethod: { type: String, enum: ["CASH", "RAZORPAY"], required: true },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    offerId: { type: Schema.Types.ObjectId, ref: "Offer", default: null },
    offerTitle: { type: String },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
    trackingToken: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

orderSchema.index({ outletId: 1, status: 1, createdAt: -1 });
orderSchema.index({ outletId: 1, tableId: 1, status: 1 });

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", orderSchema);
