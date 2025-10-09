import { desc, eq, gt } from "drizzle-orm";
import { db } from "../index";
import { bullMetersTable, UpdateBullMeter, type BullMeter } from "../db.schema";
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

/**
 * Update vote counts for a specific poll
 * @param pollId - The poll ID (blockchain poll ID)
 * @param isYes - Whether the vote is yes (true) or no (false)
 * @param voteCount - Number of votes to add (default: 1)
 * @returns The updated bull meter or null if not found
 */
export const updateVoteCounts = async (
  pollId: string,
  isYes: boolean,
  voteCount: number = 1,
): Promise<BullMeter | null> => {
  // First get the current bull meter to check if it exists
  const currentBullMeter = await db
    .select()
    .from(bullMetersTable)
    .where(eq(bullMetersTable.pollId, pollId as `0x${string}`))
    .limit(1);

  if (!currentBullMeter[0]) {
    console.error(`Bull meter not found for pollId: ${pollId}`);
    return null;
  }

  const current = currentBullMeter[0];
  const currentYesVotes = current.totalYesVotes || 0;
  const currentNoVotes = current.totalNoVotes || 0;

  // Update the appropriate vote count
  const updateData: UpdateBullMeter = {
    totalYesVotes: isYes ? currentYesVotes + voteCount : currentYesVotes,
    totalNoVotes: !isYes ? currentNoVotes + voteCount : currentNoVotes,
  };

  const [updatedBullMeter] = await db
    .update(bullMetersTable)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(bullMetersTable.pollId, pollId as `0x${string}`))
    .returning();

  return updatedBullMeter || null;
};
