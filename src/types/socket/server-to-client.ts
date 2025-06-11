import type {
  GameState,
  GameEndReason,
  GameChatContentType,
  GameParticipantStatus,
} from "@prisma/client";
import type { Color, Square } from "chess.js";
import { ServerToClientSocketEvents } from "../enums";
import type { Participant } from "..";

// 1. Game Creation
export type CreateGameResponseEvent = {
  gameId: string;
  status: GameState;
  participants: Participant[];
};

// 2. Game Joining
export type JoinGameResponseEvent = {
  gameId: string;
  status: GameState;
  participants: Participant[];
};

// 2.b Payment Confirmed
export type PaymentConfirmedAckEvent = {
  gameId: string;
  userId: string;
};

// 3. Game Starting
export type ParticipantReadyAckEvent = {
  gameId: string;
  userId: string;
  status: GameParticipantStatus;
};

// 4 Start Game
export type StartGameEvent = {
  gameId: string;
  gameState: GameState;
};

// 5. Game Playing
export type MovePieceAckEvent = {
  gameId: string;
  userId: string;
  move: {
    color: Color;
    from: Square;
    to: Square;
    promotion?: string;
  };
};

// 6. Game Ending: user asked to draw, inform other participant
export type AcceptGameEndEvent = {
  gameId: string;
  userId: string;
  reason: GameEndReason;
};

// 6.b Game Ending: user didnt accept the draw request
export type ResumeGameEvent = {
  gameId: string;
  userId: string;
  status: GameState;
  message: string;
};

// 6. Game Ending: Game ended
export type GameEndedEvent = {
  gameId: string;
  userId: string;
  reason: GameEndReason;
};

// 7. Game paused: Participant left
export type ParticipantLeftEvent = {
  gameId: string;
  userId: string;
  status: GameParticipantStatus;
};

// 7.b Game paused: Participant joined
export type ParticipantJoinedEvent = {
  gameId: string;
  userId: string;
};

// 8. Extras: Messages
export type MessageSentAckEvent = {
  gameId: string;
  userId: string;
  message: {
    id: string;
    contentType: GameChatContentType;
    createdAt: Date;
    content?: string;
    tip?: {
      tipId: string;
      tipChainId: number;
      tipTxHash: string;
      tipAmount: number;
    };
    user: {
      id: string;
      fid: number;
      username: string;
      displayName: string;
      avatarUrl: string | null;
    };
    gameTip?: {
      id: string;
      name: string;
      description: string;
      slug: string;
      imageUrl: string;
      category: string;
      price: number;
    };
  };
};

// 9. Extras: Spectators
export type SpectatorJoinAckEvent = {
  gameId: string;
  userId: string;
};

// 10. Other: Errors
export type ErrorEvent = {
  code: number;
  userId?: string;
  message: string;
};

// 11. Other: Banned
export type BannedEvent = {
  gameId: string;
  userId: string;
  message: string;
};

export type ServerToClientEvents = {
  [ServerToClientSocketEvents.CREATE_GAME_RESPONSE]: CreateGameResponseEvent;
  [ServerToClientSocketEvents.JOIN_GAME_RESPONSE]: JoinGameResponseEvent;
  [ServerToClientSocketEvents.PAYMENT_CONFIRMED_ACK]: PaymentConfirmedAckEvent;
  [ServerToClientSocketEvents.PARTICIPANT_READY_ACK]: ParticipantReadyAckEvent;
  [ServerToClientSocketEvents.START_GAME]: StartGameEvent;
  [ServerToClientSocketEvents.MOVE_PIECE_ACK]: MovePieceAckEvent;
  [ServerToClientSocketEvents.ACCEPT_GAME_END]: AcceptGameEndEvent;
  [ServerToClientSocketEvents.GAME_ENDED]: GameEndedEvent;
  [ServerToClientSocketEvents.RESUME_GAME]: ResumeGameEvent;
  [ServerToClientSocketEvents.PARTICIPANT_LEFT]: ParticipantLeftEvent;
  [ServerToClientSocketEvents.PARTICIPANT_JOINED]: ParticipantJoinedEvent;
  [ServerToClientSocketEvents.MESSAGE_SENT_ACK]: MessageSentAckEvent;
  [ServerToClientSocketEvents.SPECTATOR_JOIN_ACK]: SpectatorJoinAckEvent;
  [ServerToClientSocketEvents.ERROR]: ErrorEvent;
  [ServerToClientSocketEvents.BANNED]: BannedEvent;
};
