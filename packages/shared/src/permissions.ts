import { Role } from "./enums.js";

export const Permission = {
  MENU: "menu",
  OFFERS: "offers",
  GALLERY: "gallery",
  CMS: "cms",
  OUTLETS: "outlets",
  TABLES: "tables",
  USERS: "users",
  AUDIT: "audit",
  MANAGER: "manager",
  KITCHEN: "kitchen",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS = Object.values(Permission);

/** Permissions only assignable to managers (admin UI checkboxes). */
export const MANAGER_ASSIGNABLE_PERMISSIONS: Permission[] = [
  Permission.MENU,
  Permission.OFFERS,
  Permission.GALLERY,
  Permission.CMS,
  Permission.OUTLETS,
  Permission.TABLES,
  Permission.MANAGER,
  Permission.KITCHEN,
];

export function defaultPermissionsForRole(role: Role): Permission[] {
  switch (role) {
    case Role.ADMIN:
      return [...ALL_PERMISSIONS];
    case Role.MANAGER:
      return [Permission.MANAGER];
    case Role.KITCHEN:
      return [Permission.KITCHEN];
    default:
      return [];
  }
}

export function resolvePermissions(role: Role, stored?: string[] | null): Permission[] {
  if (role === Role.ADMIN) return [...ALL_PERMISSIONS];
  if (stored && stored.length > 0) return stored.filter((p): p is Permission => ALL_PERMISSIONS.includes(p as Permission));
  return defaultPermissionsForRole(role);
}
