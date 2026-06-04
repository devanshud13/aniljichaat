import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IMenuSheetItem extends Document {
  sheetId: mongoose.Types.ObjectId;
  menuItemId: mongoose.Types.ObjectId;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const menuSheetItemSchema = new Schema<IMenuSheetItem>(
  {
    sheetId: { type: Schema.Types.ObjectId, ref: "MenuSheet", required: true },
    menuItemId: { type: Schema.Types.ObjectId, ref: "MenuItem", required: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

menuSheetItemSchema.index({ sheetId: 1, menuItemId: 1 }, { unique: true });
menuSheetItemSchema.index({ sheetId: 1, sortOrder: 1 });

export const MenuSheetItem: Model<IMenuSheetItem> =
  mongoose.models.MenuSheetItem ??
  mongoose.model<IMenuSheetItem>("MenuSheetItem", menuSheetItemSchema);
