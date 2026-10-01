import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import prisma from "./lib/prisma";
import { startBackgroundJobs } from "./jobs/cleanup";

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Medico API server running on http://localhost:${PORT}`);
  console.log(`🩺 Healthcheck: http://localhost:${PORT}/api/health`);

  // Start background jobs only in non-serverless environments
  // On Vercel, these run via Vercel Cron (see vercel.json)
  if (process.env.VERCEL !== "1") {
    startBackgroundJobs();
  }
});

// Graceful shutdown handling
const shutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("🔒 Prisma database connections closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
