import { type MiniAppNotificationDetails } from "@farcaster/miniapp-core";
import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  numeric,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { ulid } from "ulid";
import { Address, Hex } from "viem";
import { ActivePlugins, SocialMediaUrls } from "../../types";

/**
 * Brands table
 */
export const brandsTable = sqliteTable("brands", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  name: text("name"),
  logoUrl: text("logo_url"),
  description: text("description"),
  streamTitle: text("stream_title"),
  youtubeLiveUrl: text("youtube_live_url"),
  activePlugins: text("active_plugins", { mode: "json" }).$type<
    ActivePlugins[]
  >(),
  websiteUrl: text("website_url"),
  socialMediaUrls: text("social_media_urls", {
    mode: "json",
  })
    .$type<SocialMediaUrls>()
    .default({ youtube: "", twitch: "", x: "" }),
  walletAddresses: text("wallet_addresses", { mode: "json" })
    .$type<Address[]>()
    .notNull(),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Brand = typeof brandsTable.$inferSelect;
export type CreateBrand = typeof brandsTable.$inferInsert;
export type UpdateBrand = Partial<CreateBrand>;

/**
 * Bull Meters table
 */
export const bullMetersTable = sqliteTable(
  "bull_meters",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => ulid()),
    brandId: text("brand_id")
      .notNull()
      .references(() => brandsTable.id, { onDelete: "cascade" }),
    prompt: text("prompt").default("").notNull(),
    pollId: text("poll_id").$type<Hex>().default("0x").notNull(),
    votePrice: numeric("vote_price"),
    duration: integer("duration"),
    payoutAddresses: text("payout_addresses", { mode: "json" }).$type<
      Address[]
    >(),
    totalYesVotes: integer("total_yes_votes"),
    totalNoVotes: integer("total_no_votes"),
    deadline: integer("deadline"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("idx_bull_meters_brand_id").on(t.brandId)]
);

export type BullMeter = typeof bullMetersTable.$inferSelect;
export type CreateBullMeter = typeof bullMetersTable.$inferInsert;
export type UpdateBullMeter = Partial<CreateBullMeter>;

/**
 * Tips table
 */
export const tipsTable = sqliteTable("tips", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brandsTable.id, { onDelete: "cascade" }),
  payoutAddress: text("payout_address"),
  payoutBaseName: text("payout_base_name"),
  payoutEnsName: text("payout_ens_name"),
  amounts: text("amounts"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Tip = typeof tipsTable.$inferSelect;
export type CreateTip = typeof tipsTable.$inferInsert;
export type UpdateTip = Partial<CreateTip>;

/**
 * Featured Tokens table
 */
export const featuredTokensTable = sqliteTable("featured_tokens", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => ulid()),
  brandId: text("brand_id")
    .notNull()
    .references(() => brandsTable.id, { onDelete: "cascade" }),
  name: text("name"),
  symbol: text("symbol"),
  decimals: integer("decimals"),
  chainId: integer("chain_id"),
  chainLogoUrl: text("chain_logo_url"),
  address: text("address"),
  logoUrl: text("logo_url"),
  description: text("description"),
  externalUrl: text("external_url"),
  isActive: integer("is_active", { mode: "boolean" }).default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export type FeaturedToken = typeof featuredTokensTable.$inferSelect;
export type CreateFeaturedToken = typeof featuredTokensTable.$inferInsert;
export type UpdateFeaturedToken = Partial<CreateFeaturedToken>;

/**
 * Farcaster User table
 */
export const userTable = sqliteTable(
  "user",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => ulid()),
    avatarUrl: text("avatar_url"),
    username: text("username"),
    // Farcaster
    farcasterFid: integer("farcaster_fid"),
    farcasterUsername: text("farcaster_username"),
    farcasterDisplayName: text("farcaster_display_name"),
    farcasterAvatarUrl: text("farcaster_avatar_url"),
    farcasterNotificationDetails: text("farcaster_notification_details", {
      mode: "json",
    }).$type<MiniAppNotificationDetails | null>(),
    farcasterWallets: text("farcaster_wallets", { mode: "json" }).$type<
      Address[]
    >(),
    farcasterReferrerFid: integer("farcaster_referrer_fid"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("user_farcaster_fid_unique").on(t.farcasterFid)]
);

export type User = typeof userTable.$inferSelect;
export type CreateFarcasterUser = typeof userTable.$inferInsert;
export type UpdateFarcasterUser = Partial<CreateFarcasterUser>;

/**
 * Wallet table
 */
export const walletTable = sqliteTable(
  "wallet",
  {
    address: text("address", { mode: "json" }).$type<Address>().primaryKey(),
    ensName: text("ens_name"),
    baseName: text("base_name"),
    ensAvatarUrl: text("ens_avatar_url"),
    baseAvatarUrl: text("base_avatar_url"),
    userId: text("user_id")
      .notNull()
      .references(() => userTable.id, { onDelete: "cascade" }),
    isPrimary: integer("is_primary", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [index("idx_wallet_user_id").on(t.userId)]
);

export type Wallet = typeof walletTable.$inferSelect;
export type CreateWallet = typeof walletTable.$inferInsert;
export type UpdateWallet = Partial<CreateWallet>;

// relations

export const brandsRelations = relations(brandsTable, ({ many }) => ({
  bullMeters: many(bullMetersTable),
  tips: many(tipsTable),
  featuredTokens: many(featuredTokensTable),
}));

export const bullMetersRelations = relations(bullMetersTable, ({ one }) => ({
  brand: one(brandsTable, {
    fields: [bullMetersTable.brandId],
    references: [brandsTable.id],
  }),
}));

export const tipsRelations = relations(tipsTable, ({ one }) => ({
  brand: one(brandsTable, {
    fields: [tipsTable.brandId],
    references: [brandsTable.id],
  }),
}));

export const featuredTokensRelations = relations(
  featuredTokensTable,
  ({ one }) => ({
    brand: one(brandsTable, {
      fields: [featuredTokensTable.brandId],
      references: [brandsTable.id],
    }),
  })
);

export const userRelations = relations(userTable, ({ many }) => ({
  wallets: many(walletTable),
}));

export const walletRelations = relations(walletTable, ({ one }) => ({
  user: one(userTable, {
    fields: [walletTable.userId],
    references: [userTable.id],
  }),
}));
