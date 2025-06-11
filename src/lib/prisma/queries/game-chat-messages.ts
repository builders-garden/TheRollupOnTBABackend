import { GameChatContentType } from "@prisma/client";
import { prisma } from "../client";
import type { MessageSentEvent } from "../../../types/socket/client-to-server";

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
export const createGameChatMessage = async ({
  gameId,
  userId,
  message,
}: MessageSentEvent) => {
  if (!gameId || !userId || !message.contentType) return;
  if (message.contentType === GameChatContentType.TIP) {
    if (!message.tip) return;
  } else {
    if (!message.content) return;
  }

  return await prisma.gameChatMessage.create({
    data: {
      gameId,
      userId,
      content: message.content,
      contentType: message.contentType,
      tipId: message.tip?.tipId,
      tipChainId: message.tip?.tipChainId,
      tipTxHash: message.tip?.tipTxHash,
      tipAmount: message.tip?.tipAmount,
    },
    include: {
      user: {
        select: {
          id: true,
          fid: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      gameTip: {
        select: {
          id: true,
          name: true,
          description: true,
          slug: true,
          imageUrl: true,
          category: true,
          price: true,
        },
      },
    },
  });
};
