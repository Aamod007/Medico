import { Router } from "express";
import { getActiveCoupons, applyCoupon } from "./coupons.controller";
import { validate } from "../../middlewares/validate";
import { applyCouponSchema } from "@medico/shared";

const router = Router();

router.get("/active", getActiveCoupons);
router.post("/apply", validate(applyCouponSchema), applyCoupon);

export default router;
