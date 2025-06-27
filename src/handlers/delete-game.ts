import { SocketHandler } from "./socket-handler";
import type { DeleteGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameEndReason, GameResult, GameState } from "@prisma/client";
import { getGameById } from "../lib/prisma/queries";
import { prisma } from "../lib/prisma/client";

export class DeleteGameHandler extends SocketHandler {
  async handle({ gameId, userId }: DeleteGameRequestEvent): Promise<void> {
    console.log(
      `[DELETE GAME] Attempting to delete game: ${gameId} by user: ${userId}`
    );

    try {
      const game = await getGameById(gameId);
      if (!game) {
        console.error(`[DELETE GAME] Game ${gameId} not found`);
        this.socket.emit(ServerToClientSocketEvents.ERROR, {
          code: 404,
          message: "Game not found",
        });
        return;
      }

      // Check if the user is the game creator
      if (game.creator.userId !== userId) {
        console.error(
          `[DELETE GAME] User ${userId} is not the creator of game ${gameId}`
        );
        this.socket.emit(ServerToClientSocketEvents.ERROR, {
          code: 403,
          message: "Only the game creator can delete the game",
        });
        return;
      }

      // Check if the game is in WAITING state (can only delete waiting games)
      if (game.gameState !== GameState.WAITING) {
        console.error(
          `[DELETE GAME] Game ${gameId} is not in WAITING state (current: ${game.gameState})`
        );
        this.socket.emit(ServerToClientSocketEvents.ERROR, {
          code: 400,
          message: "Can only delete games that are waiting for players",
        });
        return;
      }

      // Update the game in the database - set it as ended with GAME_DELETED reason
      await prisma.game.update({
        where: { id: gameId },
        data: {
          gameState: GameState.ENDED,
          gameResult: GameResult.DRAW,
          gameEndReason: GameEndReason.GAME_DELETED,
          endedAt: new Date(),
        },
      });

      console.log(
        `[DELETE GAME] Game ${gameId} successfully deleted by ${userId}`
      );

      // Emit game deleted event to all participants in the game room
      this.emitToGame(gameId, ServerToClientSocketEvents.GAME_DELETED, {
        gameId,
        userId,
        reason: GameEndReason.GAME_DELETED,
      });
    } catch (error) {
      console.error(`[DELETE GAME] Error deleting game ${gameId}:`, error);
      this.socket.emit(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Internal server error while deleting game",
      });
    }
  }
}
