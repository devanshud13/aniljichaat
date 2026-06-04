import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IWebsiteContent extends Document {
  key: string;
  outletId?: mongoose.Types.ObjectId | null;
  locale: string;
  data: Record<string, unknown>;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const websiteContentSchema = new Schema<IWebsiteContent>(
  {
    key: { type: String, required: true },
    outletId: { type: Schema.Types.ObjectId, ref: "Outlet", default: null },
    locale: { type: String, default: "en" },
    data: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

websiteContentSchema.index({ key: 1, outletId: 1, locale: 1 }, { unique: true });

export const WebsiteContent: Model<IWebsiteContent> =
  mongoose.models.WebsiteContent ??
  mongoose.model<IWebsiteContent>("WebsiteContent", websiteContentSchema);
