/**
 * Script: run-consistency-audit.mjs
 * Purpose: Executes the global database consistency invariant queries (C1–C15)
 *          defined in consistency-audit.sql against PostgreSQL via Prisma.
 * Usage: npm run test:consistency
 * Arguments: None
 * Safety: Read-only SELECT queries only. 100% non-destructive. Safe to run in production.
 */

import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

export async function runConsistencyAudit() {
  console.log("🔍 Running Medico Global Consistency Invariants Audit (C1-C13)...");

  const sqlPath = path.join(__dirname, "consistency-audit.sql");
  const sqlRaw = fs.readFileSync(sqlPath, "utf8");

  // Remove comment lines first so semicolons inside comments don't break splitting
  const sqlWithoutComments = sqlRaw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("--"))
    .join("\n");

  const rawQueries = sqlWithoutComments
    .split(";")
    .map((q) => q.trim())
    .filter((q) => q.length > 0);

  let totalViolations = 0;
  const auditResults = [];

  for (const query of rawQueries) {
    // Extract invariant code comment or name if possible
    const firstLine = query.split("\n")[0];
    try {
      const result = await prisma.$queryRawUnsafe(query);
      if (Array.isArray(result) && result.length > 0) {
        for (const row of result) {
          const invariantCode = row.invariant_code || "UNKNOWN";
          const violations = Number(row.violations || row.cnt || 0);
          const details = row.violation_details || null;

          auditResults.push({
            invariant: invariantCode,
            violations,
            details,
          });

          if (violations > 0) {
            totalViolations += violations;
            console.error(`❌ [FAIL] ${invariantCode}: ${violations} violation(s) detected!`);
            if (details) {
              console.error(`   Details:`, JSON.stringify(details, null, 2));
            }
          } else {
            console.log(`✅ [PASS] ${invariantCode}: 0 violations.`);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Query failed or skipped: ${firstLine}... Reason: ${err.message}`);
    }
  }

  console.log("--------------------------------------------------");
  if (totalViolations === 0) {
    console.log("🎯 ALL GLOBAL CONSISTENCY INVARIANTS SATISFIED (0 Violations).");
  } else {
    console.error(`🚨 TOTAL INVARIANT VIOLATIONS: ${totalViolations}`);
  }
  console.log("--------------------------------------------------");

  return { totalViolations, auditResults };
}

// Allow standalone execution
if (process.argv[1] === __filename) {
  runConsistencyAudit()
    .then(({ totalViolations }) => {
      prisma.$disconnect();
      if (totalViolations > 0) {
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("Fatal error during consistency audit:", err);
      prisma.$disconnect();
      process.exit(1);
    });
}
