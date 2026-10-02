import { NextRequest, NextResponse } from "next/server";
import { getSupabaseConfig, getSupabaseHeaders } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const { url: SUPABASE_URL } = getSupabaseConfig();

function sanitizePdfText(str: any): string {
  return String(str || "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, " ");
}

function formatCurrency(amount: any): string {
  return "Rs. " + Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildInvoicePdfBuffer(order: any): Buffer {
  let stream = "";

  const text = (x: number, y: number, str: string, font = "/F1", size = 10, color = "0 0 0") => {
    stream += "BT\n" + font + " " + size + " Tf\n" + color + " rg\n" + x + " " + y + " Td\n(" + sanitizePdfText(str) + ") Tj\nET\n";
  };

  const line = (x1: number, y1: number, x2: number, y2: number, color = "0.85 0.85 0.85", width = 0.5) => {
    stream += color + " RG\n" + width + " w\n" + x1 + " " + y1 + " m\n" + x2 + " " + y2 + " l\nS\n";
  };

  const rect = (x: number, y: number, w: number, h: number, fillColor = "0.98 0.98 0.98", strokeColor = "0.9 0.9 0.9") => {
    stream += strokeColor + " RG\n" + fillColor + " rg\n0.5 w\n" + x + " " + y + " " + w + " " + h + " re\nB\n";
  };

  // Header Title
  text(50, 780, "TAX INVOICE", "/F1", 24, "0.04 0.29 0.23");
  text(50, 762, "Pharmico Online Pharmacy & Healthcare Platform", "/F2", 9, "0.4 0.45 0.42");

  const orderNum = order.orderNumber || "MED-" + (order.id ? order.id.slice(0, 8).toUpperCase() : "ORDER");
  text(380, 780, "Invoice #" + orderNum, "/F1", 12, "0.1 0.1 0.1");
  const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  text(380, 764, "Date: " + dateStr, "/F2", 9, "0.4 0.4 0.4");

  line(50, 745, 545, 745, "0.8 0.85 0.82", 1);

  // 2-Column Info: Billed By vs Billed To
  text(50, 725, "BILLED BY:", "/F1", 8, "0.5 0.5 0.5");
  text(50, 710, "Pharmico Healthcare Private Limited", "/F1", 10, "0.1 0.1 0.1");
  text(50, 696, "DL No: KA-BLR-2024-00129 | GSTIN: 29AAAAA0000A1Z5", "/F2", 8, "0.35 0.35 0.35");
  text(50, 684, "Kudlu Gate, Hosur Road, Bangalore, Karnataka - 560068", "/F2", 8, "0.35 0.35 0.35");
  text(50, 672, "Support: support@pharmico.health | +91 80 4912 3456", "/F2", 8, "0.35 0.35 0.35");

  const addr = order.address || {};
  text(320, 725, "BILLED & DELIVER TO:", "/F1", 8, "0.5 0.5 0.5");
  text(320, 710, addr.fullName || "Valued Customer", "/F1", 10, "0.1 0.1 0.1");
  text(320, 696, "Phone: +91 " + (addr.phone || "N/A"), "/F2", 8, "0.35 0.35 0.35");
  const fullAddr = [addr.addressLine1, addr.city, addr.pincode ? "- " + addr.pincode : ""]
    .filter(Boolean)
    .join(", ");
  text(320, 684, fullAddr || "Delivery Address On File", "/F2", 8, "0.35 0.35 0.35");
  text(320, 672, "Payment: " + (order.paymentMethod || "COD") + " (" + (order.paymentStatus || "COMPLETED") + ")", "/F1", 8, "0.04 0.29 0.23");

  line(50, 655, 545, 655, "0.85 0.85 0.85", 0.5);

  // Items Table Header
  rect(50, 630, 495, 20, "0.95 0.97 0.96", "0.85 0.88 0.86");
  text(60, 636, "ITEM DESCRIPTION", "/F1", 8, "0.1 0.1 0.1");
  text(360, 636, "QTY", "/F1", 8, "0.1 0.1 0.1");
  text(420, 636, "RATE", "/F1", 8, "0.1 0.1 0.1");
  text(485, 636, "AMOUNT", "/F1", 8, "0.1 0.1 0.1");

  let curY = 612;
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    { productName: "Healthcare & Medicine Products", quantity: 1, price: order.subtotal || 195, subtotal: order.subtotal || 195 }
  ];

  for (const item of items) {
    const name = (item.productName || item.name || "Medicine / Healthcare Item").slice(0, 50);
    const qty = String(item.quantity || 1);
    const rate = formatCurrency(item.price || item.unitPrice || 0);
    const amt = formatCurrency(item.subtotal || ((item.price || 0) * (item.quantity || 1)));

    text(60, curY, name, "/F1", 9, "0.15 0.15 0.15");
    text(365, curY, qty, "/F2", 9, "0.3 0.3 0.3");
    text(420, curY, rate, "/F2", 9, "0.3 0.3 0.3");
    text(485, curY, amt, "/F1", 9, "0.15 0.15 0.15");

    line(50, curY - 6, 545, curY - 6, "0.93 0.93 0.93", 0.5);
    curY -= 22;
  }

  // Summary
  curY -= 10;
  const sumX = 350;
  text(sumX, curY, "Subtotal:", "/F2", 9, "0.4 0.4 0.4");
  text(485, curY, formatCurrency(order.subtotal || 195), "/F1", 9, "0.1 0.1 0.1");
  curY -= 16;

  text(sumX, curY, "Delivery Fee:", "/F2", 9, "0.4 0.4 0.4");
  text(485, curY, order.deliveryFee === 0 ? "FREE" : formatCurrency(order.deliveryFee || 40), "/F1", 9, "0.1 0.1 0.1");
  curY -= 16;

  if (order.discount && Number(order.discount) > 0) {
    text(sumX, curY, "Discount Applied:", "/F2", 9, "0.04 0.6 0.3");
    text(485, curY, "-" + formatCurrency(order.discount), "/F1", 9, "0.04 0.6 0.3");
    curY -= 16;
  }

  line(sumX, curY + 2, 545, curY + 2, "0.8 0.8 0.8", 1);
  curY -= 12;
  text(sumX, curY, "TOTAL PAYABLE:", "/F1", 11, "0.04 0.29 0.23");
  text(475, curY, formatCurrency(order.totalAmount || 235), "/F1", 12, "0.04 0.29 0.23");

  // Notes Box
  curY -= 50;
  rect(50, curY, 495, 45, "0.98 0.98 0.98", "0.9 0.9 0.9");
  text(60, curY + 30, "CUSTOMER NOTES & STATUTORY NOTICE:", "/F1", 7, "0.3 0.3 0.3");
  text(60, curY + 18, "All medicines are dispensed by registered pharmacists in accordance with the Drugs and Cosmetics Act.", "/F2", 7, "0.45 0.45 0.45");
  text(60, curY + 8, "Keep medicines stored at room temperature away from direct sunlight. In case of issues, contact support@pharmico.health", "/F2", 7, "0.45 0.45 0.45");

  // Footer
  text(50, 40, "This is an authentic computer-generated GST tax invoice from Pharmico Healthcare Pvt. Ltd. No physical signature required.", "/F2", 7, "0.6 0.6 0.6");

  // Build standard PDF 1.4 structure
  const streamLen = Buffer.byteLength(stream, "utf8");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> >>",
    "<< /Length " + streamLen + " >>\nstream\n" + stream + "endstream",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += (i + 1) + " 0 obj\n" + objects[i] + "\nendobj\n";
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += "xref\n0 " + (objects.length + 1) + "\n0000000000 65535 f \n";
  for (const off of offsets) {
    pdf += String(off).padStart(10, "0") + " 00000 n \n";
  }
  pdf += "trailer\n<< /Size " + (objects.length + 1) + " /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF";

  return Buffer.from(pdf, "utf8");
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;
    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID is required" }, { status: 400 });
    }

    const mode = req.nextUrl.searchParams.get("mode") === "inline" ? "inline" : "attachment";

    // Fetch order from Supabase
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
    const pdfBuffer = buildInvoicePdfBuffer(order);
    const safeOrderNum = (order.orderNumber || order.id).replace(/[^a-zA-Z0-9_-]/g, "");

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${mode}; filename="Invoice_${safeOrderNum}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("GET /api/orders/[id]/invoice error:", error?.message);
    return NextResponse.json({ success: false, message: "Failed to generate invoice PDF" }, { status: 500 });
  }
}
