import { AuditLog } from "@anilji/database";
import type { Request } from "express";

export async function logAudit(
  req: Request | null,
  params: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await AuditLog.create({
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
    ip: req?.ip,
    userAgent: req?.headers["user-agent"],
  });
}
