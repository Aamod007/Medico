import { Router } from "express";
import {
  getCategories,
  getBrands,
  getProducts,
  getProductBySlug,
  searchAutocomplete,
} from "./catalog.controller";
import { validateQuery } from "../../middlewares/validate";
import { productQuerySchema } from "@medico/shared";

const router = Router();

router.get("/categories", getCategories);
router.get("/brands", getBrands);
router.get("/products", validateQuery(productQuerySchema), getProducts);
router.get("/products/:slug", getProductBySlug);
router.get("/search/autocomplete", searchAutocomplete);

export default router;
