import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOutletMenuConfig extends Document {
  outletId: mongoose.Types.ObjectId;
  sheetIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const outletMenuConfigSchema = new Schema<IOutletMenuConfig>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", required: true, unique: true },
    sheetIds: [{ type: Schema.Types.ObjectId, ref: "MenuSheet" }],
  },
  { timestamps: true }
);

export const OutletMenuConfig: Model<IOutletMenuConfig> =
  mongoose.models.OutletMenuConfig ??
  mongoose.model<IOutletMenuConfig>("OutletMenuConfig", outletMenuConfigSchema);
