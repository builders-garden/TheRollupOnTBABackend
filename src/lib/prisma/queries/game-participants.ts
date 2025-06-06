import { prisma } from "../client";
import type { GameParticipant, Prisma } from "@prisma/client";

/**
 * Get a game participant by their id.
 *
 * This function gets a game participant by their id.
 * It takes an id and returns the game participant if found.
 *
 * @param id - The id of the game participant to get
 * @returns The game participant if found, otherwise null
 */
export const getGameParticipantById = async (
  id: string
): Promise<GameParticipant | null> => {
  if (!id) return null;
  return prisma.gameParticipant.findUnique({
    where: { id },
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
 * @param id - The id of the game participant to update
 * @param gameParticipant - The updates to apply to the game participant
 * @returns The updated game participant
 */
export const updateGameParticipant = async (
  id: string,
  gameParticipant: Prisma.GameParticipantUpdateInput
): Promise<Omit<GameParticipant, "id" | "createdAt" | "updatedAt">> => {
  return prisma.gameParticipant.update({
    where: { id },
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
