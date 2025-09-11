import { and, count, desc, eq, gte, lte, gt } from "drizzle-orm";
import { db } from "../index";
import {
  brandsTable,
  bullMetersTable,
  CreateBullMeter,
  UpdateBullMeter,
  type BullMeter,
} from "../db.schema";
import { type Hex } from "viem";

/**
 * Create a new bull meter
 * @param bullMeterData - The bull meter data to create
 * @returns The created bull meter
 */
export const createBullMeter = async (
  bullMeterData: CreateBullMeter
): Promise<BullMeter> => {
  const [newBullMeter] = await db
    .insert(bullMetersTable)
    .values(bullMeterData)
    .returning();

  return newBullMeter;
};

/**
 * Get a bull meter by ID
 * @param bullMeterId - The bull meter ID
 * @returns The bull meter or null if not found
 */
export const getBullMeterById = async (
  bullMeterId: string
): Promise<BullMeter | null> => {
  const bullMeter = await db
    .select()
    .from(bullMetersTable)
    .where(eq(bullMetersTable.id, bullMeterId))
    .limit(1);

  return bullMeter[0] || null;
};

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
 * Get all bull meters for a brand
 * @param brandId - The brand ID
 * @returns Array of bull meters for the brand
 */
export const getBullMetersByBrand = async (
  brandId: string
): Promise<BullMeter[]> => {
  return await db
    .select()
    .from(bullMetersTable)
    .where(eq(bullMetersTable.brandId, brandId))
    .orderBy(desc(bullMetersTable.createdAt));
};

/**
 * Get all bull meters with brand information
 * @param limit - Optional limit for results
 * @returns Array of bull meters with brand data
 */
export const getAllBullMetersWithBrand = async (limit?: number) => {
  const query = db
    .select({
      bullMeter: bullMetersTable,
      brand: brandsTable,
    })
    .from(bullMetersTable)
    .innerJoin(brandsTable, eq(bullMetersTable.brandId, brandsTable.id))
    .orderBy(desc(bullMetersTable.createdAt));

  return limit ? await query.limit(limit) : await query;
};

/**
 * Get recent bull meters
 * @param limit - Number of recent bull meters to get (default: 10)
 * @returns Array of recent bull meters
 */
export const getRecentBullMeters = async (limit = 10): Promise<BullMeter[]> => {
  return await db
    .select()
    .from(bullMetersTable)
    .orderBy(desc(bullMetersTable.createdAt))
    .limit(limit);
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
 * Update a bull meter
 * @param bullMeterId - The bull meter ID
 * @param updateData - The data to update
 * @returns The updated bull meter or null if not found
 */
export const updateBullMeter = async (
  bullMeterId: string,
  updateData: UpdateBullMeter
): Promise<BullMeter | null> => {
  const [updatedBullMeter] = await db
    .update(bullMetersTable)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(bullMetersTable.id, bullMeterId))
    .returning();

  return updatedBullMeter || null;
};

/**
 * Delete a bull meter
 * @param bullMeterId - The bull meter ID
 * @returns Whether the bull meter was deleted
 */
export const deleteBullMeter = async (
  bullMeterId: string
): Promise<boolean> => {
  const result = await db
    .delete(bullMetersTable)
    .where(eq(bullMetersTable.id, bullMeterId));

  return result.rowsAffected > 0;
};

/**
 * Get bull meters by duration range
 * @param minDuration - Minimum duration in seconds
 * @param maxDuration - Maximum duration in seconds
 * @returns Array of bull meters within duration range
 */
export const getBullMetersByDuration = async (
  minDuration?: number,
  maxDuration?: number
): Promise<BullMeter[]> => {
  const conditions = [];

  if (minDuration !== undefined) {
    conditions.push(gte(bullMetersTable.duration, minDuration));
  }

  if (maxDuration !== undefined) {
    conditions.push(lte(bullMetersTable.duration, maxDuration));
  }

  if (conditions.length === 0) {
    return await db.select().from(bullMetersTable);
  }

  return await db
    .select()
    .from(bullMetersTable)
    .where(and(...conditions))
    .orderBy(desc(bullMetersTable.createdAt));
};

/**
 * Count bull meters by brand
 * @param brandId - The brand ID
 * @returns Number of bull meters for the brand
 */
export const countBullMetersByBrand = async (
  brandId: string
): Promise<number> => {
  const result = await db
    .select({ count: count() })
    .from(bullMetersTable)
    .where(eq(bullMetersTable.brandId, brandId));

  return result[0]?.count || 0;
};
