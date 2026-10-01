import { Router } from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  initiateRefund,
} from "./payments.controller";
import { authenticate, optionalAuthenticate, requireRole } from "../../middlewares/auth";

const router = Router();

// Public webhook endpoint
router.post("/webhook", handleWebhook);

// Payment endpoints (authenticated or test/guest)
router.post("/create-order", optionalAuthenticate, createRazorpayOrder);
router.post("/verify", optionalAuthenticate, verifyPayment);
router.post("/verify-payment", optionalAuthenticate, verifyPayment);

// Admin-only refund endpoint
router.post("/refund", authenticate, requireRole("ADMIN"), initiateRefund);

export default router;
