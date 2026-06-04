import { Router, type IRouter } from "express";
import authRoutes from "../modules/auth/auth.routes.js";
import publicRoutes from "../modules/public/public.routes.js";
import ordersRoutes from "../modules/orders/orders.routes.js";
import paymentsRoutes from "../modules/payments/payments.routes.js";
import adminRoutes from "../modules/admin/admin.routes.js";

const router: IRouter = Router();

router.use("/auth", authRoutes);
router.use("/public", publicRoutes);
router.use("/public/payments", paymentsRoutes);
router.use("/orders", ordersRoutes);
router.use("/admin", adminRoutes);

export default router;
