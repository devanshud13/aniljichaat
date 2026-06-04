import { Router, type IRouter } from "express";
import {
  Outlet,
  MenuCategory,
  MenuItem,
  Offer,
  Gallery,
  WebsiteContent,
  ContactMessage,
  Table,
  Client,
  Achievement,
} from "@anilji/database";
import {
  contactSchema,
  partnershipSchema,
  createOrderSchema,
  validateOfferCodeSchema,
} from "@anilji/shared";
import * as ordersService from "../orders/orders.service.js";
import { validateBody } from "../../middleware/validate.js";
import { sendSuccess } from "../../utils/response.js";
import { NotFoundError } from "../../utils/errors.js";

const router: IRouter = Router();

router.get("/outlets", async (_req, res, next) => {
  try {
    const outlets = await Outlet.find({ isActive: true }).sort({ name: 1 });
    sendSuccess(res, outlets);
  } catch (e) {
    next(e);
  }
});

router.get("/outlets/:slug", async (req, res, next) => {
  try {
    const outlet = await Outlet.findOne({ slug: req.params.slug, isActive: true });
    if (!outlet) throw new NotFoundError("Outlet not found");
    sendSuccess(res, outlet);
  } catch (e) {
    next(e);
  }
});

router.get("/menu/:outletSlug", async (req, res, next) => {
  try {
    const outlet = await Outlet.findOne({ slug: req.params.outletSlug, isActive: true });
    if (!outlet) throw new NotFoundError("Outlet not found");
    const { resolveOutletMenu } = await import("../menu/menu.service.js");
    const { categories, items } = await resolveOutletMenu(outlet._id);
    sendSuccess(res, { categories, items });
  } catch (e) {
    next(e);
  }
});

async function fetchActiveOffers(outletSlug: string, includeExclusive: boolean) {
  const outlet = await Outlet.findOne({ slug: outletSlug, isActive: true });
  if (!outlet) throw new NotFoundError("Outlet not found");
  const now = new Date();
  const filter: Record<string, unknown> = {
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
    $or: [{ outletId: null }, { outletId: outlet._id }],
  };
  if (!includeExclusive) {
    filter.isExclusive = { $ne: true };
  }
  return Offer.find(filter).sort({ startAt: -1 });
}

router.get("/offers/:outletSlug", async (req, res, next) => {
  try {
    const offers = await fetchActiveOffers(req.params.outletSlug, false);
    sendSuccess(res, offers);
  } catch (e) {
    next(e);
  }
});

/** Validate exclusive offer code (not listed on home/offers pages). */
router.post(
  "/offers/:outletSlug/validate-code",
  validateBody(validateOfferCodeSchema),
  async (req, res, next) => {
    try {
      const outlet = await Outlet.findOne({ slug: req.params.outletSlug, isActive: true });
      if (!outlet) throw new NotFoundError("Outlet not found");
      const code = req.body.code.trim().toUpperCase();
      const now = new Date();
      const codeLower = req.body.code.trim().toLowerCase();
      const offer = await Offer.findOne({
        isActive: true,
        isExclusive: true,
        startAt: { $lte: now },
        endAt: { $gte: now },
        $and: [
          { $or: [{ outletId: null }, { outletId: outlet._id }] },
          { $or: [{ promoCode: code }, { slug: codeLower }] },
        ],
      });
      if (!offer) {
        res.status(400).json({ success: false, message: "Invalid or expired offer code" });
        return;
      }
      sendSuccess(res, offer);
    } catch (e) {
      next(e);
    }
  }
);

router.get("/clients", async (_req, res, next) => {
  try {
    const clients = await Client.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
    sendSuccess(res, clients);
  } catch (e) {
    next(e);
  }
});

router.get("/achievements", async (_req, res, next) => {
  try {
    const items = await Achievement.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
    sendSuccess(res, items);
  } catch (e) {
    next(e);
  }
});

router.get("/gallery/:outletSlug", async (req, res, next) => {
  try {
    const outlet = await Outlet.findOne({ slug: req.params.outletSlug, isActive: true });
    if (!outlet) throw new NotFoundError("Outlet not found");
    const gallery = await Gallery.find({
      $or: [{ outletId: null }, { outletId: outlet._id }],
    }).sort({ sortOrder: 1 });
    sendSuccess(res, gallery);
  } catch (e) {
    next(e);
  }
});

router.get("/content/:outletSlug/:page", async (req, res, next) => {
  try {
    const outlet = await Outlet.findOne({ slug: req.params.outletSlug, isActive: true });
    const prefix = `${req.params.page}.`;
    const filter: Record<string, unknown> = {
      key: { $regex: `^${prefix}` },
      locale: "en",
    };
    if (outlet) {
      filter.$or = [{ outletId: null }, { outletId: outlet._id }];
    } else {
      filter.outletId = null;
    }
    const blocks = await WebsiteContent.find(filter);
    const data: Record<string, unknown> = {};
    for (const block of blocks) {
      data[block.key] = block.data;
    }
    sendSuccess(res, data);
  } catch (e) {
    next(e);
  }
});

router.post("/contact", validateBody(contactSchema), async (req, res, next) => {
  try {
    const msg = await ContactMessage.create(req.body);
    sendSuccess(res, { id: msg._id }, "Message sent", 201);
  } catch (e) {
    next(e);
  }
});

router.post("/partnerships", validateBody(partnershipSchema), async (req, res, next) => {
  try {
    const msg = await ContactMessage.create({
      name: req.body.contactName,
      phone: req.body.phone,
      email: req.body.email,
      message: `[Partnership: ${req.body.companyName}] ${req.body.message}`,
    });
    sendSuccess(res, { id: msg._id }, "Partnership inquiry sent", 201);
  } catch (e) {
    next(e);
  }
});

router.post("/orders", validateBody(createOrderSchema), async (req, res, next) => {
  try {
    const order = await ordersService.createOrder(req.body);
    sendSuccess(res, order, "Order placed", 201);
  } catch (e) {
    next(e);
  }
});

router.get("/orders/:id/track", async (req, res, next) => {
  try {
    const token = req.query.token as string;
    if (!token) {
      res.status(400).json({ success: false, message: "Tracking token required" });
      return;
    }
    const order = await ordersService.trackOrder(req.params.id, token);
    sendSuccess(res, order);
  } catch (e) {
    next(e);
  }
});

router.get("/tables/:outletSlug/:tableSlug", async (req, res, next) => {
  try {
    const outlet = await Outlet.findOne({ slug: req.params.outletSlug, isActive: true });
    if (!outlet) throw new NotFoundError("Outlet not found");
    const table = await Table.findOne({
      outletId: outlet._id,
      slug: req.params.tableSlug,
    });
    if (!table) throw new NotFoundError("Table not found");
    sendSuccess(res, { outlet, table });
  } catch (e) {
    next(e);
  }
});

export default router;
