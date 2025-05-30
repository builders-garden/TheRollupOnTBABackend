import type { Address, Hex } from "viem";
import type { PaymentStatus } from "./enums";

export * from "./socket";

export interface Player {
  socketId: string;
  fid: number;
  displayName: string;
  username: string;
  avatarUrl: string;
  ready: boolean;
  score: number;
  board: string[][];
}

export interface GameRoom {
  players: Map<number, Player>;
  board: string[][];
  timer: NodeJS.Timeout | null;
  timeRemaining: number;
}

export type Participant = {
  playerId: string;
  playerUsername: string;
  isCreator?: boolean;
};

export type Payment = {
  amount: string;
  amountUSDC: string;
  currencyAddress: Address;
  walletAddress: Address;
  txHash: Hex;
  status: PaymentStatus;
};

export type GameOptionDetails = {
  label: string;
  value: string;
  duration: number; // in seconds
  increase: number; // in seconds
};
