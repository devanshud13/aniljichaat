import bcrypt from "bcrypt";
import {
  connectDatabase,
  disconnectDatabase,
  User,
  Outlet,
  Table,
  MenuCategory,
  MenuItem,
  Offer,
  WebsiteContent,
  Client,
  MenuSheet,
  MenuSheetItem,
  OutletMenuConfig,
  OutletMenuAvailability,
} from "@anilji/database";
import { Role, DiscountType } from "@anilji/shared";
import { env } from "../config/env.js";

const CATEGORIES = [
  { name: "Chaat", slug: "chaat" },
  { name: "Golgappe", slug: "golgappe" },
  { name: "Bhalla Papdi", slug: "bhalla-papdi" },
  { name: "Tikki", slug: "tikki" },
  { name: "Beverages", slug: "beverages" },
  { name: "Special Items", slug: "special-items" },
];

const SAMPLE_ITEMS: Record<string, { name: string; slug: string; price: number; description: string }[]> = {
  chaat: [
    { name: "Aloo Tikki Chaat", slug: "aloo-tikki-chaat", price: 80, description: "Crispy aloo tikki with chutneys" },
    { name: "Papdi Chaat", slug: "papdi-chaat", price: 70, description: "Classic papdi chaat" },
  ],
  golgappe: [
    { name: "Golgappe (6 pcs)", slug: "golgappe-6", price: 50, description: "Crisp pani puri" },
    { name: "Golgappe (12 pcs)", slug: "golgappe-12", price: 90, description: "Family serving" },
  ],
  "bhalla-papdi": [
    { name: "Bhalla Papdi", slug: "bhalla-papdi", price: 75, description: "Soft bhalla with papdi" },
  ],
  tikki: [
    { name: "Aloo Tikki Plate", slug: "aloo-tikki-plate", price: 60, description: "Two tikkis with chutney" },
  ],
  beverages: [
    { name: "Sweet Lassi", slug: "sweet-lassi", price: 50, description: "Chilled sweet lassi" },
    { name: "Masala Chaas", slug: "masala-chaas", price: 40, description: "Spiced buttermilk" },
  ],
  "special-items": [
    { name: "Raj Kachori", slug: "raj-kachori", price: 120, description: "Royal kachori chaat" },
    { name: "Anil Ji Special Plate", slug: "special-plate", price: 150, description: "Chef special assortment" },
  ],
};

