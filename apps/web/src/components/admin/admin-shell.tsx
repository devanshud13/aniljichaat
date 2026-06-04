"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
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
  LogOut,
  Menu as MenuIcon,
  MessageSquare,
  Building2,
  Award,
  Settings,
} from "lucide-react";
import { Permission, Role } from "@anilji/shared";
import { BrandLogo } from "@/components/layout/brand-logo";
import { apiAuth } from "@/lib/api";
import { canAccessAdminPath, userHasPermission, type AuthUser } from "@/lib/permissions";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin/queries", label: "Queries", icon: MessageSquare, permission: null as string | null, adminOnly: true },
  { href: "/admin/settings", label: "Settings", icon: Settings, permission: null as string | null, adminOnly: true },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: null as string | null },
  { href: "/admin/clients", label: "Clients", icon: Building2, permission: null as string | null, adminOnly: true },
  { href: "/admin/achievements", label: "Achievements", icon: Award, permission: null as string | null, adminOnly: true },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed, permission: Permission.MENU },
  { href: "/admin/offers", label: "Offers", icon: Tag, permission: Permission.OFFERS },
  { href: "/admin/gallery", label: "Gallery", icon: Images, permission: Permission.GALLERY },
  { href: "/admin/cms", label: "Website Content", icon: FileText, permission: Permission.CMS },
  { href: "/admin/outlets", label: "Outlets", icon: Store, permission: Permission.OUTLETS },
  { href: "/admin/tables", label: "Tables & QR", icon: QrCode, permission: Permission.TABLES },
  { href: "/admin/users", label: "Users", icon: Users, permission: Permission.USERS },
  { href: "/admin/audit", label: "Audit Logs", icon: ScrollText, permission: Permission.AUDIT },
  { href: "/admin/manager", label: "Manager View", icon: ClipboardList, permission: Permission.MANAGER },
  { href: "/admin/kitchen", label: "Kitchen View", icon: ChefHat, permission: Permission.KITCHEN },
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    apiAuth<AuthUser>("/auth/me").then((res) => {
      if (!res.success || !res.data) {
        router.push("/login");
        return;
      }
      setUser(res.data);
      if (!canAccessAdminPath(res.data, pathname)) {
        const fallback =
          res.data.role === Role.KITCHEN
            ? "/admin/kitchen"
            : res.data.role === Role.MANAGER
              ? "/admin/manager"
              : "/admin";
        router.replace(fallback);
      }
    });
  }, [pathname, router]);

  async function logout() {
    await apiAuth("/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const visibleNav = navItems.filter((item) => {
    if ("adminOnly" in item && item.adminOnly && user?.role !== Role.ADMIN) return false;
    if (!item.permission) return true;
    return userHasPermission(user, item.permission as typeof Permission.MENU);
  });

  return (
    <div className="flex min-h-screen bg-[#f7f1e8]">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-60 transform bg-[#3d2914] p-4 text-[#f5e6d3] transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Link href="/admin" className="flex flex-col gap-3">
          <BrandLogo className="h-11 w-auto max-w-[180px]" />
          <div className="flex flex-col gap-1">
            <span className="font-brand text-lg font-extrabold leading-none text-[#ffce6b]">
              Staff Panel
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#f5e6d3]/55">
              Anil Ji Chaat
            </span>
          </div>
        </Link>
        {user && (
          <p className="mt-3 text-xs opacity-70">
            {user.username} · {user.role}
          </p>
        )}

        <nav className="mt-6 space-y-1">
          {visibleNav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-[#8b1a1a] text-white" : "text-[#f5e6d3]/80 hover:bg-white/10"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-4">
          <button
            onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-[#f5e6d3]/80 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex flex-1 flex-col md:ml-0">
        <header className="flex items-center gap-3 border-b border-[#e8dcc8] bg-white px-4 py-3 md:px-8">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <MenuIcon className="h-5 w-5 text-[#8b1a1a]" />
          </button>
          <h1 className="font-brand text-xl font-extrabold text-[#8b1a1a]">{title}</h1>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
