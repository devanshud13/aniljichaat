import type { Request, Response, NextFunction } from "express";
import { Role, resolvePermissions } from "@anilji/shared";
import { verifyAccessToken, type TokenPayload } from "../services/jwt.service.js";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.accessToken as string | undefined;
  if (!token) {
    next(new UnauthorizedError());
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = {
      ...payload,
      permissions: resolvePermissions(payload.role, payload.permissions),
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new UnauthorizedError());
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new ForbiddenError());
      return;
    }
    next();
  };
}

export function requireOutletAccess(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  if (req.user.role === Role.ADMIN) {
    next();
    return;
  }
  const outletId = (req.params.outletId ?? req.query.outletId ?? req.body?.outletId) as
    | string
    | undefined;
  if (!outletId) {
    next();
    return;
  }
  if (!req.user.outletIds.includes(outletId)) {
    next(new ForbiddenError("No access to this outlet"));
    return;
  }
  next();
}
