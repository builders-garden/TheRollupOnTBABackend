import {
  type Game,
  GameEndReason,
  GameIsWhite,
  GameMode,
  GameOption,
  type GameParticipant,
  GameResult,
  type Prisma,
  type User,
  type UserStatistics,
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

/**
 * Get game result and explanation
 * @param reason - Game end reason
 * @param whiteParticipantUsername - White participant username
 * @param blackParticipantUsername - Black participant username
 * @returns Object containing game result and explanation
 */
export const getGameResultExplained = (
  reason: GameEndReason,
  whiteParticipantUsername?: string,
  blackParticipantUsername?: string
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
 * Get participant by color
 */
export const getParticipantByColor = (
  game: Game & {
    creator: GameParticipant & { user: User | null };
    opponent: (GameParticipant & { user: User | null }) | null;
  },
  color: "w" | "b"
): GameParticipant | null => {
  if (color === "w") {
    return game.isWhite === GameIsWhite.CREATOR ? game.creator : game.opponent;
  }
  return game.isWhite === GameIsWhite.CREATOR ? game.opponent : game.creator;
};

/**
 * Calculate participant stats at the end of a game
 * @param whiteStats - White user statistics
 * @param blackStats - Black user statistics
 * @param gameResult - Game result
 * @param gameWage - Game wage
 * @returns Object containing updated white and black statistics
 */
export const calculateParticipantStats = (
  whiteStats: UserStatistics,
  blackStats: UserStatistics,
  gameResult: GameResult,
  gameWage: number
): {
  whiteStats: Prisma.UserStatisticsUpdateInput;
  blackStats: Prisma.UserStatisticsUpdateInput;
} => {
  let whiteGamesWon = whiteStats.gamesWon;
  let whiteGamesLost = whiteStats.gamesLost;
  let whiteGamesDrawn = whiteStats.gamesDrawn;
  let blackGamesWon = blackStats.gamesWon;
  let blackGamesLost = blackStats.gamesLost;
  let blackGamesDrawn = blackStats.gamesDrawn;
  const whiteGamesPlayed = whiteStats.gamesPlayed + 1;
  const blackGamesPlayed = blackStats.gamesPlayed + 1;
  let whiteWinStreak = whiteStats.winStreak;
  let blackWinStreak = blackStats.winStreak;
  let whiteBestWinStreak = whiteStats.bestWinStreak;
  let blackBestWinStreak = blackStats.bestWinStreak;
  let whiteWageWon = whiteStats.wageWon;
  let blackWageWon = blackStats.wageWon;
  let whiteWageLost = whiteStats.wageLost;
  let blackWageLost = blackStats.wageLost;
  let whiteWageVolumeInUSDC = whiteStats.wageVolumeInUSDC;
  let blackWageVolumeInUSDC = blackStats.wageVolumeInUSDC;
  let whiteWageBiggestInUSDC = whiteStats.biggestWageInUSDC;
  let blackWageBiggestInUSDC = blackStats.biggestWageInUSDC;
  let whiteAverageWageInUSDC = whiteStats.averageWageInUSDC;
  let blackAverageWageInUSDC = blackStats.averageWageInUSDC;
  let whiteTotalProfitAndLossInUSDC = whiteStats.totalProfitAndLossInUSDC;
  let blackTotalProfitAndLossInUSDC = blackStats.totalProfitAndLossInUSDC;
  let whiteRoi = whiteStats.roi;
  let blackRoi = blackStats.roi;

  // update elo k-factor according to fide [32] https://en.wikipedia.org/wiki/Elo_rating_system
  let whiteEloKFactor = whiteStats.eloKFactor;
  let blackEloKFactor = blackStats.eloKFactor;
  if (whiteGamesPlayed > 30) {
    if (whiteStats.eloRating < 2400) {
      whiteEloKFactor = 20;
    } else {
      whiteEloKFactor = 10;
    }
  }
  if (blackGamesPlayed > 30) {
    if (blackStats.eloRating < 2400) {
      blackEloKFactor = 20;
    } else {
      blackEloKFactor = 10;
    }
  }

  switch (gameResult) {
    case GameResult.BLACK_WON:
      whiteGamesLost += 1;
      blackGamesWon += 1;
      // update win streak
      whiteWinStreak = 0;
      blackWinStreak += 1;
      if (blackWinStreak > blackBestWinStreak)
        blackBestWinStreak = blackWinStreak;
      // update wage
      whiteWageLost += 1;
      blackWageWon += 1;
      whiteWageVolumeInUSDC += gameWage;
      blackWageVolumeInUSDC += gameWage;
      whiteAverageWageInUSDC = whiteWageVolumeInUSDC / whiteGamesPlayed;
      blackAverageWageInUSDC = blackWageVolumeInUSDC / blackGamesPlayed;
      if (gameWage > whiteWageBiggestInUSDC) whiteWageBiggestInUSDC = gameWage;
      if (gameWage > blackWageBiggestInUSDC) blackWageBiggestInUSDC = gameWage;
      // update roi
      whiteTotalProfitAndLossInUSDC += gameWage; // TODO subtract fee
      blackTotalProfitAndLossInUSDC -= gameWage; // TODO subtract fee
      whiteRoi = whiteTotalProfitAndLossInUSDC / whiteWageVolumeInUSDC;
      blackRoi = blackTotalProfitAndLossInUSDC / blackWageVolumeInUSDC;
      break;
    case GameResult.DRAW:
      whiteGamesDrawn += 1;
      blackGamesDrawn += 1;
      // do not update win streak
      // do not update wage
      break;
    case GameResult.WHITE_WON:
      whiteGamesWon += 1;
      blackGamesLost += 1;
      // update win streak
      blackWinStreak = 0;
      whiteWinStreak += 1;
      if (whiteWinStreak > whiteBestWinStreak)
        whiteBestWinStreak = whiteWinStreak;
      // update wage
      whiteWageWon += 1;
      blackWageLost += 1;
      whiteWageVolumeInUSDC += gameWage;
      blackWageVolumeInUSDC += gameWage;
      whiteAverageWageInUSDC = whiteWageVolumeInUSDC / whiteGamesPlayed;
      blackAverageWageInUSDC = blackWageVolumeInUSDC / blackGamesPlayed;
      if (gameWage > whiteWageBiggestInUSDC) whiteWageBiggestInUSDC = gameWage;
      if (gameWage > blackWageBiggestInUSDC) blackWageBiggestInUSDC = gameWage;
      // update roi
      whiteTotalProfitAndLossInUSDC += gameWage; // TODO subtract fee
      blackTotalProfitAndLossInUSDC -= gameWage; // TODO subtract fee
      whiteRoi = whiteTotalProfitAndLossInUSDC / whiteWageVolumeInUSDC;
      blackRoi = blackTotalProfitAndLossInUSDC / blackWageVolumeInUSDC;

      break;
  }
  const whiteWinRate = whiteGamesWon / whiteGamesPlayed;
  const blackWinRate = blackGamesWon / blackGamesPlayed;

  return {
    whiteStats: {
      eloKFactor: whiteEloKFactor,
      gamesWon: whiteGamesWon,
      gamesLost: whiteGamesLost,
      gamesDrawn: whiteGamesDrawn,
      gamesPlayed: whiteGamesPlayed,
      gamesWinRate: whiteWinRate,
      winStreak: whiteWinStreak,
      bestWinStreak: whiteBestWinStreak,
      wageWon: whiteWageWon,
      wageLost: whiteWageLost,
      wageVolumeInUSDC: whiteWageVolumeInUSDC,
      biggestWageInUSDC: whiteWageBiggestInUSDC,
      averageWageInUSDC: whiteAverageWageInUSDC,
      totalProfitAndLossInUSDC: whiteTotalProfitAndLossInUSDC,
      roi: whiteRoi,
    },
    blackStats: {
      eloKFactor: blackEloKFactor,
      gamesWon: blackGamesWon,
      gamesLost: blackGamesLost,
      gamesDrawn: blackGamesDrawn,
      gamesPlayed: blackGamesPlayed,
      gamesWinRate: blackWinRate,
      winStreak: blackWinStreak,
      bestWinStreak: blackBestWinStreak,
      wageWon: blackWageWon,
      wageLost: blackWageLost,
      wageVolumeInUSDC: blackWageVolumeInUSDC,
      biggestWageInUSDC: blackWageBiggestInUSDC,
      averageWageInUSDC: blackAverageWageInUSDC,
      totalProfitAndLossInUSDC: blackTotalProfitAndLossInUSDC,
      roi: blackRoi,
    },
  };
};
