import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import { ValidationError } from "../utils/errors.js";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024;

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

function validateFile(file: Express.Multer.File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    throw new ValidationError("Only JPEG, PNG, and WebP images are allowed");
  }
  if (file.size > MAX_SIZE) {
    throw new ValidationError("File size must be under 5MB");
  }
}

export async function uploadImage(file: Express.Multer.File) {
  validateFile(file);
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return {
      url: `https://placehold.co/400x300?text=${encodeURIComponent(file.originalname)}`,
      publicId: `local/${Date.now()}`,
    };
  }
  const result = await new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "anilji-chaat", resource_type: "image" },
      (err, res) => {
        if (err || !res) reject(err ?? new Error("Upload failed"));
        else resolve({ url: res.secure_url, publicId: res.public_id });
      }
    );
    stream.end(file.buffer);
  });
  return result;
}

export async function uploadVideo(file: Express.Multer.File) {
  if (file.size > 50 * 1024 * 1024) {
    throw new ValidationError("Video must be under 50MB");
  }
  if (!env.CLOUDINARY_CLOUD_NAME) {
    return { url: file.originalname, publicId: `local/video/${Date.now()}` };
  }
  const result = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    { folder: "anilji-chaat/videos", resource_type: "video" }
  );
  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteAsset(publicId: string, resourceType: "image" | "video" = "image") {
  if (!env.CLOUDINARY_CLOUD_NAME) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
