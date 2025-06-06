import type { Move } from "chess.js";
import type { Participant, Payment } from "..";
import type { GameMode, GameOption, GameEndReason } from "@prisma/client";

export type CreateGameRequest = {
  game: {
    mode: GameMode;
    option: GameOption;
    contractId: number;
  };
  participants: Participant[];
  payment: Payment;
};

export type JoinGameRequest = {
  gameId: string;
  participantId: string;
  payment: Payment;
};

export type PaymentConfirmedRequest = {
  gameId: string;
  participantId: string;
  payment: Payment;
};

export type ParticipantReadyRequest = {
  gameId: string;
  participantId: string;
};

export type MovePieceRequest = {
  gameId: string;
  participantId: string;
  move: Move;
};

export type EndGameRequest = {
  gameId: string;
  participantId: string;
  reason: GameEndReason;
};

export type ClientToServerEvents = {
  create_game_request: CreateGameRequest;
  join_game_request: JoinGameRequest;
  payment_confirmed_request: PaymentConfirmedRequest;
  participant_ready_request: ParticipantReadyRequest;
  move_piece_request: MovePieceRequest;
  end_game_request: EndGameRequest;
};
