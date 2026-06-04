import type { Response } from "express";
import { errorResponse, successResponse, type ApiResponse } from "@anilji/shared";

export function sendSuccess<T>(res: Response, data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = successResponse(data, message);
  res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  const body = errorResponse(code, message, details);
  res.status(status).json(body);
}
