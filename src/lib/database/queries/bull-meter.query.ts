import { desc, eq, gt } from "drizzle-orm";
import { db } from "../index";
import { bullMetersTable, type BullMeter } from "../db.schema";
import { type Hex } from "viem";

/**
 * Get a bull meter by pollId
 * @param pollId - The onchain poll id (Hex)
 * @returns The bull meter or null if not found
 */
export const getBullMeterByPollId = async (
  pollId: Hex
): Promise<BullMeter | null> => {
  const bullMeter = await db
    .select()
    .from(bullMetersTable)
    .where(eq(bullMetersTable.pollId, pollId))
    .limit(1);

  return bullMeter[0] || null;
};

/**
 * Get active bull meters (deadline in the future)
 * @param nowMs - Current time in ms
 */
export const getActiveBullMeters = async (
  nowMs: number
): Promise<BullMeter[]> => {
  return await db
    .select()
    .from(bullMetersTable)
    .where(gt(bullMetersTable.deadline, nowMs))
    .orderBy(desc(bullMetersTable.updatedAt));
};
