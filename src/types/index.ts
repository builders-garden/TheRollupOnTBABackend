import type { Address, Hex } from "viem";

export * from "./socket";

export type Participant = {
  socketId: string;
  participantFid: number;
  participantUsername: string;
  avatarUrl: string;
  ready: boolean;
  score: number;
  isCreator?: boolean;
};

export interface GameRoom {
  participants: Map<string, Participant>;
  board: string[][];
  timer: NodeJS.Timeout | null;
  timeRemaining: number;
}

export type Payment = {
  amount: string;
  amountUSDC: string;
  currencyAddress: Address;
  walletAddress: Address;
  txHash: Hex;
};

export type GameOptionDetails = {
  label: string;
  value: string;
  duration: number; // in seconds
  increase: number; // in seconds
};
