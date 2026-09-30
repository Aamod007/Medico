import PDFDocument from "pdfkit";
import { Response } from "express";

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

export class InvoiceService {
  static generateGSTInvoicePDF(data: InvoiceData, res: Response): void {
    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${data.orderNumber}.pdf`
    );

    doc.pipe(res);

    // --- Header ---
    doc
      .fillColor("#0B4A3A")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(process.env.STORE_NAME || "Pharmico Online Pharmacy", 40, 40);

    doc
      .fillColor("#5B6B65")
      .fontSize(9)
      .font("Helvetica")
      .text("Retail Drug License No: " + (process.env.STORE_DL_NUMBER || "KA-BLR-2024-00129"), 40, 68)
      .text("GSTIN: " + (process.env.STORE_GSTIN || "29AAAAA0000A1Z5"), 40, 80)
      .text("Support: " + (process.env.STORE_EMAIL || "support@pharmico.health"), 40, 92);

    doc
      .fillColor("#0B4A3A")
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("TAX INVOICE", 400, 40, { align: "right" });

    doc
      .fillColor("#0F2A22")
      .fontSize(9)
      .font("Helvetica")
      .text(`Invoice No: ${data.orderNumber}`, 400, 65, { align: "right" })
      .text(`Date: ${new Date(data.orderDate).toLocaleDateString("en-IN")}`, 400, 78, { align: "right" })
      .text(`Payment: ${data.paymentMethod} (${data.paymentStatus})`, 400, 91, { align: "right" });

    doc.moveTo(40, 115).lineTo(555, 115).strokeColor("#D7DEDB").lineWidth(1).stroke();

    // --- Bill To / Ship To ---
    doc
      .fillColor("#0B4A3A")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("BILL TO / DELIVER TO:", 40, 130);

    doc
      .fillColor("#0F2A22")
      .fontSize(9)
      .font("Helvetica")
      .text(data.customerName, 40, 145)
      .text(`Phone: ${data.customerPhone}`, 40, 157)
      .text(data.customerAddress, 40, 169, { width: 300 });

    // --- Items Table Header ---
    const tableTop = 220;
    doc
      .rect(40, tableTop - 5, 515, 22)
      .fillColor("#FAF3EA")
      .fill();

    doc
      .fillColor("#0F2A22")
      .fontSize(8)
      .font("Helvetica-Bold")
      .text("ITEM / FORMULATION", 50, tableTop)
      .text("PACK", 230, tableTop)
      .text("QTY", 310, tableTop)
      .text("MRP", 350, tableTop)
      .text("RATE", 410, tableTop)
      .text("GST%", 470, tableTop)
      .text("TOTAL", 510, tableTop, { align: "right" });

    let currentY = tableTop + 24;

    doc.font("Helvetica").fontSize(8);
    data.items.forEach((item) => {
      doc
        .fillColor("#0F2A22")
        .text(item.productName, 50, currentY, { width: 170 })
        .text(item.packSize, 230, currentY)
        .text(item.quantity.toString(), 310, currentY)
        .text(`₹${item.mrp.toFixed(2)}`, 350, currentY)
        .text(`₹${item.price.toFixed(2)}`, 410, currentY)
        .text(`${item.gstRate}%`, 470, currentY)
        .text(`₹${item.subtotal.toFixed(2)}`, 40, currentY, { align: "right" });

      currentY += 20;
    });

    doc.moveTo(40, currentY + 5).lineTo(555, currentY + 5).strokeColor("#D7DEDB").stroke();
    currentY += 15;

    // --- Totals ---
    const cgst = data.gstAmount / 2;
    const sgst = data.gstAmount / 2;

    doc
      .fontSize(9)
      .font("Helvetica")
      .text("Subtotal:", 350, currentY)
      .text(`₹${data.subtotal.toFixed(2)}`, 40, currentY, { align: "right" });
    currentY += 14;

    if (data.discount > 0) {
      doc
        .text("Discount:", 350, currentY)
        .text(`-₹${data.discount.toFixed(2)}`, 40, currentY, { align: "right" });
      currentY += 14;
    }

    doc
      .text("CGST (6%):", 350, currentY)
      .text(`₹${cgst.toFixed(2)}`, 40, currentY, { align: "right" });
    currentY += 14;

    doc
      .text("SGST (6%):", 350, currentY)
      .text(`₹${sgst.toFixed(2)}`, 40, currentY, { align: "right" });
    currentY += 14;

    doc
      .text("Delivery Fee:", 350, currentY)
      .text(`₹${data.deliveryFee.toFixed(2)}`, 40, currentY, { align: "right" });
    currentY += 18;

    doc
      .rect(340, currentY - 4, 215, 24)
      .fillColor("#0B4A3A")
      .fill();

    doc
      .fillColor("#FFFFFF")
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Total Paid:", 350, currentY + 2)
      .text(`₹${data.totalAmount.toFixed(2)}`, 40, currentY + 2, { align: "right" });

    // --- Footer & Disclaimer ---
    doc
      .fillColor("#5B6B65")
      .fontSize(7)
      .font("Helvetica")
      .text(
        "Medicines dispensed by registered pharmacist against valid prescription where applicable. Keep medicines out of reach of children. Store in a cool dry place.",
        40,
        760,
        { align: "center", width: 515 }
      )
      .text("This is a computer-generated tax invoice. No signature required.", 40, 775, {
        align: "center",
        width: 515,
      });

    doc.end();
  }
}
