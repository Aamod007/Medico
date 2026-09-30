import { Request, Response } from "express";
import prisma from "../../lib/prisma";
import { ApplyCouponInput } from "@medico/shared";

export async function getActiveCoupons(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const coupons = await prisma.coupon.findMany({
    where: {
      isActive: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
    select: {
      id: true,
      code: true,
      description: true,
      discountType: true,
      discountValue: true,
      minOrderValue: true,
      maxDiscount: true,
    },
    orderBy: { discountValue: "desc" },
  });

  res.json({ success: true, data: coupons });
}

export async function applyCoupon(
  req: Request<{}, {}, ApplyCouponInput>,
  res: Response
): Promise<void> {
  const { code, cartSubtotal } = req.body;
  const now = new Date();

  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon || !coupon.isActive) {
    res.status(404).json({ success: false, message: "Invalid coupon code" });
    return;
  }

  if (now < coupon.startDate || now > coupon.endDate) {
    res.status(400).json({ success: false, message: "This coupon has expired" });
    return;
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    res.status(400).json({ success: false, message: "Coupon usage limit reached" });
    return;
  }

  const minOrderValue = Number(coupon.minOrderValue);
  if (cartSubtotal < minOrderValue) {
    res.status(400).json({
      success: false,
      message: `Minimum order value of ₹${minOrderValue} required for this coupon`,
    });
    return;
  }

  let calculatedDiscount = 0;
  const discountVal = Number(coupon.discountValue);

  if (coupon.discountType === "PERCENTAGE") {
    calculatedDiscount = (cartSubtotal * discountVal) / 100;
    if (coupon.maxDiscount) {
      calculatedDiscount = Math.min(calculatedDiscount, Number(coupon.maxDiscount));
    }
  } else {
    calculatedDiscount = discountVal;
  }

  calculatedDiscount = Math.min(calculatedDiscount, cartSubtotal);

  res.json({
    success: true,
    message: `Coupon '${coupon.code}' applied successfully`,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: discountVal,
      discountAmount: Math.round(calculatedDiscount * 100) / 100,
      newSubtotal: Math.round((cartSubtotal - calculatedDiscount) * 100) / 100,
    },
  });
}
