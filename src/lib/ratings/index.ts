import { GameResult } from "@prisma/client";
import { calculateEloRating } from "./elo";
import type { GameParticipant } from "../../types/database";
import { updateUserStatistics } from "../prisma/queries/user-statistics";

export const updateRatings = async ({
  gameId,
  whiteUser,
  blackUser,
  gameResult,
}: {
  gameId: string;
  whiteUser: GameParticipant;
  blackUser: GameParticipant;
  gameResult: GameResult;
}) => {
  if (!whiteUser.user?.statistics || !blackUser.user?.statistics) {
    console.error(
      `[RATINGS] User statistics not found for participants in game ${gameId}`
    );
    return;
  }
  // update elo rating
  const outcomeScore =
    gameResult === GameResult.DRAW
      ? 0.5
      : gameResult === GameResult.WHITE_WON
      ? 1
      : 0;
  const { newWhiteEloRating, newBlackEloRating } = calculateEloRating({
    whiteUserRating: whiteUser.user.statistics.eloRating,
    whiteUserKFactor: whiteUser.user.statistics.eloKFactor,
    blackUserRating: blackUser.user.statistics.eloRating,
    blackUserKFactor: blackUser.user.statistics.eloKFactor,
    outcomeScore,
  });

  // update user statistics
  await Promise.all([
    updateUserStatistics(whiteUser.user.id, {
      eloRating: newWhiteEloRating,
    }),
    updateUserStatistics(blackUser.user.id, {
      eloRating: newBlackEloRating,
    }),
  ]);

  console.log(
    `[GAME END] Updated ratings for game ${gameId} - White: ${newWhiteEloRating} -> ${whiteUser.user.statistics.eloRating} | Black: ${newBlackEloRating} -> ${blackUser.user.statistics.eloRating}`
  );
};
