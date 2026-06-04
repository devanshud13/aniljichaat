import type { Server as HttpServer } from "http";
import { Server } from "socket.io";
import { parse as parseCookie } from "cookie";
import { verifyAccessToken } from "../services/jwt.service.js";
import { corsOrigins } from "../config/env.js";
import { logger } from "../utils/logger.js";

let io: Server | null = null;

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: corsOrigins, credentials: true },
  });

  io.use((socket, next) => {
    let token: string | undefined;
    const authToken = socket.handshake.auth?.token as string | undefined;
    if (authToken) {
      token = authToken;
    } else {
      const raw = socket.handshake.headers.cookie;
      if (raw) {
        const parsed = parseCookie(raw);
        token = parsed.accessToken;
      }
    }
    if (!token) {
      next();
      return;
    }
    try {
      const user = verifyAccessToken(token);
      socket.data.user = user;
      user.outletIds.forEach((id) => socket.join(`outlet:${id}`));
      if (user.role === "ADMIN") {
        socket.join("admin");
      }
    } catch {
      logger.debug("Socket auth failed");
    }
    next();
  });

  io.on("connection", (socket) => {
    socket.on("join:outlet", (outletId: string) => {
      socket.join(`outlet:${outletId}`);
    });
    socket.on("join:order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitToOutlet(outletId: string, event: string, data: unknown) {
  getIO().to(`outlet:${outletId}`).emit(event, data);
}

export function emitToOrder(orderId: string, event: string, data: unknown) {
  getIO().to(`order:${orderId}`).emit(event, data);
}

export const OrderEvents = {
  NEW: "order:new",
  PREPARING: "order:preparing",
  READY: "order:ready",
  DELIVERED: "order:delivered",
  COMPLETED: "order:completed",
  PAYMENT: "payment:completed",
} as const;
