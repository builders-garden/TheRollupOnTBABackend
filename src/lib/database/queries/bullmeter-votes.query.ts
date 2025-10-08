import { db } from "../index";
import {
  bullMeterVotesTable,
  type CreateBullmeterVote,
} from "../db.schema";

/**
 * Create a new bullmeter vote
 * @param data - The bullmeter vote data to create
 * @returns The created bullmeter vote
 */
export const createBullmeterVote = async (data: CreateBullmeterVote) => {
  const [newBullmeterVote] = await db
    .insert(bullMeterVotesTable)
    .values(data)
    .returning();
  return newBullmeterVote;
};
