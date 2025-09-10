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
