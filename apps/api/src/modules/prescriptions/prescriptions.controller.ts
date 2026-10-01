import { Request, Response } from "express";
import multer from "multer";
import prisma from "../../lib/prisma";
import { ReviewPrescriptionInput } from "@medico/shared";

// Use memory storage — works on Vercel serverless (no persistent disk)
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed"));
  }
};

export const rxUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});

export async function uploadPrescription(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const file = req.file;

  if (!file) {
    res.status(400).json({ success: false, message: "Please provide a prescription file" });
    return;
  }

  // Store as base64 data URI (works without persistent filesystem)
  const fileUrl = `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;

  const prescription = await prisma.prescription.create({
    data: {
      userId,
      fileUrl,
      fileType: file.mimetype,
      originalName: file.originalname,
      fileSize: file.size,
      status: "PENDING",
      notes: req.body.notes || null,
    },
  });

  res.status(201).json({
    success: true,
    message: "Prescription uploaded successfully. A licensed pharmacist will review it shortly.",
    data: prescription,
  });
}

export async function getUserPrescriptions(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const prescriptions = await prisma.prescription.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  res.json({ success: true, data: prescriptions });
}

export async function getPendingPrescriptions(req: Request, res: Response): Promise<void> {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [total, prescriptions] = await Promise.all([
    prisma.prescription.count({ where: { status: "PENDING" } }),
    prisma.prescription.findMany({
      where: { status: "PENDING" },
      skip,
      take: limit,
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true } },
        orders: {
          select: { id: true, orderNumber: true, totalAmount: true, status: true },
        },
      },
    }),
  ]);

  res.json({
    success: true,
    data: prescriptions,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function reviewPrescription(
  req: Request<{ id: string }, {}, ReviewPrescriptionInput>,
  res: Response
): Promise<void> {
  const pharmacistId = req.user!.userId;
  const { id } = req.params;
  const { status, rejectionReason, pharmacistNotes } = req.body;

  const prescription = await prisma.prescription.findUnique({
    where: { id },
    include: { orders: true },
  });

  if (!prescription) {
    res.status(404).json({ success: false, message: "Prescription not found" });
    return;
  }

  const updated = await prisma.$transaction(async (tx) => {
    const rx = await tx.prescription.update({
      where: { id },
      data: {
        status,
        rejectionReason: status === "REJECTED" ? rejectionReason : null,
        reviewedByPharmacistId: pharmacistId,
        reviewedAt: new Date(),
        notes: pharmacistNotes || undefined,
      },
    });

    // If approved and order was waiting, update order status history
    if (status === "APPROVED" && prescription.orders.length > 0) {
      for (const order of prescription.orders) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: order.id,
            status: order.status,
            note: "Prescription verified & approved by licensed pharmacist.",
            changedByUserId: pharmacistId,
          },
        });
      }
    }

    return rx;
  });

  res.json({
    success: true,
    message: `Prescription marked as ${status}`,
    data: updated,
  });
}
