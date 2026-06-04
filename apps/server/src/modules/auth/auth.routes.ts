import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { User } from "@anilji/database";
import { loginSchema, resolvePermissions } from "@anilji/shared";
import { validateBody } from "../../middleware/validate.js";
import { authenticate } from "../../middleware/auth.js";
import { sendSuccess, sendError } from "../../utils/response.js";
import { signAccessToken, signRefreshToken } from "../../services/jwt.service.js";
import { logAudit } from "../../services/audit.service.js";
import { UnauthorizedError } from "../../utils/errors.js";
import { env } from "../../config/env.js";

const router: IRouter = Router();

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? ("none" as const) : ("lax" as const),
  domain: env.COOKIE_DOMAIN || undefined,
  path: "/",
};

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase(), isActive: true });
    if (!user) throw new UnauthorizedError("Invalid credentials");
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedError("Invalid credentials");

    const permissions = resolvePermissions(user.role, user.permissions);
    const payload = {
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
      outletIds: user.outletIds.map((id) => id.toString()),
      permissions,
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logAudit(req, {
      userId: payload.userId,
      action: "LOGIN",
      entityType: "User",
      entityId: payload.userId,
    });

    sendSuccess(res, {
      user: {
        id: payload.userId,
        username: payload.username,
        role: payload.role,
        outletIds: payload.outletIds,
        permissions: payload.permissions,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post("/logout", authenticate, async (req, res, next) => {
  try {
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);
    if (req.user) {
      await logAudit(req, {
        userId: req.user.userId,
        action: "LOGOUT",
        entityType: "User",
        entityId: req.user.userId,
      });
    }
    sendSuccess(res, null, "Logged out");
  } catch (e) {
    next(e);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.userId).select("-passwordHash");
    if (!user) {
      sendError(res, 404, "NOT_FOUND", "User not found");
      return;
    }
    sendSuccess(res, {
      id: user._id,
      username: user.username,
      role: user.role,
      outletIds: user.outletIds,
      permissions: resolvePermissions(user.role, user.permissions),
      isActive: user.isActive,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
