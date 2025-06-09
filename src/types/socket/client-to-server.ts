import type {
  GameMode,
  GameOption,
  GameEndReason,
  GameChatContentType,
} from "@prisma/client";
import type { Color, Square } from "chess.js";
import { SocketEvents } from "../enums";
import type { Participant, Payment } from "..";

export type CreateGameRequest = {
  game: {
    mode: GameMode;
    option: GameOption;
    contractId?: string;
  };
  participants: Participant[];
  payment: Payment;
};

export type JoinGameRequest = {
  gameId: string;
  userId: string;
  payment: Payment;
};

export type PaymentConfirmedRequest = {
  gameId: string;
  userId: string;
  payment: Payment;
};

export type ParticipantReadyRequest = {
  gameId: string;
  userId: string;
};

export type MovePieceRequest = {
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

export type MessageSendRequest = {
  gameId: string;
  userId: string;
  message: {
    content: string;
    contentType: GameChatContentType;
  };
};

export type EndGameRequest = {
  gameId: string;
  userId: string;
  reason: GameEndReason;
};

export type ClientToServerEvents = {
  [SocketEvents.CREATE_GAME_REQUEST]: CreateGameRequest;
  [SocketEvents.JOIN_GAME_REQUEST]: JoinGameRequest;
  [SocketEvents.PAYMENT_CONFIRMED_REQUEST]: PaymentConfirmedRequest;
  [SocketEvents.PARTICIPANT_READY_REQUEST]: ParticipantReadyRequest;
  [SocketEvents.MOVE_PIECE_REQUEST]: MovePieceRequest;
  [SocketEvents.MESSAGE_SEND]: MessageSendRequest;
  [SocketEvents.END_GAME_REQUEST]: EndGameRequest;
};
