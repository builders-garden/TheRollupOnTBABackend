import { and, eq, like, sql } from "drizzle-orm";
import { db } from "../index";
import {
  brandsTable,
  type Brand,
  type CreateBrand,
  type UpdateBrand,
} from "../db.schema";

/**
 * Create a new brand
 * @param brandData - The brand data to create
 * @returns The created brand
 */
export const createBrand = async (brandData: CreateBrand): Promise<Brand> => {
  const [newBrand] = await db.insert(brandsTable).values(brandData).returning();

  return newBrand;
};

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

/**
 * Get a brand by wallet address
 * @param address - The wallet address
 * @returns The brand or null if not found
 */
export const getBrandByAddress = async (
  address: string
): Promise<Brand | null> => {
  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(sql`${brandsTable.walletAddresses} LIKE '%' || ${address} || '%'`)
    .limit(1);

  return brand || null;
};

/**
 * Get all active brands
 * @returns Array of active brands
 */
export const getActiveBrands = async (): Promise<Brand[]> => {
  return await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.isActive, true))
    .orderBy(brandsTable.createdAt);
};

/**
 * Get all brands (active and inactive)
 * @param limit - Optional limit for results
 * @returns Array of brands
 */
export const getAllBrands = async (limit?: number): Promise<Brand[]> => {
  const query = db.select().from(brandsTable).orderBy(brandsTable.createdAt);

  return limit ? await query.limit(limit) : await query;
};

/**
 * Search brands by name
 * @param searchTerm - The search term
 * @param activeOnly - Whether to search only active brands
 * @returns Array of matching brands
 */
export const searchBrandsByName = async (
  searchTerm: string,
  activeOnly = false
): Promise<Brand[]> => {
  const conditions = [like(brandsTable.name, `%${searchTerm}%`)];

  if (activeOnly) {
    conditions.push(eq(brandsTable.isActive, true));
  }

  return await db
    .select()
    .from(brandsTable)
    .where(and(...conditions))
    .orderBy(brandsTable.createdAt);
};

/**
 * Update a brand
 * @param brandId - The brand ID
 * @param updateData - The data to update
 * @returns The updated brand or null if not found
 */
export const updateBrand = async (
  brandId: string,
  updateData: UpdateBrand
): Promise<Brand | null> => {
  const [updatedBrand] = await db
    .update(brandsTable)
    .set({
      ...updateData,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(brandsTable.id, brandId))
    .returning();

  return updatedBrand || null;
};

/**
 * Delete a brand
 * @param brandId - The brand ID
 * @returns Whether the brand was deleted
 */
export const deleteBrand = async (brandId: string): Promise<boolean> => {
  const result = await db
    .delete(brandsTable)
    .where(eq(brandsTable.id, brandId));

  return result.rowsAffected > 0;
};

/**
 * Toggle brand active status
 * @param brandId - The brand ID
 * @returns The updated brand or null if not found
 */
export const toggleBrandActiveStatus = async (
  brandId: string
): Promise<Brand | null> => {
  const brand = await getBrandById(brandId);
  if (!brand) return null;

  return await updateBrand(brandId, { isActive: !brand.isActive });
};
