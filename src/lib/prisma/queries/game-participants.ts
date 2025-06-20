import { prisma } from "../client";
import type { GameParticipant, Prisma } from "@prisma/client";

/**
 * Get a game participant by their id.
 *
 * This function gets a game participant by their id.
 * It takes an id and returns the game participant if found.
 *
 * @param gameId - The id of the game
 * @param userId - The id of the user
 * @returns The game participant if found, otherwise null
 */
export const getGameParticipant = async (gameId: string, userId: string) => {
  if (!userId || !gameId) return null;
  return prisma.gameParticipant.findFirst({
    where: { userId, gameId },
    include: {
      user: true,
      game: true,
    },
  });
};

/**
 * Get all game participants by socket id.
 *
 * This function gets all game participants by socket id.
 * It takes a socket id and returns the game participants if found.
 *
 * @param socketId - The id of the socket
 * @returns The game participants if found, otherwise null
 */
export const getGameParticipantsBySocketId = async (
  socketId: string
): Promise<GameParticipant[]> => {
  return prisma.gameParticipant.findMany({
    where: { socketId },
    include: {
      user: true,
      game: true,
    },
  });
};

/**
 * Update a game participant.
 *
 * This function updates a game participant.
 * It takes an id and a set of updates to apply to the game participant.
 *
 * @param gameId - The id of the game
 * @param userId - The id of the user
 * @param gameParticipant - The updates to apply to the game participant
 * @returns The updated game participant
 */
export const updateGameParticipant = async (
  gameId: string,
  userId: string,
  gameParticipant: Prisma.GameParticipantUpdateInput
) => {
  return prisma.gameParticipant.updateMany({
    where: { userId, gameId },
    data: gameParticipant,
  });
};

/**
 * Create a game participant.
 *
 * This function creates a game participant.
 * It takes a game participant and returns the created game participant.
 *
 * @param gameParticipant - The game participant to create
 * @returns The created game participant
 */
export const createGameParticipant = async (
  gameParticipant: Prisma.GameParticipantCreateInput
): Promise<Omit<GameParticipant, "id" | "createdAt" | "updatedAt">> => {
  return prisma.gameParticipant.create({
    data: gameParticipant,
  });
};
