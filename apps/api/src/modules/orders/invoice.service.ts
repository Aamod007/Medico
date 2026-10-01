import { Response } from "express";

const PDFDocument = require("pdfkit");

interface InvoiceData {
  orderNumber: string;
  orderDate: Date;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: Array<{
    productName: string;
    packSize: string;
    sku: string;
    quantity: number;
    price: number;
    mrp: number;
    gstRate: number;
    subtotal: number;
  }>;
  subtotal: number;
  discount: number;
  gstAmount: number;
  deliveryFee: number;
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
}

// Colors matching the InvoiceCard design
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

function currency(amount: number): string {
  // Format Indian Rupee style: 1,23,456.00
  const formatted = Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Rs. ${formatted}`;
}

export class InvoiceService {
  static generateGSTInvoicePDF(data: InvoiceData, res: Response): void {
    try {
      const doc = new PDFDocument({
        margin: 50,
        size: "A4",
        bufferPages: true,
        info: {
          Title: `Invoice ${data.orderNumber}`,
          Author: "Medico Online Pharmacy",
          Subject: "Tax Invoice",
        },
      });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=Invoice_${data.orderNumber}.pdf`
      );

      doc.pipe(res);

      doc.on("error", (err: Error) => {
        console.error("PDFKit stream error:", err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, message: "PDF generation failed" });
        }
      });

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

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(C.light)
        .text("Invoice Number  ", marginLeft, y, { continued: true })
        .font("Helvetica-Bold")
        .fillColor(C.dark)
        .text(`#${data.orderNumber}`);

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
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text("Medico", leftColX, y);
      y += 14;
      doc.font("Helvetica").fontSize(8).fillColor(C.muted).text("hello@medico.in", leftColX, y);
      y += 14;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.muted)
        .text("8526 Daisy Drive, Bellandur,", leftColX, y);
      y += 11;
      doc.text("Bangalore, Karnataka, India. 560103", leftColX, y);
      y += 20;

      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Date Issued:", leftColX, y);
      y += 13;
      const formattedDate = new Date(data.orderDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(formattedDate, leftColX, y);

      // --- Right Column: Billed to ---
      let ry = leftStartY;
      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Billed to:", rightColX, ry);
      ry += 14;
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text(data.customerName, rightColX, ry);
      ry += 14;
      doc.font("Helvetica").fontSize(8).fillColor(C.muted).text(`+91 ${data.customerPhone}`, rightColX, ry);
      ry += 14;
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(C.muted)
        .text(data.customerAddress, rightColX, ry, { width: colWidth - 20 });
      ry += 30;

      doc.font("Helvetica").fontSize(8).fillColor(C.light).text("Payment Status:", rightColX, ry);
      ry += 13;

      // Payment status with green dot
      const paymentLabel =
        data.paymentStatus === "PAID" || data.paymentMethod === "RAZORPAY"
          ? `Paid via ${data.paymentMethod}`
          : data.paymentMethod === "COD"
          ? "Cash on Delivery"
          : `${data.paymentMethod} (${data.paymentStatus})`;

      // Draw green dot
      doc.circle(rightColX + 4, ry + 4, 3).fillColor(C.green).fill();
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
      // ITEMS TABLE — Clean, minimal design
      // =====================================================
      // Column positions
      const itemsColX = marginLeft;
      const qtyColX = marginLeft + contentWidth * 0.55;
      const rateColX = marginLeft + contentWidth * 0.70;
      const totalColX = pageWidth - marginRight;

      // Table header
      doc.font("Helvetica").fontSize(8).fillColor(C.light);
      doc.text("Items", itemsColX, y);
      doc.text("QTY", qtyColX, y, { width: 40, align: "center" });
      doc.text("Rate", rateColX, y, { width: 60, align: "right" });
      doc.text("Total", totalColX - 60, y, { width: 60, align: "right" });

      y += 16;

      // Thin line below header
      doc
        .moveTo(marginLeft, y)
        .lineTo(pageWidth - marginRight, y)
        .strokeColor(C.border)
        .lineWidth(0.3)
        .stroke();

      y += 8;

      // Table rows
      data.items.forEach((item, index) => {
        // Row separator (except first)
        if (index > 0) {
          doc
            .moveTo(marginLeft, y - 4)
            .lineTo(pageWidth - marginRight, y - 4)
            .strokeColor("#F5F5F5")
            .lineWidth(0.3)
            .stroke();
        }

        // Product name
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(C.dark)
          .text(item.productName, itemsColX, y, { width: contentWidth * 0.50 });

        // Pack size (subtitle)
        if (item.packSize) {
          doc
            .font("Helvetica")
            .fontSize(7)
            .fillColor(C.light)
            .text(item.packSize, itemsColX, y + 13);
        }

        // QTY
        doc
          .font("Helvetica")
          .fontSize(9)
          .fillColor(C.body)
          .text(item.quantity.toString(), qtyColX, y, { width: 40, align: "center" });

        // Rate
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(C.dark)
          .text(currency(item.price), rateColX, y, { width: 60, align: "right" });

        // Total
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(C.dark)
          .text(currency(item.subtotal), totalColX - 60, y, { width: 60, align: "right" });

        y += item.packSize ? 30 : 22;
      });

      y += 12;

      // =====================================================
      // FINANCIAL SUMMARY — right-aligned block
      // =====================================================
      const summaryWidth = 200;
      const summaryX = pageWidth - marginRight - summaryWidth;
      const labelX = summaryX;
      const valueX = summaryX + summaryWidth - 80;
      const valueW = 80;

      // Subtotal
      doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("Subtotal", labelX, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(data.subtotal), valueX, y, { width: valueW, align: "right" });
      y += 16;

      // Tax (GST)
      const cgst = data.gstAmount / 2;
      const sgst = data.gstAmount / 2;
      doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("CGST", labelX, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(cgst), valueX, y, { width: valueW, align: "right" });
      y += 16;

      doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("SGST", labelX, y);
      doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(sgst), valueX, y, { width: valueW, align: "right" });
      y += 16;

      // Discount (if any)
      if (data.discount > 0) {
        doc.font("Helvetica").fontSize(9).fillColor("#059669").text("Discount", labelX, y);
        doc.font("Helvetica-Bold").fontSize(9).fillColor("#059669").text(`-${currency(data.discount)}`, valueX, y, { width: valueW, align: "right" });
        y += 16;
      }

      // Delivery
      if (data.deliveryFee > 0) {
        doc.font("Helvetica").fontSize(9).fillColor(C.muted).text("Delivery", labelX, y);
        doc.font("Helvetica-Bold").fontSize(9).fillColor(C.dark).text(currency(data.deliveryFee), valueX, y, { width: valueW, align: "right" });
        y += 16;
      }

      y += 4;

      // Separator before total
      doc
        .moveTo(labelX, y)
        .lineTo(labelX + summaryWidth, y)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      y += 12;

      // TOTAL — larger, bolder
      doc.font("Helvetica-Bold").fontSize(10).fillColor(C.dark).text("Total", labelX, y);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(C.black).text(currency(data.totalAmount), valueX - 20, y - 2, { width: valueW + 20, align: "right" });

      y += 40;

      // =====================================================
      // NOTES BOX — light background rounded rectangle
      // =====================================================
      const notesBoxX = marginLeft;
      const notesBoxWidth = contentWidth;
      const notesBoxHeight = 60;

      // Background rectangle
      doc
        .roundedRect(notesBoxX, y, notesBoxWidth, notesBoxHeight, 8)
        .fillColor(C.bgLight)
        .fill();

      // Border
      doc
        .roundedRect(notesBoxX, y, notesBoxWidth, notesBoxHeight, 8)
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      // Notes label
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(C.body)
        .text("Notes:", notesBoxX + 16, y + 12);

      // Notes body
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(C.muted)
        .text(
          "Thank you for your business. For any questions regarding this invoice or your medicine delivery, please reach out to hello@medico.in. All products are verified and dispensed by licensed pharmacists.",
          notesBoxX + 16,
          y + 24,
          { width: notesBoxWidth - 32, lineGap: 2 }
        );

      // =====================================================
      // FOOTER — subtle, at bottom
      // =====================================================
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(C.light)
        .text(
          "This is a computer-generated tax invoice. No signature required.",
          marginLeft,
          doc.page.height - 40,
          { align: "center", width: contentWidth }
        );

      doc.end();
    } catch (err) {
      console.error("Invoice PDF generation error:", err);
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: "Failed to generate invoice PDF" });
      }
    }
  }
}
