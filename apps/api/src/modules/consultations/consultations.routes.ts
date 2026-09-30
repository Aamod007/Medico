import { Router } from "express";
import {
  getDoctors,
  getDoctorBySlug,
  bookAppointment,
  getUserAppointments,
} from "./consultations.controller";
import { authenticate } from "../../middlewares/auth";

const router = Router();

// Public routes
router.get("/doctors", getDoctors);
router.get("/doctors/:slug", getDoctorBySlug);

// User booking routes
router.post("/book", authenticate, bookAppointment);
router.get("/my-appointments/list", authenticate, getUserAppointments);

export default router;
