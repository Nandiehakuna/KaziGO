import { prisma } from "../lib/prisma";

export async function logActivity(
  type: string,
  pillar: string,
  message: string,
  phone?: string,
  metadata?: string
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: { type, pillar, message, phone, metadata },
    });
  } catch (error) {
    console.error("Activity log error:", error);
  }
}
