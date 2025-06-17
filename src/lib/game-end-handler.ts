import { GameState, GameEndReason, GameResult } from "@prisma/client";
import { ChessTimerManager } from "./timer-manager";
import { updateGame, updateGameParticipant } from "./prisma/queries";
import { finalizeTimerValues } from "./timer-persistence";
import type { Server } from "socket.io";
import { ServerToClientSocketEvents } from "../types/enums";

/**
 * Central handler for all game ending scenarios
 * Ensures timers are properly stopped and cleaned up
 */
export async function handleGameEnd(
  io: Server,
  gameId: string,
  userId: string,
  reason: GameEndReason
): Promise<void> {
  try {
    console.log(
      `[GAME END] Processing game end for ${gameId}. Reason: ${reason}`
    );

    // 1. Get current timer state before stopping
    const chessTimerManager = ChessTimerManager.getInstance();
    const timer = chessTimerManager.getTimer(gameId);

    // 2. Stop the server timer immediately
    const timerStopped = chessTimerManager.stopTimer(gameId);
    console.log(`[GAME END] Timer stopped for game ${gameId}: ${timerStopped}`);

    // 3. Determine game result based on reason
    let gameResult: GameResult | null = null;
    if (
      reason === GameEndReason.WHITE_CHECKMATE ||
      reason === GameEndReason.BLACK_TIMEOUT
    ) {
      gameResult = GameResult.WHITE_WON;
    } else if (
      reason === GameEndReason.BLACK_CHECKMATE ||
      reason === GameEndReason.WHITE_TIMEOUT
    ) {
      gameResult = GameResult.BLACK_WON;
    } else if (reason === GameEndReason.WHITE_RESIGNED) {
      gameResult = GameResult.BLACK_WON;
    } else if (reason === GameEndReason.BLACK_RESIGNED) {
      gameResult = GameResult.WHITE_WON;
    } else if (
      reason === GameEndReason.WHITE_REQUESTED_DRAW ||
      reason === GameEndReason.BLACK_REQUESTED_DRAW ||
      reason === GameEndReason.WHITE_STALEMATE ||
      reason === GameEndReason.BLACK_STALEMATE ||
      reason === GameEndReason.WHITE_INSUFFICIENT_MATERIAL ||
      reason === GameEndReason.BLACK_INSUFFICIENT_MATERIAL ||
      reason === GameEndReason.WHITE_THREEFOLD_REPETITION ||
      reason === GameEndReason.BLACK_THREEFOLD_REPETITION ||
      reason === GameEndReason.WHITE_FIFTY_MOVE_RULE ||
      reason === GameEndReason.BLACK_FIFTY_MOVE_RULE
    ) {
      gameResult = GameResult.DRAW;
    }

    // 4. Update game state to ENDED
    await updateGame(gameId, {
      gameState: GameState.ENDED,
      gameEndReason: reason,
      gameResult,
      endedAt: new Date(),
    });

    // 5. Update participant winners
    if (gameResult === GameResult.WHITE_WON) {
      await Promise.all([
        updateGameParticipant(gameId, "white_user_id", { isWinner: true }),
        updateGameParticipant(gameId, "black_user_id", { isWinner: false }),
      ]);
    } else if (gameResult === GameResult.BLACK_WON) {
      await Promise.all([
        updateGameParticipant(gameId, "white_user_id", { isWinner: false }),
        updateGameParticipant(gameId, "black_user_id", { isWinner: true }),
      ]);
    }
    // For draws, both players remain with default isWinner: false

    // 6. Finalize timer values in database
    if (timer) {
      await finalizeTimerValues(gameId, timer, reason);
    }

    // 7. Delete timer from memory after database update
    chessTimerManager.deleteTimer(gameId);
    console.log(`[GAME END] Timer deleted for game ${gameId}`);

    // 8. Emit game ended event to all clients in the game room
    // This will trigger frontend timer stopping
    io.to(gameId).emit(ServerToClientSocketEvents.GAME_ENDED, {
      gameId,
      userId,
      reason,
    });

    console.log(
      `[GAME END] Game ${gameId} ended successfully. Reason: ${reason}. Timers stopped.`
    );
  } catch (error) {
    console.error(`[GAME END] Error ending game ${gameId}:`, error);

    // Still emit game ended event even if database update fails
    // This ensures frontend timers are stopped regardless
    io.to(gameId).emit(ServerToClientSocketEvents.GAME_ENDED, {
      gameId,
      userId,
      reason,
    });

    // Still try to cleanup timer on error
    const chessTimerManager = ChessTimerManager.getInstance();
    chessTimerManager.stopTimer(gameId);
    chessTimerManager.deleteTimer(gameId);
  }
}

/**
 * Handle timeout-specific game ending
 */
export async function handleTimerExpiration(
  io: Server,
  gameId: string,
  color: "w" | "b"
): Promise<void> {
  try {
    // Get user ID for the player who timed out
    const { getUserIdByColor } = await import("./timer-persistence");
    const userId = await getUserIdByColor(gameId, color);

    if (!userId) {
      console.error(
        `[TIMEOUT] Could not find user ID for ${color} in game ${gameId}`
      );
      return;
    }

    const reason =
      color === "w" ? GameEndReason.WHITE_TIMEOUT : GameEndReason.BLACK_TIMEOUT;

    // Use the centralized game end handler
    await handleGameEnd(io, gameId, userId, reason);

    console.log(`[TIMEOUT] Game ${gameId} ended due to ${color} timeout`);
  } catch (error) {
    console.error(
      `[TIMEOUT] Error handling timeout for game ${gameId}:`,
      error
    );
  }
}
