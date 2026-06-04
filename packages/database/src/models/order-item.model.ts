import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOrderItem extends Document {
  orderId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  nameSnapshot: string;
  priceSnapshot: number;
  quantity: number;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    nameSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: false }
);

orderItemSchema.index({ orderId: 1 });

export const OrderItem: Model<IOrderItem> =
  mongoose.models.OrderItem ??
  mongoose.model<IOrderItem>("OrderItem", orderItemSchema);
