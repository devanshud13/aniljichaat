import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }
  if (err instanceof ZodError) {
    sendError(res, 400, "VALIDATION_ERROR", "Validation failed", err.flatten());
    return;
  }
  logger.error("Unhandled error", {
    requestId: req.requestId,
    error: err instanceof Error ? err.message : err,
    stack: err instanceof Error ? err.stack : undefined,
  });
  sendError(res, 500, "INTERNAL_ERROR", "Something went wrong");
}
