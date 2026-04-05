import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

import { PrismaClient } from "../../generated/prisma/client.js";

function getDatabaseUrl(): string {
  const value = process.env.DATABASE_URL;

  if (!value) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  return value;
}

const pool = new Pool({
  connectionString: getDatabaseUrl(),
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});
