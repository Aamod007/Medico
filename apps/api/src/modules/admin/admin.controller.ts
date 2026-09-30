import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export const getDashboardStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalOrders = await prisma.order.count();
    const totalCustomers = await prisma.user.count({ where: { role: "CUSTOMER" } });
    const totalProducts = await prisma.product.count({ where: { isActive: true } });

    // Revenue sum of non-cancelled orders
    const revenueAgg = await prisma.order.aggregate({
      where: {
        status: { notIn: ["CANCELLED", "RETURNED"] },
        paymentStatus: { in: ["PAID", "AUTHORIZED"] },
      },
      _sum: { totalAmount: true },
    });

    const totalRevenue = revenueAgg._sum.totalAmount || 0;

    // Prescriptions pending review
    const pendingPrescriptionsCount = await prisma.prescription.count({
      where: { status: "PENDING" },
    });

    // Recent 10 orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: true,
      },
    });

    // Low stock batches (quantity < 20)
    const lowStockBatches = await prisma.inventoryBatch.findMany({
      where: {
        isBlocked: false,
        quantity: { lte: 25 },
      },
      take: 8,
      include: {
        variant: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
          },
        },
      },
      orderBy: { quantity: "asc" },
    });

    // Orders by status count
    const statusCounts = await prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        pendingPrescriptionsCount,
        recentOrders,
        lowStockBatches,
        statusCounts: statusCounts.map((s) => ({ status: s.status, count: s._count.status })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, search, page = "1", limit = "20" } = req.query;
    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = String(status);
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: String(search), mode: "insensitive" } },
        { user: { name: { contains: String(search), mode: "insensitive" } } },
        { user: { email: { contains: String(search), mode: "insensitive" } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: true,
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courierPartner, note } = req.body;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (trackingNumber || courierPartner) {
      updateData.notes = `Tracking: ${trackingNumber || "N/A"} (${courierPartner || "Standard Delivery"})`;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const ord = await tx.order.update({
        where: { id },
        data: updateData,
      });

      // record status history
      if (status) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: id,
            status,
            note: note || `Order status updated to ${status} by administrator.`,
          },
        });
      }

      return ord;
    });

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPrescriptions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && status !== "ALL") {
      where.status = String(status);
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        order: { select: { id: true, orderNumber: true, totalAmount: true } },
      },
    });

    res.json({ success: true, data: prescriptions });
  } catch (error) {
    next(error);
  }
};

export const reviewPrescription = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, notes } = req.body;
    const reviewerId = req.user?.id;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED" });
    }

    const updated = await prisma.prescription.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        notes,
        verifiedAt: new Date(),
        verifiedBy: reviewerId,
      },
      include: { user: true },
    });

    res.json({
      success: true,
      message: `Prescription ${status.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryBatches = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, lowStockOnly } = req.query;

    const where: any = {};
    if (lowStockOnly === "true") {
      where.quantity = { lte: 30 };
    }
    if (search) {
      where.OR = [
        { batchNumber: { contains: String(search), mode: "insensitive" } },
        { variant: { product: { name: { contains: String(search), mode: "insensitive" } } } },
      ];
    }

    const batches = await prisma.inventoryBatch.findMany({
      where,
      orderBy: [{ expiryDate: "asc" }, { quantity: "asc" }],
      include: {
        variant: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                prescriptionRequired: true,
                brand: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    res.json({ success: true, data: batches });
  } catch (error) {
    next(error);
  }
};
