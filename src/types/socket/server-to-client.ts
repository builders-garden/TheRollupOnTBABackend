import type {
  GameState,
  GameEndReason,
  GameChatContentType,
  GameParticipantStatus,
} from "@prisma/client";
import type { Color, Square } from "chess.js";
import { ServerToClientSocketEvents } from "../enums";
import type { Participant } from "..";

// 1. Game Creation (done on nextjs backend)

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

// 5.b Game Playing: Move piece error
export type MovePieceErrorEvent = {
  gameId: string;
  userId: string;
  error: string;
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
  ratingChanges?: {
    whitePlayer: {
      userId: string;
      oldRating: number;
      newRating: number;
      change: number;
    };
    blackPlayer: {
      userId: string;
      oldRating: number;
      newRating: number;
      change: number;
    };
  };
  payoutInfo?: {
    betAmount: number; // in USDC
    winnerId: string | null; // null for draws
    winnerPayout: number; // in USDC
  };
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

// 12. Other: Reset game (dev only)
export type ResetGameEvent = {
  gameId: string;
  userId: string;
};

// 13. Timer: Timer update
export type TimerUpdateEvent = {
  gameId: string;
  whiteTimeLeft: number;
  blackTimeLeft: number;
  activeColor: "w" | "b" | null;
  lastMoveAt: number;
};

// 14. Timer: Timer expired
export type TimerExpiredEvent = {
  gameId: string;
  userId: string;
  color: "w" | "b";
};

// 15. Matchmaking: Queue status update
export type QueueStatusUpdateEvent = {
  playersInQueue: number;
  estimatedWaitTime: number;
  position: number;
};

// 16. Matchmaking: Match found
export type MatchFoundEvent = {
  gameId: string;
  opponent: {
    userId: string;
    username: string;
    userFid: number;
    avatarUrl: string | null; // Profile picture URL
  };
  finalWageAmount: string; // The minimum bet amount agreed upon
  playerRole?: "creator" | "opponent"; // Role in the smart contract flow
  isMatchmaking?: boolean; // Whether this is a matchmaking game (vs friend game)
  isZeroBet?: boolean; // Whether this is a zero-bet game (no payment required)
  gameState?: string; // Game state for zero-bet games
};

// 17. Matchmaking: Queue joined
export type QueueJoinedEvent = {
  playersInQueue: number;
  estimatedWaitTime: number;
  position: number;
};

// 18. Matchmaking: Queue left
export type QueueLeftEvent = {
  success: boolean;
};

export type ServerToClientEvents = {
  [ServerToClientSocketEvents.JOIN_GAME_RESPONSE]: JoinGameResponseEvent;
  [ServerToClientSocketEvents.PAYMENT_CONFIRMED_ACK]: PaymentConfirmedAckEvent;
  [ServerToClientSocketEvents.PARTICIPANT_READY_ACK]: ParticipantReadyAckEvent;
  [ServerToClientSocketEvents.START_GAME]: StartGameEvent;
  [ServerToClientSocketEvents.MOVE_PIECE_ACK]: MovePieceAckEvent;
  [ServerToClientSocketEvents.MOVE_PIECE_ERROR]: MovePieceErrorEvent;
  [ServerToClientSocketEvents.ACCEPT_GAME_END]: AcceptGameEndEvent;
  [ServerToClientSocketEvents.GAME_ENDED]: GameEndedEvent;
  [ServerToClientSocketEvents.RESUME_GAME]: ResumeGameEvent;
  [ServerToClientSocketEvents.PARTICIPANT_LEFT]: ParticipantLeftEvent;
  [ServerToClientSocketEvents.PARTICIPANT_JOINED]: ParticipantJoinedEvent;
  [ServerToClientSocketEvents.MESSAGE_SENT_ACK]: MessageSentAckEvent;
  [ServerToClientSocketEvents.SPECTATOR_JOIN_ACK]: SpectatorJoinAckEvent;
  [ServerToClientSocketEvents.TIMER_UPDATE]: TimerUpdateEvent;
  [ServerToClientSocketEvents.TIMER_EXPIRED]: TimerExpiredEvent;
  [ServerToClientSocketEvents.QUEUE_STATUS_UPDATE]: QueueStatusUpdateEvent;
  [ServerToClientSocketEvents.MATCH_FOUND]: MatchFoundEvent;
  [ServerToClientSocketEvents.QUEUE_JOINED]: QueueJoinedEvent;
  [ServerToClientSocketEvents.QUEUE_LEFT]: QueueLeftEvent;
  [ServerToClientSocketEvents.ERROR]: ErrorEvent;
  [ServerToClientSocketEvents.BANNED]: BannedEvent;
  [ServerToClientSocketEvents.RESET_GAME]: ResetGameEvent;
};
