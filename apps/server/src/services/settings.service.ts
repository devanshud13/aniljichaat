import mongoose from "mongoose";
import { WebsiteContent } from "@anilji/database";

const SETTINGS_KEY = "app.settings";

export interface AppSettings {
  thankYouEmailsEnabled: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  thankYouEmailsEnabled: false,
};

export async function getAppSettings(): Promise<AppSettings> {
  const doc = await WebsiteContent.findOne({ key: SETTINGS_KEY, outletId: null, locale: "en" });
  if (!doc?.data || typeof doc.data !== "object") return { ...DEFAULT_SETTINGS };
  const data = doc.data as Partial<AppSettings>;
  return {
    thankYouEmailsEnabled: Boolean(data.thankYouEmailsEnabled),
  };
}

export async function updateAppSettings(
  patch: Partial<AppSettings>,
  userId?: string
): Promise<AppSettings> {
  const current = await getAppSettings();
  const next: AppSettings = { ...current, ...patch };
  await WebsiteContent.findOneAndUpdate(
    { key: SETTINGS_KEY, outletId: null, locale: "en" },
    {
      key: SETTINGS_KEY,
      outletId: null,
      locale: "en",
      data: next,
      ...(userId ? { updatedBy: new mongoose.Types.ObjectId(userId) } : {}),
    },
    { upsert: true }
  );
  return next;
}
