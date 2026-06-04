import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IOutlet extends Document {
  name: string;
  slug: string;
  address: string;
  timings: string;
  phone: string;
  mapEmbedUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const outletSchema = new Schema<IOutlet>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    address: { type: String, required: true },
    timings: { type: String, required: true },
    phone: { type: String, required: true },
    mapEmbedUrl: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Outlet: Model<IOutlet> =
  mongoose.models.Outlet ?? mongoose.model<IOutlet>("Outlet", outletSchema);
