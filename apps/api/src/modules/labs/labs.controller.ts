import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export const getLabTests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;

    const where: any = { isActive: true };
    if (category) {
      where.category = String(category);
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const labTests = await prisma.labTest.findMany({
      where,
      orderBy: { price: "asc" },
    });

    const categories = await prisma.labTest.groupBy({
      by: ["category"],
      _count: { category: true },
    });

    res.json({
      success: true,
      data: {
        tests: labTests,
        categories: categories.map((c) => ({ name: c.category, count: c._count.category })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getLabTestBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const test = await prisma.labTest.findUnique({
      where: { slug },
    });

    if (!test) {
      return res.status(404).json({ success: false, message: "Lab test package not found" });
    }

    res.json({ success: true, data: test });
  } catch (error) {
    next(error);
  }
};

export const bookLabTest = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || (await prisma.user.findFirst({ where: { role: "CUSTOMER" } }))?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const {
      labTestId,
      patientName,
      patientAge,
      patientGender,
      sampleCollectionDate,
      timeSlot,
      addressId,
    } = req.body;

    const labTest = await prisma.labTest.findUnique({
      where: { id: labTestId },
    });

    if (!labTest) {
      return res.status(404).json({ success: false, message: "Lab test not found" });
    }

    // Fallback or create address if addressId not passed
    let finalAddressId = addressId;
    if (!finalAddressId) {
      const existingAddr = await prisma.address.findFirst({ where: { userId } });
      if (existingAddr) {
        finalAddressId = existingAddr.id;
      } else {
        const newAddr = await prisma.address.create({
          data: {
            userId,
            fullName: patientName || "Patient",
            phone: "9876543210",
            street: "123 Health Ave, Diagnostic Wing",
            city: "Mumbai",
            state: "Maharashtra",
            pincode: "400001",
            isDefault: true,
          },
        });
        finalAddressId = newAddr.id;
      }
    }

    const bookingCount = await prisma.labBooking.count();
    const bookingNumber = `LAB-${new Date().getFullYear()}-${String(bookingCount + 1001).padStart(5, "0")}`;

    const booking = await prisma.labBooking.create({
      data: {
        bookingNumber,
        userId,
        labTestId,
        patientName: patientName || "Self",
        patientAge: Number(patientAge) || 30,
        patientGender: patientGender || "MALE",
        sampleCollectionDate: new Date(sampleCollectionDate || Date.now() + 86400000),
        timeSlot: timeSlot || "08:00 AM - 09:00 AM",
        addressId: finalAddressId,
        totalAmount: labTest.price,
        status: "SCHEDULED",
        paymentStatus: "PENDING",
      },
      include: {
        labTest: true,
        address: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Diagnostic sample collection scheduled successfully",
      data: booking,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserLabBookings = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || (await prisma.user.findFirst({ where: { role: "CUSTOMER" } }))?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const bookings = await prisma.labBooking.findMany({
      where: { userId },
      include: {
        labTest: true,
        address: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};
