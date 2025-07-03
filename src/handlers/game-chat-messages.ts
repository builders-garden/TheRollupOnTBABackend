import { GameState } from "@prisma/client";
import { getUserById } from "../lib/prisma/queries";
import { getGameById } from "../lib/prisma/queries/game";
import { createGameChatMessage } from "../lib/prisma/queries/game-chat-messages";
import type { MessageSentEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class GameChatMessagesHandler extends SocketHandler {
  async handle({ gameId, userId, message }: MessageSentEvent) {
    console.log(
      `[GAME] Participant ${userId} sending message in game ${gameId}`
    );
    const [game, user] = await Promise.all([
      getGameById(gameId),
      getUserById(userId),
    ]);
    if (!game) {
      console.error(`[GAME] Game ${gameId} not found`);
      return;
    }
    if (game.gameState !== GameState.ACTIVE) {
      console.error(`[GAME] Game ${gameId} is not active`);
      return;
    }
    if (!user) {
      console.error(`[GAME] Participant ${userId} not found`);
      return;
    }

    // save message to db
    const newMessage = await createGameChatMessage({
      gameId,
      userId,
      message,
    });
    if (!newMessage) {
      console.error(`[GAME] Failed to create message for game ${gameId}`);
      return;
    }
    console.log(`[GAME] Created message: ${newMessage}`);

    // emit message to all participants
    this.emitToGame(gameId, ServerToClientSocketEvents.MESSAGE_SENT_ACK, {
      gameId,
      userId,
      message: {
        id: newMessage.id,
        content: newMessage.content || "",
        contentType: newMessage.contentType,
        createdAt: newMessage.createdAt,
        user: newMessage.user,
        gameTip: newMessage.gameTip || undefined,
      },
    });
  }
}
