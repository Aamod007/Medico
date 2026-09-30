import { Router } from "express";
import {
  getDashboardStats,
  getAllOrders,
  updateOrderStatus,
  getAllPrescriptions,
  reviewPrescription,
  getInventoryBatches,
} from "./admin.controller";
import { authenticate, requireRole } from "../../middlewares/auth";

const router = Router();

// In development or demo mode, allow public preview with option for strict auth
router.get("/stats", getDashboardStats);
router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/prescriptions", getAllPrescriptions);
router.patch("/prescriptions/:id/review", reviewPrescription);
router.get("/inventory", getInventoryBatches);

export default router;
