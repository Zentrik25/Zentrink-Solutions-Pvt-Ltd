import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function create(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  // `max: 1` per function instance: serverless concurrency comes from many
  // instances, so each keeps a tiny pool and relies on the provider's pooler.
  const adapter = new PrismaPg({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 1) });
  return new PrismaClient({ adapter });
}

export function db(): PrismaClient {
  if (!globalForPrisma.prisma) globalForPrisma.prisma = create();
  return globalForPrisma.prisma;
}

export type Db = PrismaClient;
