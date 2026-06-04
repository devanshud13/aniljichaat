"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  UtensilsCrossed,
  Tag,
  Images,
  FileText,
  Store,
  QrCode,
  Users,
  ScrollText,
  ChefHat,
  ClipboardList,
  MessageSquare,
  Building2,
  Award,
  Settings,
} from "lucide-react";
import { Permission, Role } from "@anilji/shared";
import { AdminShell } from "@/components/admin/admin-shell";
import { apiAuth } from "@/lib/api";
import { userHasPermission, type AuthUser } from "@/lib/permissions";

const adminOnlyCards = [
  { href: "/admin/settings", label: "Settings", desc: "Thank-you emails & SMTP", icon: Settings },
  { href: "/admin/queries", label: "Queries", desc: "Contact form messages", icon: MessageSquare },
  { href: "/admin/clients", label: "Our Clients", desc: "Logos & client names", icon: Building2 },
  { href: "/admin/achievements", label: "Achievements", desc: "Photos & captions", icon: Award },
];

const cards = [
  { href: "/admin/menu", label: "Menu", desc: "Add and edit dishes", icon: UtensilsCrossed, permission: Permission.MENU },
  { href: "/admin/offers", label: "Offers", desc: "Run promotions", icon: Tag, permission: Permission.OFFERS },
  { href: "/admin/gallery", label: "Gallery", desc: "Photos & videos", icon: Images, permission: Permission.GALLERY },
  { href: "/admin/cms", label: "Website Content", desc: "Edit page text", icon: FileText, permission: Permission.CMS },
  { href: "/admin/outlets", label: "Outlets", desc: "Manage locations", icon: Store, permission: Permission.OUTLETS },
  { href: "/admin/tables", label: "Tables & QR", desc: "Generate QR codes", icon: QrCode, permission: Permission.TABLES },
  { href: "/admin/users", label: "Users", desc: "Staff accounts", icon: Users, permission: Permission.USERS },
  { href: "/admin/audit", label: "Audit Logs", desc: "Activity history", icon: ScrollText, permission: Permission.AUDIT },
  { href: "/admin/manager", label: "Manager View", desc: "Orders & billing", icon: ClipboardList, permission: Permission.MANAGER },
  { href: "/admin/kitchen", label: "Kitchen View", desc: "Prepare orders", icon: ChefHat, permission: Permission.KITCHEN },
];

export default function AdminPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    apiAuth<AuthUser>("/auth/me").then((res) => {
      if (res.success && res.data) setUser(res.data);
    });
  }, []);

  const { data: orders } = useQuery({
    queryKey: ["admin-order-count"],
    queryFn: async () => {
      const res = await apiAuth<{ status: string }[]>("/orders");
      return res.data ?? [];
    },
    enabled: userHasPermission(user, Permission.MANAGER) || userHasPermission(user, Permission.KITCHEN),
  });

  const visibleAdminCards = user?.role === Role.ADMIN ? adminOnlyCards : [];
  const visibleCards = cards.filter((c) => userHasPermission(user, c.permission));
  const todayActive = orders?.filter((o) => o.status !== "COMPLETED").length ?? 0;

  return (
    <AdminShell title="Dashboard">
      {(userHasPermission(user, Permission.MANAGER) || userHasPermission(user, Permission.KITCHEN)) && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Active Orders" value={todayActive} />
          <Stat label="Total Orders" value={orders?.length ?? 0} />
          <Stat label="Welcome" value={user?.username ?? "—"} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleAdminCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-[#8b1a1a]/30 bg-[#fff8f0] p-5 transition-all hover:-translate-y-0.5 hover:border-[#8b1a1a] hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8b1a1a]/10 text-[#8b1a1a]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-[#3d2914]">{c.label}</h3>
              <p className="text-xs text-[#9a8b7a]">{c.desc}</p>
            </Link>
          );
        })}
        {visibleCards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group rounded-2xl border border-[#e8dcc8] bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-[#8b1a1a] hover:shadow-md"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fbf3e8] text-[#8b1a1a]">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-[#3d2914]">{c.label}</h3>
              <p className="text-xs text-[#9a8b7a]">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[#e8dcc8] bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9a8b7a]">{label}</p>
      <p className="mt-1 font-brand text-2xl font-extrabold text-[#8b1a1a]">{value}</p>
    </div>
  );
}
