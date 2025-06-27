import { SocketHandler } from "./socket-handler";
import {
  getGameParticipantsBySocketId,
  updateGameParticipant,
} from "../lib/prisma/queries/game-participants";
import { MatchmakingQueue } from "../lib/matchmaking-queue";
import { ServerToClientSocketEvents } from "../types/enums";
import {
  GameParticipantStatus,
  GameEndReason,
  GameState,
} from "@prisma/client";
import { getGameById } from "../lib/prisma/queries";
import { handleGameEnd } from "../lib/game-end-handler";

// Store disconnect timeouts in memory (gameId+userId as key)
export const disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();

export class DisconnectParticipantHandler extends SocketHandler {
  async handle(): Promise<void> {
    console.log(`[DISCONNECT] Disconnecting participant: ${this.socket.id}`);

    // Remove from matchmaking queue if present
    const matchmakingQueue = MatchmakingQueue.getInstance();
    matchmakingQueue.removeFromQueueBySocketId(this.socket.id);

    // get all game participants by socket id
    const gameParticipants = await getGameParticipantsBySocketId(
      this.socket.id
    );

    if (gameParticipants.length === 0) {
      console.log(
        `[DISCONNECT] No game participant found for socket id: ${this.socket.id}`
      );
      return;
    }

    // initiate game pause for each client
    for (const gameParticipant of gameParticipants) {
      console.log(`[DISCONNECT] Disconnected participant: ${this.socket.id}`);

      if (!gameParticipant.userId) {
        console.log(
          `[DISCONNECT] No userId for participant ${gameParticipant.id}`
        );
        continue;
      }

      // update game participant status to waiting
      await updateGameParticipant(
        gameParticipant.gameId,
        gameParticipant.userId,
        {
          status: GameParticipantStatus.LEFT,
        }
      );

      this.emitToGame(
        gameParticipant.gameId,
        ServerToClientSocketEvents.PARTICIPANT_LEFT,
        {
          gameId: gameParticipant.gameId,
          userId: gameParticipant.userId,
          status: GameParticipantStatus.WAITING,
        }
      );

      // Only set resignation timeout for games that are actually ACTIVE
      // Games in WAITING state should remain open until manually deleted
      const currentGame = await getGameById(gameParticipant.gameId);
      if (currentGame && currentGame.gameState === GameState.ACTIVE) {
        // Set 30s timeout for auto-forfeit only for active games
        const timeoutKey = `${gameParticipant.gameId}:${gameParticipant.userId}`;
        if (disconnectTimeouts.has(timeoutKey)) {
          clearTimeout(disconnectTimeouts.get(timeoutKey));
        }
        const timeout = setTimeout(async () => {
          // End game, opponent wins by default
          if (!gameParticipant.userId) {
            console.log(
              `[DISCONNECT] No userId for participant ${gameParticipant.id}`
            );
            return;
          }

          // Check if game is already ended before processing disconnect timeout
          const currentGame = await getGameById(gameParticipant.gameId);
          if (!currentGame || currentGame.gameState === GameState.ENDED) {
            console.log(
              `[DISCONNECT] Game ${gameParticipant.gameId} already ended. Skipping disconnect timeout.`
            );
            disconnectTimeouts.delete(timeoutKey);
            return;
          }

          const opponent = await this.getOpponent(
            gameParticipant.gameId,
            gameParticipant.userId
          );
          if (opponent) {
            // Since we no longer have color on participant, we'll just use resign reason
            const reason = GameEndReason.WHITE_RESIGNED; // This will be corrected in handleGameEnd based on actual game state
            await handleGameEnd(
              this.io,
              gameParticipant.gameId,
              gameParticipant.userId,
              reason
            );
          }
          disconnectTimeouts.delete(timeoutKey);
        }, 30000);
        disconnectTimeouts.set(timeoutKey, timeout);
      } else {
        console.log(
          `[DISCONNECT] Game ${gameParticipant.gameId} is not active (state: ${currentGame?.gameState}). Not setting resignation timeout.`
        );
      }
    }
  }

  // Helper to get opponent participant
  async getOpponent(gameId: string, userId: string) {
    const game = await getGameById(gameId);
    if (!game) return null;
    const isUserCreator = game.creator.user?.id === userId;
    return isUserCreator ? game.opponent : game.creator;
  }
}
// retrieve game by socket id
// if game is not found or game already ended, return
// else notify participant in the game
