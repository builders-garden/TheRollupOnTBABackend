import { prisma } from "../client";

/**
 * Get all spectators for a game.
 *
 * This function gets all spectators for a game.
 * It takes a game id and returns all spectators for that game.
 *
 * @param gameId - The id of the game
 * @returns All spectators for the game
 */
export const getGameSpectators = async (gameId: string) => {
  return prisma.gameSpectator.findMany({
    where: { gameId },
  });
};
