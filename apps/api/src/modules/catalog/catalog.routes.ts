import { Router } from "express";
import {
  getCategories,
  getBrands,
  getProducts,
  getProductBySlug,
  getProductSubstitutes,
  searchAutocomplete,
} from "./catalog.controller";
import { validateQuery } from "../../middlewares/validate";
import { productQuerySchema } from "@medico/shared";

const router = Router();

router.get("/categories", getCategories);
router.get("/brands", getBrands);
router.get("/products", validateQuery(productQuerySchema), getProducts);
router.get("/products/:slug", getProductBySlug);
router.get("/products/:slug/substitutes", getProductSubstitutes);
router.get("/search/autocomplete", searchAutocomplete);

export default router;
