import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAchievement extends Document {
  caption: string;
  imageUrl: string;
  imagePublicId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>(
  {
    caption: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

achievementSchema.index({ isActive: 1, sortOrder: 1 });

export const Achievement: Model<IAchievement> =
  mongoose.models.Achievement ?? mongoose.model<IAchievement>("Achievement", achievementSchema);
