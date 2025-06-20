import {
  GameEndReason,
  GameMode,
  GameOption,
  GameResult,
  GameIsWhite,
  GameParticipant,
  Game,
} from "@prisma/client";
import { GAME_OPTIONS } from "./constants";

export const getGameOptionTime = (mode: GameMode, option: GameOption) => {
  try {
    const data = GAME_OPTIONS[mode]?.[option];
    if (!data) {
      throw new Error(
        `Duration not found for mode: ${mode} and option: ${option}`
      );
    }

    return { duration: data.duration, increase: data.increase };
  } catch (error) {
    console.error("Error getting game option time", error);
    const defaultOption = GAME_OPTIONS[GameMode.RAPID][GameOption.RAPID_5];
    return {
      duration: defaultOption?.duration ?? 300,
      increase: defaultOption?.increase ?? 0,
    };
  }
};

export const getGameEndReason = (
  reason: GameEndReason,
  whiteParticipantUsername: string,
  blackParticipantUsername: string
): {
  gameResult: GameResult;
  gameResultExplanation: string;
} => {
  let gameResult: GameResult | null = null;
  let gameResultExplanation: string | null = null;
  switch (reason) {
    case GameEndReason.WHITE_CHECKMATE:
      gameResult = GameResult.WHITE_WON;
      gameResultExplanation = `${whiteParticipantUsername} won`;
      break;
    case GameEndReason.BLACK_CHECKMATE:
      gameResult = GameResult.BLACK_WON;
      gameResultExplanation = `${blackParticipantUsername} won`;
      break;
    case GameEndReason.WHITE_RESIGNED:
      gameResult = GameResult.BLACK_WON;
      gameResultExplanation = `${blackParticipantUsername} won, ${whiteParticipantUsername} resigned`;
      break;
    case GameEndReason.BLACK_RESIGNED:
      gameResult = GameResult.WHITE_WON;
      gameResultExplanation = `${whiteParticipantUsername} won, ${blackParticipantUsername} resigned`;
      break;
    case GameEndReason.WHITE_REQUESTED_DRAW:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${whiteParticipantUsername} requested`;
      break;
    case GameEndReason.BLACK_REQUESTED_DRAW:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${blackParticipantUsername} requested`;
      break;
    case GameEndReason.WHITE_STALEMATE:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${whiteParticipantUsername} stalemate`;
      break;
    case GameEndReason.BLACK_STALEMATE:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${blackParticipantUsername} stalemate`;
      break;
    case GameEndReason.WHITE_INSUFFICIENT_MATERIAL:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${whiteParticipantUsername} insufficient material`;
      break;
    case GameEndReason.BLACK_INSUFFICIENT_MATERIAL:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${blackParticipantUsername} insufficient material`;
      break;
    case GameEndReason.WHITE_THREEFOLD_REPETITION:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${whiteParticipantUsername} threefold repetition`;
      break;
    case GameEndReason.BLACK_THREEFOLD_REPETITION:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${blackParticipantUsername} threefold repetition`;
      break;
    case GameEndReason.WHITE_FIFTY_MOVE_RULE:
      gameResult = GameResult.DRAW;
      gameResultExplanation = `Draw, ${whiteParticipantUsername} fifty move rule`;
      break;
    case GameEndReason.WHITE_TIMEOUT:
      gameResult = GameResult.BLACK_WON;
      gameResultExplanation = `${blackParticipantUsername} won, ${whiteParticipantUsername} timeout`;
      break;
    case GameEndReason.BLACK_TIMEOUT:
      gameResult = GameResult.WHITE_WON;
      gameResultExplanation = `${whiteParticipantUsername} won, ${blackParticipantUsername} timeout`;
      break;
    default:
      gameResult = GameResult.DRAW;
      gameResultExplanation = "Draw";
      break;
  }

  return { gameResult, gameResultExplanation };
};

/**
 * Determine if a participant is white based on game configuration
 */
export const isParticipantWhite = (
  game: Game,
  participantId: string
): boolean => {
  if (game.isWhite === GameIsWhite.CREATOR) {
    return game.creatorId === participantId;
  } else if (game.isWhite === GameIsWhite.OPPONENT) {
    return game.opponentId === participantId;
  }
  return false; // Default fallback
};

/**
 * Determine if a participant is the creator
 */
export const isParticipantCreator = (
  game: Game,
  participantId: string
): boolean => {
  return game.creatorId === participantId;
};

/**
 * Get participant color as string
 */
export const getParticipantColor = (
  game: Game,
  participantId: string
): "w" | "b" | null => {
  if (!game.isWhite) return null;

  if (game.isWhite === GameIsWhite.CREATOR) {
    return game.creatorId === participantId ? "w" : "b";
  } else if (game.isWhite === GameIsWhite.OPPONENT) {
    return game.opponentId === participantId ? "w" : "b";
  }
  return null;
};

/**
 * Get white participant from game
 */
export const getWhiteParticipant = (
  game: Game & { participants: GameParticipant[] }
): GameParticipant | null => {
  if (!game.isWhite) return null;

  const whiteParticipantId =
    game.isWhite === GameIsWhite.CREATOR ? game.creatorId : game.opponentId;

  return game.participants.find((p) => p.id === whiteParticipantId) || null;
};

/**
 * Get black participant from game
 */
export const getBlackParticipant = (
  game: Game & { participants: GameParticipant[] }
): GameParticipant | null => {
  if (!game.isWhite) return null;

  const blackParticipantId =
    game.isWhite === GameIsWhite.CREATOR ? game.opponentId : game.creatorId;

  return game.participants.find((p) => p.id === blackParticipantId) || null;
};

/**
 * Get participant by color
 */
export const getParticipantByColor = (
  game: Game & { participants: GameParticipant[] },
  color: "w" | "b"
): GameParticipant | null => {
  return color === "w" ? getWhiteParticipant(game) : getBlackParticipant(game);
};
