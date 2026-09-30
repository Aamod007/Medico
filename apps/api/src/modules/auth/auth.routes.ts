import { Router } from "express";
import { register, login, requestOtp, verifyOtp, refresh, logout, getMe } from "./auth.controller";
import { authenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import {
  registerSchema,
  loginWithPasswordSchema,
  requestOtpSchema,
  verifyOtpSchema,
} from "@medico/shared";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginWithPasswordSchema), login);
router.post("/otp/request", validate(requestOtpSchema), requestOtp);
router.post("/otp/verify", validate(verifyOtpSchema), verifyOtp);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
