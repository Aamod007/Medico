import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";
import { BRAND_CONFIG } from "@medico/shared";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const { url: SUPABASE_URL } = getSupabaseConfig();

function currency(amount: number): string {
  const formatted = Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
}

const C = {
  black: "#0A0A0A",
  dark: "#171717",
  body: "#404040",
  muted: "#737373",
  light: "#A3A3A3",
  border: "#E5E5E5",
  bgLight: "#FAFAFA",
  white: "#FFFFFF",
  green: "#10B981",
  greenDark: "#0B4A3A",
};

function generateInvoicePdfBuffer(order: any, disposition: "inline" | "attachment" = "inline"): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        info: {
          Title: `Invoice ${order.orderNumber || order.id}`,
          Author: BRAND_CONFIG.name || "Pharmico Online Pharmacy",
          Subject: "Tax Invoice",
        },
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: Error) => reject(err));

      const pageWidth = doc.page.width;
      const marginLeft = 50;
      const marginRight = 50;
      const contentWidth = pageWidth - marginLeft - marginRight;

      let y = 50;

      // =====================================================
      // HEADER: "Invoice" title + Invoice Number
      // =====================================================
      doc
        .font("Helvetica-Bold")
        .fontSize(28)
        .fillColor(C.black)
        .text("Invoice", marginLeft, y);

      y += 36;

      const orderNumber = order.orderNumber?.startsWith("#")
        ? order.orderNumber
        : `#${order.orderNumber || order.id.slice(0, 8).toUpperCase()}`;

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(C.light)
        .text("Invoice Number  ", marginLeft, y, { continued: true })
        .font("Helvetica-Bold")
        .fillColor(C.dark)
        .text(orderNumber);

      y += 40;

      // =====================================================
      // THIN SEPARATOR
      // =====================================================
      doc
        .moveTo(marginLeft, y)
        .lineTo(pageWidth - marginRight, y)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      y += 24;

      // =====================================================
      // TWO-COLUMN: Billed by / Billed to
      // =====================================================
      const colWidth = contentWidth / 2;
      const leftColX = marginLeft;
      const rightColX = marginLeft + colWidth + 10;

      // --- Left Column: Billed by ---
      const leftStartY = y;
      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Billed by:", leftColX, y);
      y += 14;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text(BRAND_CONFIG.legalName, leftColX, y);
      y += 14;
      doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(BRAND_CONFIG.supportEmail, leftColX, y);
      y += 14;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.muted)
        .text(`${BRAND_CONFIG.address.line1},`, leftColX, y);
      y += 11;
      doc.text(
        `${BRAND_CONFIG.address.city}, ${BRAND_CONFIG.address.state}, India. ${BRAND_CONFIG.address.pincode}`,
        leftColX,
        y
      );
      y += 20;

      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Date Issued:", leftColX, y);
      y += 13;
      const formattedDate = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(formattedDate, leftColX, y);

      // --- Right Column: Billed to ---
      let ry = leftStartY;
      const addr = order.address || {};
      const customerName = addr.fullName || "Valued Customer";
      const customerPhone = addr.phone ? `+91 ${addr.phone}` : "Phone: On File";
      const fullAddress = [
        addr.addressLine1,
        addr.addressLine2,
        addr.landmark,
        addr.city ? `${addr.city}, ${addr.state || ""} ${addr.pincode ? "- " + addr.pincode : ""}` : "",
      ]
        .filter(Boolean)
        .join(", ") || "Delivery Address On File";

      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Billed to:", rightColX, ry);
      ry += 14;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text(customerName, rightColX, ry);
      ry += 14;
      doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(customerPhone, rightColX, ry);
      ry += 14;
      doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(fullAddress, rightColX, ry, { width: colWidth - 20 });
      ry += 30;

      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Payment Status:", rightColX, ry);
      ry += 13;

      const isPaid = order.paymentStatus === "PAID" || order.paymentMethod === "RAZORPAY";
      const paymentLabel = isPaid
        ? `Paid via ${order.paymentMethod || "Online"}`
        : order.paymentMethod === "COD"
        ? "Cash on Delivery"
        : `${order.paymentMethod || "COD"} (${order.paymentStatus || "PENDING"})`;

      // Draw status indicator circle
      doc.circle(rightColX + 4, ry + 4, 3).fillColor(isPaid ? C.green : "#F59E0B").fill();
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(paymentLabel, rightColX + 12, ry);

      // Move Y below both columns
      y = Math.max(y, ry) + 36;

      // =====================================================
      // THIN SEPARATOR
      // =====================================================
      doc
        .moveTo(marginLeft, y)
        .lineTo(pageWidth - marginRight, y)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      y += 20;

      // =====================================================
      // ITEMS TABLE
      // =====================================================
      const itemsColX = marginLeft;
      const qtyColX = marginLeft + contentWidth * 0.55;
      const rateColX = marginLeft + contentWidth * 0.7;
      const totalColX = pageWidth - marginRight;

      // Table header
      doc.font("Helvetica").fontSize(8).fillColor(C.light);
      doc.text("Items", itemsColX, y);
      doc.text("QTY", qtyColX, y, { width: 40, align: "center" });
      doc.text("Rate", rateColX, y, { width: 60, align: "right" });
      doc.text("Total", totalColX - 60, y, { width: 60, align: "right" });

      y += 16;

      doc
        .moveTo(marginLeft, y)
        .lineTo(pageWidth - marginRight, y)
        .strokeColor(C.border)
        .lineWidth(0.3)
        .stroke();

      y += 8;

      const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];

      if (items.length === 0) {
        doc.font("Helvetica-Oblique").fontSize(9).fillColor(C.muted).text("Order items verified upon dispatch", itemsColX, y);
        y += 20;
      } else {
        items.forEach((item: any, index: number) => {
          if (index > 0) {
            doc
              .moveTo(marginLeft, y - 4)
              .lineTo(pageWidth - marginRight, y - 4)
              .strokeColor("#F5F5F5")
              .lineWidth(0.3)
              .stroke();
          }

          const prodName = item.productName || item.name || "Healthcare Product";
          doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor(C.dark)
            .text(prodName, itemsColX, y, { width: contentWidth * 0.5 });

          if (item.packSize) {
            doc
              .font("Helvetica")
              .fontSize(7)
              .fillColor(C.light)
              .text(String(item.packSize), itemsColX, y + 13);
          }

          const qty = item.quantity || 1;
          const price = Number(item.price || item.unitPrice || 0);
          const itemTotal = Number(item.subtotal || price * qty);

          doc.font("Helvetica").fontSize(9).fillColor(C.body).text(String(qty), qtyColX, y, { width: 40, align: "center" });
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(price), rateColX, y, { width: 60, align: "right" });
          doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(itemTotal), totalColX - 60, y, { width: 60, align: "right" });

          y += item.packSize ? 30 : 22;
        });
      }

      y += 12;

      // =====================================================
      // FINANCIAL SUMMARY
      // =====================================================
      const summaryWidth = 200;
      const summaryX = pageWidth - marginRight - summaryWidth;
      const labelX = summaryX;
      const valueX = summaryX + summaryWidth - 80;
      const valueW = 80;

      const subtotalVal = Number(order.subtotal || 0);
      const discountVal = Number(order.discount || order.discountAmount || 0);
      const deliveryVal = Number(order.deliveryFee ?? 40);
      const gstVal = Number(order.gstAmount || 0);
      const totalVal = Number(order.totalAmount || subtotalVal + deliveryVal - discountVal);

      // Subtotal
      doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("Subtotal", labelX, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(subtotalVal), valueX, y, { width: valueW, align: "right" });
      y += 16;

      // CGST & SGST
      if (gstVal > 0) {
        doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("CGST (2.5%)", labelX, y);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(gstVal / 2), valueX, y, { width: valueW, align: "right" });
        y += 16;

        doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("SGST (2.5%)", labelX, y);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(gstVal / 2), valueX, y, { width: valueW, align: "right" });
        y += 16;
      }

      // Discount
      if (discountVal > 0) {
        doc.font("Helvetica").fontSize(9).fillColor("#059669").text("Discount", labelX, y);
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#059669").text(`-${currency(discountVal)}`, valueX, y, { width: valueW, align: "right" });
        y += 16;
      }

      // Delivery
      doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("Delivery", labelX, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(deliveryVal === 0 ? "FREE" : currency(deliveryVal), valueX, y, { width: valueW, align: "right" });
      y += 16;

      doc
        .moveTo(labelX, y)
        .lineTo(labelX + summaryWidth, y)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      y += 12;

      // TOTAL
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text("Total", labelX, y);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(C.black).text(currency(totalVal), valueX - 20, y - 2, { width: valueW + 20, align: "right" });

      y += 40;

      // Notes Box
      const notesBoxX = marginLeft;
      const notesBoxWidth = contentWidth;
      const notesBoxHeight = 56;

      doc.roundedRect(notesBoxX, y, notesBoxWidth, notesBoxHeight, 8).fillColor(C.bgLight).fill();
      doc.roundedRect(notesBoxX, y, notesBoxWidth, notesBoxHeight, 8).strokeColor(C.border).lineWidth(0.5).stroke();

      doc.font("Helvetica-Bold").fontSize(8).fillColor(C.body).text("Notes:", notesBoxX + 16, y + 10);
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(C.muted)
        .text(
          "Thank you for choosing Pharmico. For any questions regarding your prescription or medicine delivery, please reach out to support@pharmico.health. All medicines are dispensed by licensed pharmacists.",
          notesBoxX + 16,
          y + 22,
          { width: notesBoxWidth - 32, lineGap: 2 }
        );

      // Footer
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(C.light)
        .text(
          "This is a computer-generated tax invoice issued by Pharmico Healthcare Pvt. Ltd. No physical signature required.",
          marginLeft,
          doc.page.height - 40,
          { align: "center", width: contentWidth }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const mode = req.nextUrl.searchParams.get("mode") === "inline" ? "inline" : "attachment";

    // 1. Fetch order from Supabase
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
    const filter = isUuid ? `id=eq.${orderId}` : `orderNumber=eq.${orderId}`;

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/Order?${filter}&select=*,items:OrderItem(*),address:Address(*)`,
      { headers: getSupabaseHeaders(), cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json({ success: false, message: "Failed to retrieve order" }, { status: 500 });
    }

    const orders = await res.json();
    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    const order = orders[0];

    // 2. Generate PDF Buffer
    const pdfBuffer = await generateInvoicePdfBuffer(order, mode);
    const filename = `Invoice_${order.orderNumber?.replace(/[^a-zA-Z0-9_-]/g, "") || order.id}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${mode}; filename="${filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id]/invoice error:", error?.message);
    return NextResponse.json({ success: false, message: "Failed to generate invoice PDF" }, { status: 500 });
  }
}
