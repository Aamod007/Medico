import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma";
import cache from "../../lib/redis";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { RegisterInput, LoginWithPasswordInput, RequestOtpInput, VerifyOtpInput } from "@medico/shared";

export async function register(req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> {
  const { name, email, phone, password } = req.body;

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { phone }],
    },
  });

  if (existing) {
    res.status(409).json({
      success: false,
      message: existing.email === email ? "Email already registered" : "Phone number already registered",
    });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash,
      role: "CUSTOMER",
    },
  });

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    message: "Registration successful",
    data: {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    },
  });
}

export async function login(req: Request<{}, {}, LoginWithPasswordInput>, res: Response): Promise<void> {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { phone: identifier }],
      isActive: true,
      deletedAt: null,
    },
  });

  if (!user || !user.passwordHash) {
    res.status(401).json({ success: false, message: "Invalid email/phone or password" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401).json({ success: false, message: "Invalid email/phone or password" });
    return;
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Login successful",
    data: {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
}

export async function requestOtp(req: Request<{}, {}, RequestOtpInput>, res: Response): Promise<void> {
  const { phone } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Store in cache for 5 minutes (300 seconds)
  await cache.set(`otp:${phone}`, otp, "EX", 300);

  // In production, invoke MSG91/Twilio adapter. In dev/testing, log to console
  console.log(`[SMS OTP] Verification code for ${phone}: ${otp}`);

  res.json({
    success: true,
    message: "OTP sent successfully to your mobile number",
    data: process.env.NODE_ENV !== "production" ? { demoOtp: otp } : undefined,
  });
}

export async function verifyOtp(req: Request<{}, {}, VerifyOtpInput>, res: Response): Promise<void> {
  const { phone, otp, name } = req.body;

  const storedOtp = await cache.get(`otp:${phone}`);
  if (!storedOtp || storedOtp !== otp) {
    res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    return;
  }

  // Delete used OTP
  await cache.del(`otp:${phone}`);

  let user = await prisma.user.findUnique({
    where: { phone },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: name || `User ${phone.slice(-4)}`,
        phone,
        email: `${phone}@medico.guest`,
        isPhoneVerified: true,
        role: "CUSTOMER",
      },
    });
  } else if (!user.isPhoneVerified) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { isPhoneVerified: true },
    });
  }

  const accessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id, email: user.email, role: user.role });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    message: "Authentication successful",
    data: {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    res.status(401).json({ success: false, message: "Refresh token missing" });
    return;
  }

  try {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: "User no longer active" });
      return;
    }

    const newAccessToken = generateAccessToken({ userId: user.id, email: user.email, role: user.role });
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60 * 1000,
    });
    res.json({
      success: true,
      data: { accessToken: newAccessToken },
    });
  } catch {
    res.status(401).json({ success: false, message: "Invalid refresh token" });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ success: true, message: "Logged out successfully" });
}

export async function getMe(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
      addresses: true,
    },
  });

  if (!user) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }

  res.json({ success: true, data: user });
}
