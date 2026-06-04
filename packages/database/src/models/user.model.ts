import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role } from "@anilji/shared";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: Role;
  outletIds: mongoose.Types.ObjectId[];
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ["ADMIN", "MANAGER", "KITCHEN"] },
    outletIds: [{ type: Schema.Types.ObjectId, ref: "Outlet" }],
    permissions: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ outletIds: 1 });

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", userSchema);
