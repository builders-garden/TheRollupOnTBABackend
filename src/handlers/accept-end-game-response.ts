import { SocketHandler } from "./socket-handler";
import type { AcceptGameEndResponseEvent } from "../types";
import { ChessTimerManager } from "../lib/timer-manager";
import { updateGame } from "../lib/prisma/queries/game";
import { GameState, GameResult, GameEndReason } from "@prisma/client";
import { ServerToClientSocketEvents } from "../types/enums";

export class AcceptGameEndResponseHandler extends SocketHandler {
  async handle({
    gameId,
    userId,
    accepted,
  }: AcceptGameEndResponseEvent): Promise<void> {
    console.log(
      `[CONNECTION] Accepting game end: ${gameId} by participant: ${userId} with accepted: ${accepted}`
    );

    const chessTimerManager = ChessTimerManager.getInstance();

    if (accepted) {
      // Draw accepted - end the game
      chessTimerManager.stopTimer(gameId);
      chessTimerManager.deleteTimer(gameId);

      await updateGame(gameId, {
        gameState: GameState.ENDED,
        gameResult: GameResult.DRAW,
        gameEndReason: GameEndReason.WHITE_REQUESTED_DRAW, // or BLACK_REQUESTED_DRAW
        endedAt: new Date(),
      });

      this.emitToGame(gameId, ServerToClientSocketEvents.GAME_ENDED, {
        gameId,
        userId,
        reason: GameEndReason.WHITE_REQUESTED_DRAW,
      });
    } else {
      // Draw rejected - resume the game
      this.emitToGame(gameId, ServerToClientSocketEvents.RESUME_GAME, {
        gameId,
        userId,
        status: GameState.ACTIVE,
        message: "Draw request rejected. Game continues.",
      });
    }
  }
}
