import { Router } from "express";
import {
  updateProfile,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from "./users.controller";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { addressSchema } from "@medico/shared";

const router = Router();

router.use(authenticate);

router.patch("/profile", updateProfile);
router.get("/addresses", getAddresses);
router.post("/addresses", validate(addressSchema), createAddress);
router.put("/addresses/:id", updateAddress);
router.delete("/addresses/:id", deleteAddress);

export default router;
