import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import multer from "multer";
import QRCode from "qrcode";
import mongoose from "mongoose";
import {
  User,
  Outlet,
  Table,
  MenuCategory,
  MenuItem,
  MenuSheet,
  MenuSheetItem,
  OutletMenuConfig,
  OutletMenuAvailability,
  Offer,
  Gallery,
  WebsiteContent,
  AuditLog,
  ContactMessage,
  Client,
  Achievement,
} from "@anilji/database";
import {
  Permission,
  createUserSchema,
  resolvePermissions,
  updateUserSchema,
  resetPasswordSchema,
  outletSchema,
  menuCategorySchema,
  menuItemSchema,
  menuSheetSchema,
  menuSheetItemsSchema,
  outletMenuConfigSchema,
  outletMenuAvailabilitySchema,
  offerSchema,
  gallerySchema,
  websiteContentSchema,
  tableSchema,
  clientSchema,
  achievementSchema,
  appSettingsSchema,
} from "@anilji/shared";
import { getAppSettings, updateAppSettings } from "../../services/settings.service.js";
import { authenticate } from "../../middleware/auth.js";
import {
  requirePermission,
  requireAnyPermission,
  requireAdminRole,
} from "../../middleware/permissions.js";
import { validateBody } from "../../middleware/validate.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError } from "../../utils/errors.js";
import { uploadImage, uploadVideo, deleteAsset } from "../../services/cloudinary.service.js";
import { logAudit } from "../../services/audit.service.js";
import { env } from "../../config/env.js";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

// Users (admin only)
router.get("/users", requireAdminRole, async (_req, res, next) => {
  try {
    const users = await User.find().select("-passwordHash");
    sendSuccess(res, users);
  } catch (e) {
    next(e);
  }
});

router.post("/users", requireAdminRole, validateBody(createUserSchema), async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 12);
    const perms = resolvePermissions(req.body.role, req.body.permissions);
    const user = await User.create({
      username: req.body.username.toLowerCase(),
      passwordHash: hash,
      role: req.body.role,
      outletIds: req.body.outletIds,
      permissions: perms,
    });
    await logAudit(req, {
      userId: req.user!.userId,
      action: "USER_CREATE",
      entityType: "User",
      entityId: user._id.toString(),
    });
    sendSuccess(res, { id: user._id, username: user.username, role: user.role }, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/users/:id", requireAdminRole, validateBody(updateUserSchema), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    if (updates.role !== undefined || updates.permissions !== undefined) {
      const existing = await User.findById(req.params.id);
      if (!existing) throw new NotFoundError();
      const role = updates.role ?? existing.role;
      updates.permissions = resolvePermissions(role, updates.permissions ?? existing.permissions);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select(
      "-passwordHash"
    );
    if (!user) throw new NotFoundError();
    sendSuccess(res, user);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/users/:id/reset-password",
  requireAdminRole,
  validateBody(resetPasswordSchema),
  async (req, res, next) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 12);
    await User.findByIdAndUpdate(req.params.id, { passwordHash: hash });
    sendSuccess(res, null, "Password reset");
  } catch (e) {
    next(e);
  }
});

// Outlets
router.get(
  "/outlets",
  requireAnyPermission(Permission.OUTLETS, Permission.MENU, Permission.OFFERS, Permission.TABLES),
  async (_req, res, next) => {
  try {
    sendSuccess(res, await Outlet.find());
  } catch (e) {
    next(e);
  }
});

