import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import cookieParser from "cookie-parser";
import type { Express } from "express";
import { corsOrigins, env } from "../config/env.js";

export function applySecurityMiddleware(app: Express) {
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(mongoSanitize());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === "production" ? 200 : 1000,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use(
    "/api/v1/auth/login",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 20,
      message: { success: false, message: "Too many login attempts" },
    })
  );
}
