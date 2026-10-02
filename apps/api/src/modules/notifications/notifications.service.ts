import prisma from "../../lib/prisma";
import nodemailer from "nodemailer";
import { BRAND_CONFIG } from "@medico/shared";

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
    type?: "ORDER" | "PAYMENT" | "PROMO" | "SYSTEM";
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
          from: process.env.SMTP_FROM || `"${BRAND_CONFIG.name} Healthcare" <${BRAND_CONFIG.supportEmail}>`,
          to: user.email,
          subject: title,
          html: `<div style="font-family: sans-serif; padding: 24px; color: #1F2937; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px;">
            <h2 style="color: #0B4A3A; margin-top: 0;">${title}</h2>
            <p>Dear ${user.name || "Customer"},</p>
            <p style="line-height: 1.6;">${message}</p>
            ${link ? `<p><a href="${process.env.FRONTEND_URL || "http://localhost:3000"}${link}" style="display:inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 9999px; font-weight: bold;">View Order</a></p>` : ""}
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
            <p style="font-size: 12px; color: #6B7280; line-height: 1.5; margin-bottom: 0;">
              <strong>${BRAND_CONFIG.legalName}</strong><br/>
              ${BRAND_CONFIG.address.line1}, ${BRAND_CONFIG.address.city}, ${BRAND_CONFIG.address.state} ${BRAND_CONFIG.address.pincode}<br/>
              Support: ${BRAND_CONFIG.supportEmail} | Helpline: ${BRAND_CONFIG.supportPhone}
            </p>
          </div>`,
        });
      } catch (err) {
        console.warn("Email sending failed (non-critical):", err);
      }
    }
  }
}
