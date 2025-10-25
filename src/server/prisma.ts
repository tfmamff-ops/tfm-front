import { PrismaClient } from "@prisma/client";

// Ensure a single PrismaClient instance across hot-reloads (dev) and SSR
declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // log: ["query"], // enable if you want to debug queries
  });

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
