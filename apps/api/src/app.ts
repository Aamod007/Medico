import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";

// Routes
import authRoutes from "./modules/auth/auth.routes";
import usersRoutes from "./modules/users/users.routes";
import catalogRoutes from "./modules/catalog/catalog.routes";
import cartRoutes from "./modules/cart/cart.routes";
import couponsRoutes from "./modules/coupons/coupons.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import ordersRoutes from "./modules/orders/orders.routes";
import paymentsRoutes from "./modules/payments/payments.routes";
import prescriptionsRoutes from "./modules/prescriptions/prescriptions.routes";
import notificationsRoutes from "./modules/notifications/notifications.routes";
import labsRoutes from "./modules/labs/labs.routes";
import consultationsRoutes from "./modules/consultations/consultations.routes";
import adminRoutes from "./modules/admin/admin.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// Security & Parsing Middlewares
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// General API rate limiting (300 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" },
});
app.use("/api", limiter);

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "medico-api",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "medico-api",
    timestamp: new Date().toISOString(),
  });
});

// Register Domain Modules
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/prescriptions", prescriptionsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/labs", labsRoutes);
app.use("/api/consultations", consultationsRoutes);
app.use("/api/admin", adminRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "API endpoint not found" });
});

// Centralized error handler
app.use(errorHandler);

export default app;
