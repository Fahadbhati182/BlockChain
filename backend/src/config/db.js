import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

let prismaInstance = null;
let isDbConnected = false;

try {
  if (process.env.DATABASE_URL) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });

    // Verify connection asynchronously
    prismaInstance.$connect()
      .then(() => {
        isDbConnected = true;
        console.log(" PostgreSQL database connected via Prisma.");
      })
      .catch((err) => {
        isDbConnected = false;
        console.warn(" Database connection warning: PostgreSQL is not reachable. Falling back to local cache mode.");
        console.warn(`   Reason: ${err.message}`);
      });
  } else {
    console.log("ℹ️ No DATABASE_URL specified in environment. Running in offline/blockchain-direct mode.");
  }
} catch (e) {
  console.warn("⚠️ Prisma client initialization skipped:", e.message);
}

export const prisma = prismaInstance;
export const checkDbStatus = async () => {
  if (!prismaInstance) return { connected: false, reason: "DATABASE_URL not configured" };
  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    isDbConnected = true;
    return { connected: true };
  } catch (err) {
    isDbConnected = false;
    return { connected: false, reason: err.message };
  }
};
