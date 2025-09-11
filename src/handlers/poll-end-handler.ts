import type { Server } from "socket.io";
import { ServerToClientSocketEvents } from "../types/enums";
import { endGameIfNotEnded, getGameById } from "./prisma/queries";
import {
  finalizeTimerValues,
  getUserIdByColor,
} from "./prisma/queries/timer-persistence";
import { ChessTimerManager } from "./timer-manager";

/**
 * Central handler for all game ending scenarios
 * Ensures timers are properly stopped and cleaned up
 */
export async function handleGameEnd({
  io,
  pollId,
  userId,
}: {
  io: Server;
  pollId: string;
  userId?: string;
}): Promise<void> {
  const chessTimerManager = ChessTimerManager.getInstance();

  try {
    console.log(`[GAME END] Processing game end for ${pollId}.`);

    // 1. Get current timer state before stopping
    const timer = chessTimerManager.getTimer(pollId);

    // 2. Stop the server timer immediately
    const timerStopped = chessTimerManager.stopTimer(pollId);
    console.log(`[GAME END] Timer stopped for game ${pollId}: ${timerStopped}`);

    // 3. Check if game already ended
    const game = await getGameById(pollId);
    if (!game) {
      console.error(`[GAME END] Game ${pollId} not found`);
      return;
    }

    // Prevent multiple game endings
    if (game.gameState === GameState.ENDED) {
      console.log(
        `[GAME END] Game ${pollId} already ended. Skipping duplicate end request.`
      );
      return;
    }

    // TODO Ensure bullmarket poll exists

    // 4. Update live poll state to ENDED (with additional safety check)
    try {
      const updateResult = await endGameIfNotEnded(pollId, {
        gameState: "ENDED",
        endedAt: new Date(),
      });

      // Check if we actually updated any rows (count should be 1)
      if (!updateResult || updateResult.count === 0) {
        console.log(
          `[GAME END] Game ${pollId} was already ended or not found. Skipping duplicate end request.`
        );
        return;
      }
    } catch (error) {
      console.error(
        `[GAME END] Error updating game ${pollId} to ENDED state:`,
        error
      );
      return;
    }

    // 6. Finalize timer values in database
    if (timer) {
      await finalizeTimerValues(pollId, timer);
    }

    // 7. Delete timer from memory after database update
    chessTimerManager.deleteTimer(pollId);
    console.log(`[GAME END] Timer deleted for live poll ${pollId}`);

    // 8. Clear any pending disconnect timeouts for this game

    // 9. Emit game ended event to all clients in the game room
    // This will trigger frontend timer stopping
    if (userId) {
      io.to(pollId).emit(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
        gameId: pollId,
        userId,
      });
    }

    console.log(
      `[GAME END] Game ${pollId} ended successfully. Timers stopped.`
    );
  } catch (error) {
    console.error(`[GAME END] Error ending game ${pollId}:`, error);

    // Still emit game ended event even if database update fails
    // This ensures frontend timers are stopped regardless
    if (userId) {
      io.to(pollId).emit(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
        gameId: pollId,
        userId,
      });
    }

    // Still try to cleanup timer on error
    chessTimerManager.stopTimer(pollId);
    chessTimerManager.deleteTimer(pollId);
  }
}

/**
 * Handle timeout-specific game ending
 */
export async function handleTimerExpiration(
  io: Server,
  pollId: string
): Promise<void> {
  try {
    // Get user ID for the player who timed out
    const userId = await getUserIdByColor(pollId);

    if (!userId) {
      console.error(`[TIMEOUT] Could not find user ID for ${pollId}`);
      return;
    }

    // Use the centralized game end handler
    await handleGameEnd({ io, pollId, userId });

    console.log(`[TIMEOUT] Game ${pollId} ended due to timeout`);
  } catch (error) {
    console.error(
      `[TIMEOUT] Error handling timeout for game ${pollId}:`,
      error
    );
  }
}
