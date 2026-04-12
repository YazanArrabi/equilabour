/**
 * Removes all seed data (users whose email ends with @equilabour-seed.dev).
 * Cascades to profiles, jobs, applications, and tokens automatically.
 *
 * Run: pnpm --filter api prisma:unseed
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../generated/prisma/client.js";
import "dotenv/config";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const result = await prisma.user.deleteMany({
    where: { email: { endsWith: "@equilabour-seed.dev" } },
  });
  console.log(`🧹  Removed ${result.count} seed user(s) and all cascaded data.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
