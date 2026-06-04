import express from "express";
import { createServer } from "http";
import { connectDatabase, createAllIndexes } from "@anilji/database";
import { env } from "./config/env.js";
import { applySecurityMiddleware } from "./middleware/security.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { errorHandler } from "./middleware/error-handler.js";
import { logger } from "./utils/logger.js";
import apiRoutes from "./routes/index.js";
import webhookRoutes from "./modules/payments/webhook.routes.js";
import { initSocket } from "./socket/index.js";

const app = express();
const httpServer = createServer(app);

app.use("/webhooks", webhookRoutes);
app.use(express.json({ limit: "1mb" }));
app.use(requestIdMiddleware);
applySecurityMiddleware(app);

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "OK" });
});

app.use("/api/v1", apiRoutes);
app.use(errorHandler);

async function bootstrap() {
  await connectDatabase(env.MONGODB_URI);
  await createAllIndexes();
  initSocket(httpServer);

  httpServer.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });
}

bootstrap().catch((err) => {
  logger.error("Failed to start server", { error: err });
  process.exit(1);
});
