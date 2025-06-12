import { SocketHandler } from "./socket-handler";
import type { AcceptGameEndResponseEvent } from "../types";
import { getGameById, updateGame } from "../lib/prisma/queries/game";
import {
  GameEndReason,
  GameParticipantColor,
  GameResult,
  GameState,
} from "@prisma/client";
import { ServerToClientSocketEvents } from "../types/enums";
import { ChessTimerManager } from "../lib/timer-manager";

export class AcceptGameEndResponseHandler extends SocketHandler {
  async handle({
    gameId,
    userId,
    accepted,
  }: AcceptGameEndResponseEvent): Promise<void> {
    console.log(
      `[CONNECTION] Accepting game end: ${gameId} by participant: ${userId} with accepted: ${accepted}`
    );

    const game = await getGameById(gameId);
    if (!game) {
      console.error(`[GAME] Game ${gameId} not found`);
      return;
    }

    const participant = game.participants.find((p) => p.userId === userId);
    const otherParticipant = game.participants.find((p) => p.userId !== userId);
    if (!participant || !otherParticipant) {
      console.error(`[GAME] Participants not found for game ${gameId}`);
      return;
    }

    const chessTimerManager = ChessTimerManager.getInstance();

    if (accepted) {
      // Draw accepted - end the game
      const participantColor = participant.color;
      const otherParticipantColor = otherParticipant.color;
      const gameEndReason =
        userId === participant.userId
          ? participantColor === GameParticipantColor.WHITE
            ? GameEndReason.WHITE_REQUESTED_DRAW
            : GameEndReason.BLACK_REQUESTED_DRAW
          : otherParticipantColor === GameParticipantColor.WHITE
          ? GameEndReason.BLACK_REQUESTED_DRAW
          : GameEndReason.WHITE_REQUESTED_DRAW;
      chessTimerManager.stopTimer(gameId);
      chessTimerManager.deleteTimer(gameId);
      // update game state with draw
      await updateGame(gameId, {
        gameState: GameState.ENDED,
        gameResult: GameResult.DRAW,
        gameEndReason,
        endedAt: new Date(),
      });

      this.emitToGame(gameId, ServerToClientSocketEvents.GAME_ENDED, {
        gameId,
        userId,
        reason: gameEndReason,
      });
    } else {
      // Draw rejected - resume the game
      await updateGame(gameId, {
        gameState: GameState.ACTIVE,
        gameResult: null,
        gameEndReason: null,
      });

      this.emitToGame(gameId, ServerToClientSocketEvents.RESUME_GAME, {
        gameId,
        userId,
        status: GameState.ACTIVE,
        message: "Draw request rejected. Game continues.",
      });
    }
  }
}
