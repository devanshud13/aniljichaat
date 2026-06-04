import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOutletMenuAvailability extends Document {
  outletId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  isAvailable: boolean;
  priceOverride?: number;
  createdAt: Date;
  updatedAt: Date;
}

const outletMenuAvailabilitySchema = new Schema<IOutletMenuAvailability>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    isAvailable: { type: Boolean, default: true },
    priceOverride: { type: Number, min: 0 },
  },
  { timestamps: true }
);

outletMenuAvailabilitySchema.index({ outletId: 1, menuItemId: 1 }, { unique: true });
outletMenuAvailabilitySchema.index({ outletId: 1, isAvailable: 1 });

export const OutletMenuAvailability: Model<IOutletMenuAvailability> =
  mongoose.models.OutletMenuAvailability ??
  mongoose.model<IOutletMenuAvailability>("OutletMenuAvailability", outletMenuAvailabilitySchema);
