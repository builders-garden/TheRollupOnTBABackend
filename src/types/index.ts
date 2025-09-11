import type { Address, Hex } from "viem";

export * from "./socket";

export type Event = {
  walletAddress: Address;
  username: string;
  profilePicture: string;
};

export type Tip = Event & {
  amount: string;
  amountUSDC: string;
  currencyAddress: Address;
  txHash: Hex;
};

export type Vote = Event & {
  promptId: string;
  isBull: boolean;
  walletAddress: Address;
  txHash: Hex;
};

export type TokenTrade = {
  tokenAddress: Address;
  tokenAmount: string;
  txHash: Hex;
};

// The active plugins in database
export type ActivePlugins = "tips" | "tokens" | "bullmeter";

// The social media platforms in database
export type SocialMedias = "youtube" | "twitch" | "x";

// The social media urls in database
export type SocialMediaUrls = {
  [key in SocialMedias]: string;
};
