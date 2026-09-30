import prisma from "../../lib/prisma";
import nodemailer from "nodemailer";

export class NotificationService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.mailtrap.io",
    port: Number(process.env.SMTP_PORT) || 2525,
    auth: {
      user: process.env.SMTP_USER || "smtp_user",
      pass: process.env.SMTP_PASS || "smtp_pass",
    },
  });

  static async sendNotification(params: {
    userId: string;
    title: string;
    message: string;
    type?: "ORDER" | "PRESCRIPTION" | "PAYMENT" | "PROMO" | "SYSTEM";
    link?: string;
  }): Promise<void> {
    const { userId, title, message, type = "ORDER", link } = params;

    // 1. Create in-app notification
    await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        link,
      },
    });

    // 2. Fetch user to send Email/SMS notification
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true },
    });

    if (user?.email && process.env.SMTP_USER && process.env.SMTP_USER !== "smtp_user") {
      try {
        await this.transporter.sendMail({
          from: process.env.SMTP_FROM || "orders@pharmico.health",
          to: user.email,
          subject: title,
          html: `<div style="font-family: sans-serif; padding: 20px;">
            <h2 style="color: #0B4A3A;">${title}</h2>
            <p>Dear ${user.name},</p>
            <p>${message}</p>
            ${link ? `<a href="${process.env.FRONTEND_URL || "http://localhost:3000"}${link}" style="display:inline-block; padding: 10px 20px; background-color: #10B981; color: white; text-decoration: none; border-radius: 9999px;">View Order</a>` : ""}
          </div>`,
        });
      } catch (err) {
        console.warn("Email sending failed (non-critical):", err);
      }
    }
  }
}
