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
import { Role } from "@prisma/client";

const router = Router();

// Secure all admin and pharmacy operations
router.use(authenticate);
router.use(requireRole(Role.ADMIN, Role.PHARMACIST));

router.get("/stats", getDashboardStats);
router.get("/orders", getAllOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.get("/prescriptions", getAllPrescriptions);
router.patch("/prescriptions/:id/review", reviewPrescription);
router.get("/inventory", getInventoryBatches);

export default router;
