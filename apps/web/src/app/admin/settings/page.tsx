"use client";

import { useEffect, useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { apiAuth } from "@/lib/api";

interface AppSettings {
  thankYouEmailsEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiAuth<AppSettings>("/admin/settings").then((res) => {
      if (res.success && res.data) setSettings(res.data);
    });
  }, []);

  async function toggleThankYouEmails(enabled: boolean) {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    const res = await apiAuth<AppSettings>("/admin/settings", {
      method: "PATCH",
      body: JSON.stringify({ thankYouEmailsEnabled: enabled }),
    });
    setSaving(false);
    if (res.success && res.data) {
      setSettings(res.data);
      setMessage(enabled ? "Thank-you emails are now ON." : "Thank-you emails are now OFF.");
    } else {
      setMessage(res.message ?? "Could not save settings.");
    }
  }

  return (
    <AdminShell title="Settings">
      <div className="max-w-xl rounded-2xl border border-[#e8dcc8] bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8b1a1a]/10 text-[#8b1a1a]">
            <Mail className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h2 className="font-serif text-lg font-bold text-[#2a1810]">Customer thank-you emails</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5c4a3a]">
              When an order is marked <strong>Completed</strong>, send a branded email with invoice to
              the customer if they entered an email at checkout. On Render <strong>free</strong> tier use{" "}
              <strong>Resend</strong> (<code className="text-xs">RESEND_API_KEY</code>,{" "}
              <code className="text-xs">RESEND_FROM</code>) — Gmail SMTP is blocked there.
            </p>

            {settings === null ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-[#5c4a3a]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <label className="mt-6 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-[#e8dcc8] bg-[#fffaf5] px-4 py-3">
                <span className="font-ui text-sm font-semibold text-[#3d2914]">
                  Send thank-you emails
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.thankYouEmailsEnabled}
                  disabled={saving}
                  onClick={() => toggleThankYouEmails(!settings.thankYouEmailsEnabled)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    settings.thankYouEmailsEnabled ? "bg-[#8b1a1a]" : "bg-[#d4c4b0]"
                  } ${saving ? "opacity-60" : ""}`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                      settings.thankYouEmailsEnabled ? "left-[1.35rem]" : "left-0.5"
                    }`}
                  />
                </button>
              </label>
            )}

            {message && (
              <p
                className={`mt-4 text-sm font-medium ${
                  message.includes("ON") || message.includes("OFF")
                    ? "text-green-700"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
