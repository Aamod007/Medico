import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./cart.controller";
import { optionalAuthenticate } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { addToCartSchema, updateCartItemSchema } from "@medico/shared";

const router = Router();

router.use(optionalAuthenticate);

router.get("/", getCart);
router.post("/items", validate(addToCartSchema), addToCart);
router.patch("/items/:itemId", validate(updateCartItemSchema), updateCartItem);
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);

export default router;
