import type { GameChatContentType } from "@prisma/client";
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
export const getGameChatMessages = async (gameId: string) => {
  return prisma.gameChatMessage.findMany({
    where: { gameId },
  });
};

/**
 * Create a game chat message.
 *
 * This function creates a game chat message.
 * It takes a game id, user id, and message.
 *
 * @param gameId - The id of the game
 * @param userId - The id of the user
 * @param message - The message to create
 * @returns The created game chat message
 */
export const createGameChatMessage = async (
  gameId: string,
  userId: string,
  message: {
    content: string;
    contentType: GameChatContentType;
  }
) => {
  if (!gameId || !userId || !message.content || !message.contentType) return;

  const x = await prisma.gameChatMessage.create({
    data: {
      gameId,
      userId,
      content: message.content,
      contentType: message.contentType,
    },
    include: {
      user: {
        select: {
          fid: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
  });
  console.log("x", x);
  return x;
};