async function seed() {
  await connectDatabase(env.MONGODB_URI);
  console.log("Seeding database...");

  const outlet = await Outlet.findOneAndUpdate(
    { slug: "ambala" },
    {
      name: "Anil Ji Chaat - Ambala",
      slug: "ambala",
      address: "Jaggi City Centre, Sena Nagar, Ambala City, Haryana",
      timings: "11:00 AM - 10:00 PM",
      phone: "+919876543210",
      mapEmbedUrl:
        "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3452.0!2d76.7767!3d30.3782!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sAmbala!5e0!3m2!1sen!2sin!4v1",
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const passwordHash = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, 12);
  await User.findOneAndUpdate(
    { username: env.SEED_ADMIN_USERNAME.toLowerCase() },
    {
      username: env.SEED_ADMIN_USERNAME.toLowerCase(),
      passwordHash,
      role: Role.ADMIN,
      outletIds: [outlet._id],
      isActive: true,
    },
    { upsert: true, new: true }
  );

  for (let i = 1; i <= 10; i++) {
    await Table.findOneAndUpdate(
      { outletId: outlet._id, slug: `table-${i}` },
      { outletId: outlet._id, tableNumber: i, slug: `table-${i}` },
      { upsert: true }
    );
  }

  const catalogItemIds: import("mongoose").Types.ObjectId[] = [];

  for (let i = 0; i < CATEGORIES.length; i++) {
    const cat = CATEGORIES[i]!;
    const category = await MenuCategory.findOneAndUpdate(
      { outletId: null, slug: cat.slug },
      {
        outletId: null,
        name: cat.name,
        slug: cat.slug,
        sortOrder: i,
        isActive: true,
      },
      { upsert: true, new: true }
    );

    const items = SAMPLE_ITEMS[cat.slug] ?? [];
    for (let j = 0; j < items.length; j++) {
      const item = items[j]!;
      const doc = await MenuItem.findOneAndUpdate(
        { outletId: null, slug: item.slug },
        {
          outletId: null,
          categoryId: category._id,
          name: item.name,
          slug: item.slug,
          description: item.description,
          price: item.price,
          isAvailable: true,
          sortOrder: j,
        },
        { upsert: true, new: true }
      );
      catalogItemIds.push(doc._id);
    }
  }

  const mainSheet = await MenuSheet.findOneAndUpdate(
    { slug: "main-menu" },
    { name: "Main Menu", slug: "main-menu", sortOrder: 0, isActive: true },
    { upsert: true, new: true }
  );

  await MenuSheetItem.deleteMany({ sheetId: mainSheet._id });
  if (catalogItemIds.length) {
    await MenuSheetItem.insertMany(
      catalogItemIds.map((menuItemId, i) => ({
        sheetId: mainSheet._id,
        menuItemId,
        sortOrder: i,
      }))
    );
  }

  await OutletMenuConfig.findOneAndUpdate(
    { outletId: outlet._id },
    { outletId: outlet._id, sheetIds: [mainSheet._id] },
    { upsert: true }
  );

  for (const menuItemId of catalogItemIds) {
    await OutletMenuAvailability.findOneAndUpdate(
      { outletId: outlet._id, menuItemId },
      { outletId: outlet._id, menuItemId, isAvailable: true },
      { upsert: true }
    );
  }

  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  await Offer.findOneAndUpdate(
    { slug: "welcome-20" },
    {
      outletId: outlet._id,
      title: "Welcome Offer - 20% Off",
      slug: "welcome-20",
      description: "Get 20% off on your first order above ₹200",
      discountType: DiscountType.PERCENTAGE,
      value: 20,
      startAt: now,
      endAt: end,
      isActive: true,
    },
    { upsert: true }
  );
  await Offer.findOneAndUpdate(
    { slug: "weekend-special" },
    {
      outletId: outlet._id,
      title: "Weekend Special",
      slug: "weekend-special",
      description: "Flat ₹30 off on special items",
      discountType: DiscountType.FLAT,
      value: 30,
      startAt: now,
      endAt: end,
      isActive: true,
    },
    { upsert: true }
  );

  const cmsBlocks = [
    {
      key: "home.hero",
      data: {
        title: "Anil Ji Chaat",
        subtitle: "Authentic Street Food from the Heart of Ambala",
        cta: "View Menu",
        ctaLink: "/menu",
      },
    },
    {
      key: "home.about",
      data: {
        title: "Our Story",
        text: "For generations, Anil Ji Chaat has been serving the finest chaat, golgappe, and street food delights in Ambala.",
      },
    },
    {
      key: "home.testimonials",
      data: {
        items: [
          { name: "Priya S.", text: "Best golgappe in Ambala!", rating: 5 },
          { name: "Rahul M.", text: "Always fresh and delicious.", rating: 5 },
        ],
      },
    },
    {
      key: "about.history",
      data: {
        title: "Our History",
        text: "Started as a small street cart, Anil Ji Chaat grew into Ambala's favorite chaat destination at Jaggi City Centre.",
      },
    },
    {
      key: "about.mission",
      data: {
        title: "Our Mission",
        text: "To serve authentic, hygienic, and delicious Indian street food with a smile.",
      },
    },
    {
      key: "contact.details",
      data: {
        address: "Jaggi City Centre, Sena Nagar, Ambala City, Haryana",
        phone: "+919876543210",
        email: "hello@aniljichaat.com",
        hours: "11:00 AM - 10:00 PM",
      },
    },
  ];

  for (const block of cmsBlocks) {
    await WebsiteContent.findOneAndUpdate(
      { key: block.key, outletId: null, locale: "en" },
      { key: block.key, outletId: null, locale: "en", data: block.data },
      { upsert: true }
    );
  }

  await WebsiteContent.findOneAndUpdate(
    { key: "app.settings", outletId: null, locale: "en" },
    {
      key: "app.settings",
      outletId: null,
      locale: "en",
      data: { thankYouEmailsEnabled: false },
    },
    { upsert: true }
  );

  const clientNames = [
    "TAJ HOTELS LTD (MUMBAI)",
    "TAJ CATERER PVT LTD",
    "OSWAL GROUP",
    "JAQUAR GROUP",
    "WAVE GROUP",
    "T.C SPINNERS PVT LTD",
    "RADDISON HOTELS",
    "THE LALIT CHANDIGARH",
    "BEST WESTERN HOTELS",
    "J.W MARRIOT HOTELS",
    "ITC HOTELS LTD",
    "HOLIDAY INN HOTELS",
    "NOORMAHAL KARNAL",
    "NIRWANA CLUB HOTELS",
    "AMBROZIA CATERERS CHANDIGARH",
    "FOODLINK CATERERS",
  ];

  for (let i = 0; i < clientNames.length; i++) {
    const name = clientNames[i]!;
    await Client.findOneAndUpdate(
      { name },
      { name, sortOrder: i, isActive: true },
      { upsert: true }
    );
  }

  console.log("Seed completed!");
  console.log(`Admin: ${env.SEED_ADMIN_USERNAME} / ${env.SEED_ADMIN_PASSWORD}`);
  await disconnectDatabase();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
