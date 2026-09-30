import { Request, Response, NextFunction } from "express";
import { prisma } from "../../lib/prisma";

export const getDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialization, search } = req.query;

    const where: any = { isAvailable: true };
    if (specialization) {
      where.specialization = String(specialization);
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search), mode: "insensitive" } },
        { specialization: { contains: String(search), mode: "insensitive" } },
        { qualification: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { rating: "desc" },
    });

    const specializations = await prisma.doctor.groupBy({
      by: ["specialization"],
      _count: { specialization: true },
    });

    res.json({
      success: true,
      data: {
        doctors,
        specializations: specializations.map((s) => ({
          name: s.specialization,
          count: s._count.specialization,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorBySlug = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const doctor = await prisma.doctor.findUnique({
      where: { slug },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor profile not found" });
    }

    res.json({ success: true, data: doctor });
  } catch (error) {
    next(error);
  }
};

export const bookAppointment = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || (await prisma.user.findFirst({ where: { role: "CUSTOMER" } }))?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const {
      doctorId,
      patientName,
      patientAge,
      patientGender,
      appointmentDate,
      timeSlot,
      consultationType,
      notes,
    } = req.body;

    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId },
    });

    if (!doctor) {
      return res.status(404).json({ success: false, message: "Doctor not found" });
    }

    const aptCount = await prisma.appointment.count();
    const appointmentNumber = `APT-${new Date().getFullYear()}-${String(aptCount + 2001).padStart(5, "0")}`;

    // Unique room URL for telehealth consultation
    const videoRoomUrl = `https://telehealth.pharmico.com/room/${appointmentNumber.toLowerCase()}`;

    const appointment = await prisma.appointment.create({
      data: {
        appointmentNumber,
        userId,
        doctorId,
        patientName: patientName || "Patient",
        patientAge: Number(patientAge) || 28,
        patientGender: patientGender || "MALE",
        appointmentDate: new Date(appointmentDate || Date.now() + 86400000),
        timeSlot: timeSlot || "10:00 AM - 10:30 AM",
        consultationType: consultationType || "VIDEO",
        videoRoomUrl,
        fee: doctor.consultationFee,
        notes: notes || "General health consultation",
        status: "SCHEDULED",
        paymentStatus: "PENDING",
      },
      include: {
        doctor: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "Consultation appointment scheduled successfully",
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserAppointments = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || (await prisma.user.findFirst({ where: { role: "CUSTOMER" } }))?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId },
      include: {
        doctor: true,
      },
      orderBy: { appointmentDate: "desc" },
    });

    res.json({ success: true, data: appointments });
  } catch (error) {
    next(error);
  }
};
