import type { GameEndReason, GameChatContentType } from "@prisma/client";
import type { Color, Square } from "chess.js";
import { ClientToServerSocketEvents } from "../enums";
import type { Payment } from "..";

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

// dev only, reset chess board
export type ResetGameRequestEvent = {
  gameId: string;
  userId: string;
};

export type ClientToServerEvents = {
  [ClientToServerSocketEvents.JOIN_GAME_REQUEST]: JoinGameRequestEvent;
  [ClientToServerSocketEvents.PAYMENT_CONFIRMED]: PaymentConfirmedEvent;
  [ClientToServerSocketEvents.PARTICIPANT_READY]: ParticipantReadyEvent;
  [ClientToServerSocketEvents.MOVE_PIECE]: MovePieceEvent;
  [ClientToServerSocketEvents.MESSAGE_SENT]: MessageSentEvent;
  [ClientToServerSocketEvents.SPECTATOR_JOIN]: SpectatorJoinEvent;
  [ClientToServerSocketEvents.END_GAME_REQUEST]: EndGameRequestEvent;
  [ClientToServerSocketEvents.ACCEPT_GAME_END_RESPONSE]: AcceptGameEndResponseEvent;
  [ClientToServerSocketEvents.RESET_GAME_REQUEST]: ResetGameRequestEvent;
};
