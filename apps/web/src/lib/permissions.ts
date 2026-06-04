import { Permission, Role, type Permission as PermissionType } from "@anilji/shared";

export interface AuthUser {
  id?: string;
  username: string;
  role: string;
  permissions?: string[];
}

export function userHasPermission(user: AuthUser | null, permission: PermissionType): boolean {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;
  return (user.permissions ?? []).includes(permission);
}

export function canAccessAdminPath(user: AuthUser | null, path: string): boolean {
  if (!user) return false;
  if (user.role === Role.ADMIN) return true;

  const adminOnlyPrefixes = [
    "/admin/queries",
    "/admin/settings",
    "/admin/clients",
    "/admin/achievements",
  ];
  if (adminOnlyPrefixes.some((p) => path.startsWith(p))) return false;

  const rules: { prefix: string; permission: PermissionType }[] = [
    { prefix: "/admin/menu", permission: Permission.MENU },
    { prefix: "/admin/offers", permission: Permission.OFFERS },
    { prefix: "/admin/gallery", permission: Permission.GALLERY },
    { prefix: "/admin/cms", permission: Permission.CMS },
    { prefix: "/admin/outlets", permission: Permission.OUTLETS },
    { prefix: "/admin/tables", permission: Permission.TABLES },
    { prefix: "/admin/users", permission: Permission.USERS },
    { prefix: "/admin/audit", permission: Permission.AUDIT },
    { prefix: "/admin/manager", permission: Permission.MANAGER },
    { prefix: "/admin/kitchen", permission: Permission.KITCHEN },
  ];

  if (path === "/admin" || path === "/admin/") return true;

  for (const rule of rules) {
    if (path.startsWith(rule.prefix)) {
      return userHasPermission(user, rule.permission);
    }
  }

  return path === "/admin";
}
