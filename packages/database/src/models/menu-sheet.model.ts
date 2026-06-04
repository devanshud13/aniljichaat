import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMenuSheet extends Document {
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const menuSheetSchema = new Schema<IMenuSheet>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuSheetSchema.index({ slug: 1 }, { unique: true });

export const MenuSheet: Model<IMenuSheet> =
  mongoose.models.MenuSheet ?? mongoose.model<IMenuSheet>("MenuSheet", menuSheetSchema);
