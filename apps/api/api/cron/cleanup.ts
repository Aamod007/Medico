import dotenv from "dotenv";
dotenv.config();

import { runInventoryCleanup } from "../src/jobs/cleanup";

// Vercel Cron handler — called on schedule via vercel.json crons
export default async function handler(req: any, res: any) {
  // Verify the request is from Vercel Cron (optional security check)
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // If CRON_SECRET is not set, allow anyway (dev mode)
    if (process.env.CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  }

  try {
    await runInventoryCleanup();
    res.status(200).json({ success: true, message: "Cleanup completed", timestamp: new Date().toISOString() });
  } catch (error: any) {
    console.error("Cron cleanup error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
