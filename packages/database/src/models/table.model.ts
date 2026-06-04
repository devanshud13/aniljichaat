import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ITable extends Document {
  outletId: mongoose.Types.ObjectId;
  tableNumber: number;
  slug: string;
  qrImageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const tableSchema = new Schema<ITable>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", required: true },
    tableNumber: { type: Number, required: true },
    slug: { type: String, required: true },
    qrImageUrl: { type: String },
  },
  { timestamps: true }
);

tableSchema.index({ outletId: 1, slug: 1 }, { unique: true });

export const Table: Model<ITable> =
  mongoose.models.Table ?? mongoose.model<ITable>("Table", tableSchema);
