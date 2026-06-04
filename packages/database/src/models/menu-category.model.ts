import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMenuCategory extends Document {
  /** Null = global master catalog category */
  outletId?: mongoose.Types.ObjectId | null;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuCategorySchema = new Schema<IMenuCategory>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", default: null },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuCategorySchema.index({ outletId: 1, slug: 1 }, { unique: true });

export const MenuCategory: Model<IMenuCategory> =
  mongoose.models.MenuCategory ??
  mongoose.model<IMenuCategory>("MenuCategory", menuCategorySchema);
