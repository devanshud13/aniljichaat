import type { Request, Response, NextFunction } from "express";
import { Role, type Permission } from "@anilji/shared";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }
    const userPerms = req.user.permissions ?? [];
    const allowed = permissions.every((p) => userPerms.includes(p));
    if (!allowed) {
      next(new ForbiddenError("You do not have access to this resource"));
      return;
    }
    next();
  };
}

export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (req.user.role === Role.ADMIN) {
      next();
      return;
    }
    const userPerms = req.user.permissions ?? [];
    if (permissions.some((p) => userPerms.includes(p))) {
      next();
      return;
    }
    next(new ForbiddenError("You do not have access to this resource"));
  };
}

export function requireAdminRole(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  if (req.user.role !== Role.ADMIN) {
    next(new ForbiddenError("Admin access required"));
    return;
  }
  next();
}
