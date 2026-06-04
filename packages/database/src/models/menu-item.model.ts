import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMenuItem extends Document {
  /** Null = global master catalog item */
  outletId?: mongoose.Types.ObjectId | null;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  price: number;
  imageUrl?: string;
  imagePublicId?: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", default: null },
    categoryId: { type: Schema.Types.ObjectId, ref: "MenuCategory", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true, min: 0 },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    isAvailable: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuItemSchema.index({ outletId: 1, categoryId: 1, isAvailable: 1 });
menuItemSchema.index({ name: "text" });

export const MenuItem: Model<IMenuItem> =
  mongoose.models.MenuItem ?? mongoose.model<IMenuItem>("MenuItem", menuItemSchema);
