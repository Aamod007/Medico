import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
} from "./wishlist.controller";
import { optionalAuthenticate } from "../../middlewares/auth";

const router = Router();

router.use(optionalAuthenticate);

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.post("/toggle", toggleWishlist);
router.delete("/:productId", removeFromWishlist);

export default router;
