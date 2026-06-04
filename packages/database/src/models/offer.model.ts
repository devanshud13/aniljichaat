import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { DiscountType } from "@anilji/shared";

export interface IOffer extends Document {
  outletId?: mongoose.Types.ObjectId | null;
  title: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  imagePublicId?: string;
  discountType: DiscountType;
  value: number;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  /** Exclusive offers are hidden on home/offers pages but usable at checkout. */
  isExclusive: boolean;
  promoCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const offerSchema = new Schema<IOffer>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", default: null },
    title: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    discountType: { type: String, enum: ["PERCENTAGE", "FLAT"], required: true },
    value: { type: Number, required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isExclusive: { type: Boolean, default: false },
    promoCode: { type: String, trim: true, uppercase: true },
  },
  { timestamps: true }
);

offerSchema.index({ outletId: 1, isActive: 1, startAt: 1, endAt: 1 });

export const Offer: Model<IOffer> =
  mongoose.models.Offer ?? mongoose.model<IOffer>("Offer", offerSchema);
