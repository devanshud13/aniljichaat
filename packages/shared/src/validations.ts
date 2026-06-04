import { z } from "zod";
import { DiscountType, OrderStatus, OrderType, PaymentMethod, PaymentStatus, Role } from "./enums.js";

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

export const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  role: z.nativeEnum(Role),
  outletIds: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
});

export const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  outletIds: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(6).max(100),
});

export const outletSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  address: z.string().min(1).max(500),
  timings: z.string().min(1).max(200),
  phone: z.string().min(10).max(15),
  mapEmbedUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});

export const menuCategorySchema = z.object({
  outletId: z.string().nullable().optional(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const menuItemSchema = z.object({
  outletId: z.string().nullable().optional(),
  categoryId: z.string(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  description: z.string().max(1000).optional(),
  price: z.number().positive(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  isAvailable: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const menuSheetSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const menuSheetItemsSchema = z.object({
  menuItemIds: z.array(z.string()).min(0),
});

export const outletMenuConfigSchema = z.object({
  sheetIds: z.array(z.string()),
});

export const outletMenuAvailabilitySchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string(),
      isAvailable: z.boolean(),
      priceOverride: z.number().positive().optional().nullable(),
    })
  ),
});

export const offerSchema = z.object({
  outletId: z.string().nullable().optional(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(50),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  discountType: z.nativeEnum(DiscountType),
  value: z.number().nonnegative(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  isActive: z.boolean().default(true),
  isExclusive: z.boolean().default(false),
  promoCode: z.string().max(50).optional(),
});

export const validateOfferCodeSchema = z.object({
  code: z.string().min(1).max(50),
});

export const clientSchema = z.object({
  name: z.string().min(1).max(200),
  imageUrl: z.string().url().optional(),
  imagePublicId: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const achievementSchema = z.object({
  caption: z.string().min(1).max(500),
  imageUrl: z.string().url(),
  imagePublicId: z.string(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const gallerySchema = z.object({
  outletId: z.string().nullable().optional(),
  type: z.enum(["image", "video"]),
  url: z.string().url(),
  publicId: z.string(),
  caption: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export const partnershipSchema = z.object({
  companyName: z.string().min(1).max(200),
  contactName: z.string().min(1).max(100),
  phone: z.string().min(10).max(15),
  email: z.string().email(),
  message: z.string().min(1).max(2000),
});

export const websiteContentSchema = z.object({
  key: z.string().min(1).max(100),
  outletId: z.string().nullable().optional(),
  locale: z.string().default("en"),
  data: z.record(z.unknown()),
});

export const tableSchema = z.object({
  outletId: z.string(),
  tableNumber: z.number().int().positive(),
  slug: z.string().min(1).max(50),
});

export const orderItemInputSchema = z.object({
  menuItemId: z.string(),
  quantity: z.number().int().positive().max(50),
});

export const createOrderSchema = z
  .object({
    outletSlug: z.string(),
    tableSlug: z.string().optional(),
    orderType: z.nativeEnum(OrderType).default(OrderType.DINE_IN),
    customerName: z.string().max(100).optional(),
    customerPhone: z.string().max(15).optional(),
    customerEmail: z.preprocess(
      (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
      z.string().email().max(200).optional()
    ),
    items: z.array(orderItemInputSchema).min(1),
    notes: z.string().max(500).optional(),
    offerId: z.string().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod),
  })
  .refine(
    (data) => data.orderType !== OrderType.DINE_IN || !!data.tableSlug || true,
    { message: "Invalid order configuration" }
  );

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const updateOrderPaymentSchema = z.object({
  paymentStatus: z.nativeEnum(PaymentStatus),
});

export const razorpayVerifySchema = z.object({
  orderId: z.string(),
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

export const razorpayCreateSchema = z.object({
  orderId: z.string(),
});

export const appSettingsSchema = z.object({
  thankYouEmailsEnabled: z.boolean(),
});
