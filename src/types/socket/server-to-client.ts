import type { Move } from "chess.js";
import type { Participant } from "..";
import type { GameState, GameEndReason } from "@prisma/client";

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
  participantId: string;
  move: Move;
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

export type ServerToClientEvents = {
  create_game_response: CreateGameResponse;
  join_game_response: JoinGameResponse;
  payment_confirmed: PaymentConfirmedEvent;
  participant_ready: ParticipantReadyEvent;
  start_game: StartGameEvent;
  move_piece: MovePieceEvent;
  accept_game_end: AcceptGameEndEvent;
  game_ended: GameEndedEvent;
  participant_left: ParticipantLeftEvent;
  participant_joined: ParticipantJoinedEvent;
};
