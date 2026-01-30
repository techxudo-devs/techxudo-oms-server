import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
const accelerateUrl = process.env.PRISMA_ACCELERATE_URL;
const useNeonAdapter = process.env.NEON_ADAPTER === "true";

let prisma;

if (accelerateUrl) {
  prisma = new PrismaClient({ accelerateUrl });
} else if (useNeonAdapter) {
  neonConfig.fetchConnectionCache = true;
  const pool = new Pool({ connectionString: databaseUrl });
  prisma = new PrismaClient({ adapter: new PrismaNeon(pool) });
} else {
  prisma = new PrismaClient();
}

export default prisma;
