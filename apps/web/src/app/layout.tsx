import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Header from "@/components/Header";
import PillNav from "@/components/PillNav";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import AuthModalProvider from "@/components/AuthModalProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pharmico - Online Pharmacy & Healthcare Platform",
  description:
    "Order genuine medicines, vitamins, health supplements, OTC wellness products, and book lab tests with doorstep delivery in 24-48 hours.",
  keywords: [
    "online pharmacy",
    "buy medicines online",
    "health supplements",
    "vitamins",
    "lab tests online",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-[#F4F6F5] text-[#0F2A22] antialiased">
        <ClerkProvider>
          <Header />
          <PillNav />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <AuthModalProvider />
        </ClerkProvider>
      </body>
    </html>
  );
}
