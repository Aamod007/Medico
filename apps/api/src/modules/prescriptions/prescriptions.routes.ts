import { Router } from "express";
import {
  uploadPrescription,
  getUserPrescriptions,
  getPendingPrescriptions,
  reviewPrescription,
  rxUpload,
} from "./prescriptions.controller";
import { authenticate, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { reviewPrescriptionSchema } from "@medico/shared";

const router = Router();

router.use(authenticate);

// Customer endpoints
router.post("/upload", rxUpload.single("file"), uploadPrescription);
router.get("/my", getUserPrescriptions);

// Pharmacist & Admin review queue
router.get("/pending", requireRole("PHARMACIST", "ADMIN"), getPendingPrescriptions);
router.patch("/:id/review", requireRole("PHARMACIST", "ADMIN"), validate(reviewPrescriptionSchema), reviewPrescription);

export default router;