router.post("/outlets", requirePermission(Permission.OUTLETS), validateBody(outletSchema), async (req, res, next) => {
  try {
    const outlet = await Outlet.create(req.body);
    sendSuccess(res, outlet, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/outlets/:id",
  requirePermission(Permission.OUTLETS),
  validateBody(outletSchema.partial()),
  async (req, res, next) => {
  try {
    const outlet = await Outlet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!outlet) throw new NotFoundError();
    sendSuccess(res, outlet);
  } catch (e) {
    next(e);
  }
});

// Tables
router.get("/tables", requirePermission(Permission.TABLES), async (req, res, next) => {
  try {
    const filter = req.query.outletId ? { outletId: req.query.outletId } : {};
    sendSuccess(res, await Table.find(filter).populate("outletId", "name slug"));
  } catch (e) {
    next(e);
  }
});

router.post("/tables", requirePermission(Permission.TABLES), validateBody(tableSchema), async (req, res, next) => {
  try {
    const table = await Table.create(req.body);
    sendSuccess(res, table, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.post("/tables/:id/generate-qr", requirePermission(Permission.TABLES), async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate<{ outletId: { slug: string } }>("outletId");
    if (!table) throw new NotFoundError();
    const outlet = table.outletId;
    const url = `${env.SITE_URL}/order/${table.slug}?outlet=${outlet.slug}`;
    const qrDataUrl = await QRCode.toDataURL(url, { width: 400, margin: 2 });
    table.qrImageUrl = qrDataUrl;
    await table.save();
    sendSuccess(res, { url, qrDataUrl, table });
  } catch (e) {
    next(e);
  }
});

// Menu categories
router.get("/menu/categories", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const filter =
      req.query.catalog === "true"
        ? { $or: [{ outletId: null }, { outletId: { $exists: false } }] }
        : req.query.outletId
          ? { outletId: req.query.outletId }
          : {};
    sendSuccess(res, await MenuCategory.find(filter).sort({ sortOrder: 1 }));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/menu/categories",
  requirePermission(Permission.MENU),
  validateBody(menuCategorySchema),
  async (req, res, next) => {
  try {
    const cat = await MenuCategory.create(req.body);
    await logAudit(req, {
      userId: req.user!.userId,
      action: "MENU_CATEGORY_CREATE",
      entityType: "MenuCategory",
      entityId: cat._id.toString(),
    });
    sendSuccess(res, cat, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/menu/categories/:id", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const cat = await MenuCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) throw new NotFoundError();
    sendSuccess(res, cat);
  } catch (e) {
    next(e);
  }
});

router.delete("/menu/categories/:id", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    await MenuCategory.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// Menu items
router.get("/menu/items", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const filter =
      req.query.catalog === "true"
        ? { $or: [{ outletId: null }, { outletId: { $exists: false } }] }
        : req.query.outletId
          ? { outletId: req.query.outletId }
          : {};
    sendSuccess(res, await MenuItem.find(filter).populate("categoryId", "name").sort({ sortOrder: 1 }));
  } catch (e) {
    next(e);
  }
});

router.post("/menu/items", requirePermission(Permission.MENU), validateBody(menuItemSchema), async (req, res, next) => {
  try {
    const item = await MenuItem.create(req.body);
    await logAudit(req, {
      userId: req.user!.userId,
      action: "MENU_ITEM_CREATE",
      entityType: "MenuItem",
      entityId: item._id.toString(),
      metadata: { price: item.price },
    });
    sendSuccess(res, item, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/menu/items/:id", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new NotFoundError();
    await logAudit(req, {
      userId: req.user!.userId,
      action: "MENU_ITEM_UPDATE",
      entityType: "MenuItem",
      entityId: item._id.toString(),
      metadata: { price: item.price },
    });
    sendSuccess(res, item);
  } catch (e) {
    next(e);
  }
});

router.delete("/menu/items/:id", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    await MenuSheetItem.deleteMany({ menuItemId: req.params.id });
    await OutletMenuAvailability.deleteMany({ menuItemId: req.params.id });
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// Menu sheets (master catalog groupings)
router.get("/menu/sheets", requirePermission(Permission.MENU), async (_req, res, next) => {
  try {
    sendSuccess(res, await MenuSheet.find().sort({ sortOrder: 1, name: 1 }));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/menu/sheets",
  requirePermission(Permission.MENU),
  validateBody(menuSheetSchema),
  async (req, res, next) => {
    try {
      const sheet = await MenuSheet.create(req.body);
      sendSuccess(res, sheet, undefined, 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch("/menu/sheets/:id", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const sheet = await MenuSheet.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!sheet) throw new NotFoundError();
    sendSuccess(res, sheet);
  } catch (e) {
    next(e);
  }
});

router.delete("/menu/sheets/:id", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    await MenuSheetItem.deleteMany({ sheetId: req.params.id });
    await MenuSheet.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

router.get("/menu/sheets/:id/items", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const entries = await MenuSheetItem.find({ sheetId: req.params.id })
      .populate("menuItemId")
      .sort({ sortOrder: 1 });
    sendSuccess(res, entries);
  } catch (e) {
    next(e);
  }
});

router.put(
  "/menu/sheets/:id/items",
  requirePermission(Permission.MENU),
  validateBody(menuSheetItemsSchema),
  async (req, res, next) => {
    try {
      const sheetId = req.params.id;
      const sheet = await MenuSheet.findById(sheetId);
      if (!sheet) throw new NotFoundError();

      const ids: string[] = req.body.menuItemIds;
      await MenuSheetItem.deleteMany({ sheetId });
      if (ids.length) {
        await MenuSheetItem.insertMany(
          ids.map((menuItemId, i) => ({
            sheetId,
            menuItemId,
            sortOrder: i,
          }))
        );
      }
      const entries = await MenuSheetItem.find({ sheetId }).populate("menuItemId").sort({ sortOrder: 1 });
      sendSuccess(res, entries);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/menu/outlets/:outletId/config", requirePermission(Permission.MENU), async (req, res, next) => {
  try {
    const outletId = req.params.outletId;
    const config = await OutletMenuConfig.findOne({ outletId });
    const availability = await OutletMenuAvailability.find({ outletId });
    const { getSheetMenuItemIds } = await import("../menu/menu.service.js");
    const sheetIds = config?.sheetIds ?? [];
    const sheetItemIds = await getSheetMenuItemIds(sheetIds);
    sendSuccess(res, {
      sheetIds: sheetIds.map((id) => id.toString()),
      availability,
      sheetItemIds: sheetItemIds.map((id) => id.toString()),
    });
  } catch (e) {
    next(e);
  }
});

router.put(
  "/menu/outlets/:outletId/config",
  requirePermission(Permission.MENU),
  validateBody(outletMenuConfigSchema),
  async (req, res, next) => {
    try {
      const outletId = req.params.outletId;
      const sheetIds = req.body.sheetIds as string[];
      const config = await OutletMenuConfig.findOneAndUpdate(
        { outletId },
        { outletId, sheetIds },
        { upsert: true, new: true }
      );
      sendSuccess(res, config);
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  "/menu/outlets/:outletId/availability",
  requirePermission(Permission.MENU),
  validateBody(outletMenuAvailabilitySchema),
  async (req, res, next) => {
    try {
      const outletId = req.params.outletId;
      const items = req.body.items as {
        menuItemId: string;
        isAvailable: boolean;
        priceOverride?: number | null;
      }[];

      const ops = items.map((row) =>
        OutletMenuAvailability.findOneAndUpdate(
          { outletId, menuItemId: row.menuItemId },
          {
            outletId,
            menuItemId: row.menuItemId,
            isAvailable: row.isAvailable,
            priceOverride: row.priceOverride ?? undefined,
          },
          { upsert: true, new: true }
        )
      );
      await Promise.all(ops);
      const availability = await OutletMenuAvailability.find({ outletId });
      sendSuccess(res, availability);
    } catch (e) {
      next(e);
    }
  }
);

// Offers
router.get("/offers", requirePermission(Permission.OFFERS), async (_req, res, next) => {
  try {
    sendSuccess(res, await Offer.find().sort({ createdAt: -1 }));
  } catch (e) {
    next(e);
  }
});

router.post("/offers", requirePermission(Permission.OFFERS), validateBody(offerSchema), async (req, res, next) => {
  try {
    const offer = await Offer.create(req.body);
    await logAudit(req, {
      userId: req.user!.userId,
      action: "OFFER_CREATE",
      entityType: "Offer",
      entityId: offer._id.toString(),
    });
    sendSuccess(res, offer, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/offers/:id", requirePermission(Permission.OFFERS), async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!offer) throw new NotFoundError();
    sendSuccess(res, offer);
  } catch (e) {
    next(e);
  }
});

router.delete("/offers/:id", requirePermission(Permission.OFFERS), async (req, res, next) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// Gallery
router.get("/gallery", requirePermission(Permission.GALLERY), async (_req, res, next) => {
  try {
    sendSuccess(res, await Gallery.find().sort({ sortOrder: 1 }));
  } catch (e) {
    next(e);
  }
});

router.post("/gallery", requirePermission(Permission.GALLERY), validateBody(gallerySchema), async (req, res, next) => {
  try {
    const item = await Gallery.create(req.body);
    sendSuccess(res, item, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.delete("/gallery/:id", requirePermission(Permission.GALLERY), async (req, res, next) => {
  try {
    const item = await Gallery.findByIdAndDelete(req.params.id);
    if (item?.publicId) await deleteAsset(item.publicId, item.type === "video" ? "video" : "image");
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// CMS
router.get("/cms", requirePermission(Permission.CMS), async (req, res, next) => {
  try {
    const filter: Record<string, unknown> = {};
    if (req.query.outletId) filter.outletId = req.query.outletId;
    sendSuccess(res, await WebsiteContent.find(filter));
  } catch (e) {
    next(e);
  }
});

router.put("/cms", requirePermission(Permission.CMS), validateBody(websiteContentSchema), async (req, res, next) => {
  try {
    const content = await WebsiteContent.findOneAndUpdate(
      {
        key: req.body.key,
        outletId: req.body.outletId ?? null,
        locale: req.body.locale ?? "en",
      },
      {
        data: req.body.data,
        updatedBy: new mongoose.Types.ObjectId(req.user!.userId),
      },
      { upsert: true, new: true }
    );
    sendSuccess(res, content);
  } catch (e) {
    next(e);
  }
});

// Upload
router.post(
  "/upload/image",
  requireAnyPermission(Permission.GALLERY, Permission.MENU, Permission.OFFERS),
  upload.single("file"),
  async (req, res, next) => {
  try {
    if (!req.file) throw new NotFoundError("No file");
    const result = await uploadImage(req.file);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

router.post(
  "/upload/video",
  requirePermission(Permission.GALLERY),
  upload.single("file"),
  async (req, res, next) => {
  try {
    if (!req.file) throw new NotFoundError("No file");
    const result = await uploadVideo(req.file);
    sendSuccess(res, result);
  } catch (e) {
    next(e);
  }
});

// Audit logs
router.get("/audit-logs", requireAdminRole, async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(Number(req.query.limit) || 100)
      .populate("userId", "username role");
    sendSuccess(res, logs);
  } catch (e) {
    next(e);
  }
});

// Contact queries
router.get("/contact-messages", requireAdminRole, async (_req, res, next) => {
  try {
    sendSuccess(res, await ContactMessage.find().sort({ createdAt: -1 }).limit(200));
  } catch (e) {
    next(e);
  }
});

router.patch("/contact-messages/:id/read", requireAdminRole, async (req, res, next) => {
  try {
    const msg = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!msg) throw new NotFoundError();
    sendSuccess(res, msg);
  } catch (e) {
    next(e);
  }
});

router.delete("/contact-messages/:id", requireAdminRole, async (req, res, next) => {
  try {
    await ContactMessage.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// Clients
router.get("/clients", requireAdminRole, async (_req, res, next) => {
  try {
    sendSuccess(res, await Client.find().sort({ sortOrder: 1, name: 1 }));
  } catch (e) {
    next(e);
  }
});

router.post("/clients", requireAdminRole, validateBody(clientSchema), async (req, res, next) => {
  try {
    const client = await Client.create(req.body);
    sendSuccess(res, client, undefined, 201);
  } catch (e) {
    next(e);
  }
});

router.patch("/clients/:id", requireAdminRole, async (req, res, next) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) throw new NotFoundError();
    sendSuccess(res, client);
  } catch (e) {
    next(e);
  }
});

router.delete("/clients/:id", requireAdminRole, async (req, res, next) => {
  try {
    const client = await Client.findById(req.params.id);
    if (client?.imagePublicId) await deleteAsset(client.imagePublicId, "image");
    await Client.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// Achievements
router.get("/achievements", requireAdminRole, async (_req, res, next) => {
  try {
    sendSuccess(res, await Achievement.find().sort({ sortOrder: 1, createdAt: -1 }));
  } catch (e) {
    next(e);
  }
});

router.post(
  "/achievements",
  requireAdminRole,
  validateBody(achievementSchema),
  async (req, res, next) => {
    try {
      const item = await Achievement.create(req.body);
      sendSuccess(res, item, undefined, 201);
    } catch (e) {
      next(e);
    }
  }
);

router.patch("/achievements/:id", requireAdminRole, async (req, res, next) => {
  try {
    const item = await Achievement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) throw new NotFoundError();
    sendSuccess(res, item);
  } catch (e) {
    next(e);
  }
});

router.delete("/achievements/:id", requireAdminRole, async (req, res, next) => {
  try {
    const item = await Achievement.findById(req.params.id);
    if (item?.imagePublicId) await deleteAsset(item.imagePublicId, "image");
    await Achievement.findByIdAndDelete(req.params.id);
    sendSuccess(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
});

// App settings (admin)
router.get("/settings", requireAdminRole, async (_req, res, next) => {
  try {
    sendSuccess(res, await getAppSettings());
  } catch (e) {
    next(e);
  }
});

router.patch(
  "/settings",
  requireAdminRole,
  validateBody(appSettingsSchema),
  async (req, res, next) => {
    try {
      const settings = await updateAppSettings(req.body, req.user!.userId);
      sendSuccess(res, settings);
    } catch (e) {
      next(e);
    }
  }
);

export default router;
