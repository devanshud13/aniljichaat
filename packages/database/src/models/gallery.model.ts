import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IGallery extends Document {
  outletId?: mongoose.Types.ObjectId | null;
  type: "image" | "video";
  url: string;
  publicId: string;
  caption?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const gallerySchema = new Schema<IGallery>(
  {
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", default: null },
    type: { type: String, enum: ["image", "video"], required: true },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    caption: { type: String },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gallerySchema.index({ outletId: 1, type: 1, sortOrder: 1 });

export const Gallery: Model<IGallery> =
  mongoose.models.Gallery ?? mongoose.model<IGallery>("Gallery", gallerySchema);
