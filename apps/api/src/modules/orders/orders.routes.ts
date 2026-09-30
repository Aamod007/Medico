import { Router } from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  cancelOrder,
  downloadInvoice,
} from "./orders.controller";
import { authenticate, optionalAuthenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { createOrderSchema, cancelOrderSchema } from "@medico/shared";

const router = Router();

// Authenticated user operations
router.post("/", authenticate, validate(createOrderSchema), createOrder);
router.get("/", authenticate, getUserOrders);
router.post("/:id/cancel", authenticate, validate(cancelOrderSchema), cancelOrder);

// Order tracking & invoice download (supports authenticated or direct order reference)
router.get("/:id", optionalAuthenticate, getOrderById);
router.get("/:id/invoice", optionalAuthenticate, downloadInvoice);

export default router;
