import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IClient extends Document {
  name: string;
  imageUrl?: string;
  imagePublicId?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true },
    imageUrl: { type: String },
    imagePublicId: { type: String },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clientSchema.index({ isActive: 1, sortOrder: 1 });

export const Client: Model<IClient> =
  mongoose.models.Client ?? mongoose.model<IClient>("Client", clientSchema);
