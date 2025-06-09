import type { GameState, GameEndReason } from "@prisma/client";
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
  participantId: string;
};

export type ParticipantReadyEvent = {
  gameId: string;
  participantId: string;
};

export type StartGameEvent = {
  gameId: string;
  participantId: string;
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
  participantId: string;
  reason: GameEndReason;
};

export type GameEndedEvent = {
  gameId: string;
  participantId: string;
  reason: GameEndReason;
};

export type ParticipantLeftEvent = {
  gameId: string;
  participantId: string;
};

export type ParticipantJoinedEvent = {
  gameId: string;
  participantId: string;
};

export type SendMessageEvent = {
  gameId: string;
  participantId: string;
  message: string;
};

export type ServerToClientEvents = {
  [SocketEvents.CREATE_GAME_RESPONSE]: CreateGameResponse;
  [SocketEvents.JOIN_GAME_RESPONSE]: JoinGameResponse;
  [SocketEvents.PAYMENT_CONFIRMED]: PaymentConfirmedEvent;
  [SocketEvents.PARTICIPANT_READY]: ParticipantReadyEvent;
  [SocketEvents.START_GAME]: StartGameEvent;
  [SocketEvents.MOVE_PIECE]: MovePieceEvent;
  [SocketEvents.SEND_MESSAGE]: SendMessageEvent;
  [SocketEvents.ACCEPT_GAME_END]: AcceptGameEndEvent;
  [SocketEvents.GAME_ENDED]: GameEndedEvent;
  [SocketEvents.PARTICIPANT_LEFT]: ParticipantLeftEvent;
  [SocketEvents.PARTICIPANT_JOINED]: ParticipantJoinedEvent;
  [SocketEvents.ERROR]: ErrorEvent;
};
