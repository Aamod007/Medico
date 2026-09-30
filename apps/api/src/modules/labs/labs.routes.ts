import { Router } from "express";
import { getLabTests, getLabTestBySlug, bookLabTest, getUserLabBookings } from "./labs.controller";
import { authenticate } from "../../middlewares/auth";

const router = Router();

// Public routes
router.get("/", getLabTests);
router.get("/:slug", getLabTestBySlug);

// User booking routes
router.post("/book", authenticate, bookLabTest);
router.get("/my-bookings/list", authenticate, getUserLabBookings);

export default router;
