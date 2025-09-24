import { db } from "..";
import { Brand, brandsTable } from "../db.schema";
import { eq } from "drizzle-orm";

/**
 * Get a brand by ID
 * @param brandId - The brand ID
 * @returns The brand or null if not found
 */
export const getBrandById = async (brandId: string): Promise<Brand | null> => {
  const brand = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.id, brandId))
    .limit(1);

  return brand[0] || null;
};
