import { PrismaClient } from "@/generated/prisma";

// Singleton để tránh tạo nhiều kết nối khi hot-reload ở dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
