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

/**
 * Add a spectator to a game.
 *
 * This function adds a spectator to a game.
 * It takes a game id and a user id and adds the user as a spectator to the game.
 *
 * @param gameId - The id of the game
 * @param userId - The id of the user to add as a spectator
 * @returns The added spectator
 */
export const addGameSpectator = async (gameId: string, userId: string) => {
	return prisma.gameSpectator.create({
		data: {
			gameId,
			userId,
		},
		include: {
			user: true,
		},
	});
};
