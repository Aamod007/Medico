import { Router } from "express";
import {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  initiateRefund,
} from "./payments.controller";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { verifyPaymentSchema } from "@medico/shared";

const router = Router();

// Public webhook endpoint
router.post("/webhook", handleWebhook);

// Authenticated user endpoints
router.post("/create-order", authenticate, createRazorpayOrder);
router.post("/verify", authenticate, validate(verifyPaymentSchema), verifyPayment);

// Admin-only refund endpoint
router.post("/refund", authenticate, requireRole("ADMIN"), initiateRefund);

export default router;
