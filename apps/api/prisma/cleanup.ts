/**
 * Removes abandoned registrations — users who started signing up but never
 * completed phone verification and whose record is older than 24 hours.
 *
 * Safe to run at any time; fully verified accounts are never touched.
 *
 * Run: pnpm --filter api prisma:cleanup
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

  const result = await prisma.user.deleteMany({
    where: {
      phoneVerified: false,
      createdAt: { lt: cutoff },
    },
  });

  if (result.count === 0) {
    console.log("✅  No abandoned registrations found.");
  } else {
    console.log(`🧹  Removed ${result.count} abandoned registration(s) older than 24 hours.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
