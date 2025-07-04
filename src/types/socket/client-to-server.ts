import type {
  GameChatContentType,
  GameEndReason,
  GameMode,
  GameOption,
} from "@prisma/client";
import type { Color, Square } from "chess.js";
import type { Payment } from "..";
import { ClientToServerSocketEvents } from "../enums";

// 1. Game Creation (handled in next.js backend)

// 2. Game Joining
export type JoinGameRequestEvent = {
  gameId: string;
  userId: string;
  payment: Payment;
};

// 2.b Payment Confirmed
export type PaymentConfirmedEvent = {
  gameId: string;
  userId: string;
  payment: Payment;
};

// 3. Game Starting
export type ParticipantReadyEvent = {
  gameId: string;
  userId: string;
};

// 3.b Game Starting: Participant not ready (revoke ready state)
export type ParticipantNotReadyEvent = {
  gameId: string;
  userId: string;
};

// 5. Game Playing
export type MovePieceEvent = {
  gameId: string;
  userId: string;
  move: {
    color: Color;
    from: Square;
    to: Square;
    fen: string;
    promotion?: string;
  };
};

// 6. Game Ending: Resign or Draw request
export type EndGameRequestEvent = {
  gameId: string;
  userId: string;
  reason: GameEndReason;
};

// 6.b Game Ending: Accept game end response
export type AcceptGameEndResponseEvent = {
  gameId: string;
  userId: string;
  accepted: boolean;
};

// 7. Game Deletion: Delete game (creator only)
export type DeleteGameRequestEvent = {
  gameId: string;
  userId: string;
};

// 8. Extras: Messages
export type MessageSentEvent = {
  gameId: string;
  userId: string;
  message: {
    contentType: GameChatContentType;
    content?: string;
    tip?: {
      tipId: string;
      tipChainId: number;
      tipTxHash: string;
      tipAmount: number;
    };
  };
};

// 9. Extras: Spectators
export type SpectatorJoinEvent = {
  gameId: string;
  userId: string;
};

// matchmaking events
export type JoinMatchmakingQueueEvent = {
  userId: string;
  userFid: number;
  username: string;
  gameMode: GameMode;
  gameOption: GameOption;
  wageAmount: string; // Bet amount in USDC (as string to match Prisma decimal)
  fromBroadcast: boolean;
};

export type LeaveMatchmakingQueueEvent = {
  userId: string;
};

export type ClientToServerEvents = {
  [ClientToServerSocketEvents.JOIN_GAME_REQUEST]: JoinGameRequestEvent;
  [ClientToServerSocketEvents.PAYMENT_CONFIRMED]: PaymentConfirmedEvent;
  [ClientToServerSocketEvents.PARTICIPANT_READY]: ParticipantReadyEvent;
  [ClientToServerSocketEvents.PARTICIPANT_NOT_READY]: ParticipantNotReadyEvent;
  [ClientToServerSocketEvents.MOVE_PIECE]: MovePieceEvent;
  [ClientToServerSocketEvents.MESSAGE_SENT]: MessageSentEvent;
  [ClientToServerSocketEvents.SPECTATOR_JOIN]: SpectatorJoinEvent;
  [ClientToServerSocketEvents.END_GAME_REQUEST]: EndGameRequestEvent;
  [ClientToServerSocketEvents.ACCEPT_GAME_END_RESPONSE]: AcceptGameEndResponseEvent;
  [ClientToServerSocketEvents.DELETE_GAME_REQUEST]: DeleteGameRequestEvent;
  [ClientToServerSocketEvents.JOIN_MATCHMAKING_QUEUE]: JoinMatchmakingQueueEvent;
  [ClientToServerSocketEvents.LEAVE_MATCHMAKING_QUEUE]: LeaveMatchmakingQueueEvent;
};
