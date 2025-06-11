import type {
  GameState,
  GameEndReason,
  GameChatContentType,
  GameParticipantStatus,
} from "@prisma/client";
import type { Color, Square } from "chess.js";
import { SocketEvents } from "../enums";
import type { Participant } from "..";

export type CreateGameResponse = {
  gameId: string;
  status: GameState;
  participants: Participant[];
};

export type JoinGameResponse = {
  gameId: string;
  status: GameState;
  participants: Participant[];
};

export type PaymentConfirmedEvent = {
  gameId: string;
  userId: string;
};

export type ParticipantReadyEvent = {
  gameId: string;
  userId: string;
  status: GameParticipantStatus;
};

export type StartGameEvent = {
  gameId: string;
  gameState: GameState;
};

export type MovePieceEvent = {
  gameId: string;
  userId: string;
  move: {
    color: Color;
    from: Square;
    to: Square;
    promotion?: string;
  };
};

export type AcceptGameEndEvent = {
  gameId: string;
  userId: string;
  reason: GameEndReason;
};

export type GameEndedEvent = {
  gameId: string;
  userId: string;
  reason: GameEndReason;
};

export type ParticipantLeftEvent = {
  gameId: string;
  userId: string;
  status: GameParticipantStatus;
};

export type ParticipantJoinedEvent = {
  gameId: string;
  userId: string;
};

export type ErrorEvent = {
  code: number;
  userId?: string;
  message: string;
};

export type MessageReceivedEvent = {
  gameId: string;
  userId: string;
  message: {
    id: string;
    content: string;
    contentType: GameChatContentType;
    createdAt: Date;
    user: {
      fid: number;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
};

export type ServerToClientEvents = {
  [SocketEvents.CREATE_GAME_RESPONSE]: CreateGameResponse;
  [SocketEvents.JOIN_GAME_RESPONSE]: JoinGameResponse;
  [SocketEvents.PAYMENT_CONFIRMED]: PaymentConfirmedEvent;
  [SocketEvents.PARTICIPANT_READY]: ParticipantReadyEvent;
  [SocketEvents.START_GAME]: StartGameEvent;
  [SocketEvents.MOVE_PIECE]: MovePieceEvent;
  [SocketEvents.MESSAGE_RECEIVED]: MessageReceivedEvent;
  [SocketEvents.ACCEPT_GAME_END]: AcceptGameEndEvent;
  [SocketEvents.GAME_ENDED]: GameEndedEvent;
  [SocketEvents.PARTICIPANT_LEFT]: ParticipantLeftEvent;
  [SocketEvents.PARTICIPANT_JOINED]: ParticipantJoinedEvent;
  [SocketEvents.ERROR]: ErrorEvent;
};
