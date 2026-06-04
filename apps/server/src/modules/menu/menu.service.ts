import type { Types } from "mongoose";
import {
  MenuCategory,
  MenuItem,
  MenuSheetItem,
  OutletMenuAvailability,
  OutletMenuConfig,
  type IMenuCategory,
  type IMenuItem,
} from "@anilji/database";

export async function resolveOutletMenu(outletId: Types.ObjectId): Promise<{
  categories: IMenuCategory[];
  items: (IMenuItem & { price: number })[];
}> {
  const config = await OutletMenuConfig.findOne({ outletId });

  if (!config?.sheetIds?.length) {
    const categories = await MenuCategory.find({ outletId, isActive: true }).sort({ sortOrder: 1 });
    const items = await MenuItem.find({ outletId, isAvailable: true }).sort({ sortOrder: 1 });
    return { categories, items };
  }

  const sheetItemIds = await MenuSheetItem.find({
    sheetId: { $in: config.sheetIds },
  }).distinct("menuItemId");

  if (sheetItemIds.length === 0) {
    return { categories: [], items: [] };
  }

  const availability = await OutletMenuAvailability.find({
    outletId,
    menuItemId: { $in: sheetItemIds },
    isAvailable: true,
  });

  const availableIds = availability.map((a) => a.menuItemId);
  const priceByItem = new Map(
    availability.map((a) => [a.menuItemId.toString(), a.priceOverride])
  );

  const rawItems = await MenuItem.find({
    _id: { $in: availableIds },
    isAvailable: { $ne: false },
  }).sort({ sortOrder: 1 });

  const items = rawItems.map((item) => {
    const override = priceByItem.get(item._id.toString());
    const doc = item.toObject() as IMenuItem & { price: number };
    if (override != null) doc.price = override;
    return doc;
  });

  const categoryIds = [...new Set(items.map((i) => i.categoryId.toString()))];
  const categories = await MenuCategory.find({
    _id: { $in: categoryIds },
    isActive: true,
  }).sort({ sortOrder: 1 });

  return { categories, items };
}

export async function getSheetMenuItemIds(sheetIds: Types.ObjectId[]): Promise<Types.ObjectId[]> {
  if (!sheetIds.length) return [];
  return MenuSheetItem.find({ sheetId: { $in: sheetIds } }).distinct("menuItemId");
}

/** Validates a cart line against outlet menu (legacy per-outlet or sheet + availability). */
export async function resolveOrderMenuItem(
  outletId: Types.ObjectId,
  menuItemId: string
): Promise<{ _id: Types.ObjectId; name: string; price: number } | null> {
  const legacy = await MenuItem.findOne({
    _id: menuItemId,
    outletId,
    isAvailable: true,
  });
  if (legacy) {
    return { _id: legacy._id, name: legacy.name, price: legacy.price };
  }

  const config = await OutletMenuConfig.findOne({ outletId });
  if (!config?.sheetIds?.length) return null;

  const inSheet = await MenuSheetItem.findOne({
    sheetId: { $in: config.sheetIds },
    menuItemId,
  });
  if (!inSheet) return null;

  const avail = await OutletMenuAvailability.findOne({
    outletId,
    menuItemId,
    isAvailable: true,
  });
  if (!avail) return null;

  const catalogItem = await MenuItem.findOne({
    _id: menuItemId,
    isAvailable: { $ne: false },
  });
  if (!catalogItem) return null;

  const price = avail.priceOverride ?? catalogItem.price;
  return { _id: catalogItem._id, name: catalogItem.name, price };
}
