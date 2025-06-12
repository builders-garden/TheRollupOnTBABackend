import { SocketHandler } from "./socket-handler";
import type { EndGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import {
  GameEndReason,
  GameParticipantColor,
  GameParticipantStatus,
  GameResult,
  GameState,
} from "@prisma/client";
import {
  getGameById,
  updateGame,
  updateGameParticipant,
} from "../lib/prisma/queries";
import { ChessTimerManager } from "../lib/timer-manager";

export class EndGameHandler extends SocketHandler {
  async handle({ gameId, userId, reason }: EndGameRequestEvent): Promise<void> {
    console.log(
      `[CONNECTION] Ending game: ${gameId} by participant: ${userId} with reason: ${reason}`
    );

    const game = await getGameById(gameId);
    if (!game) {
      console.error(`[GAME] Game ${gameId} not found`);
      return;
    }

    const participant = game.participants.find((p) => p.userId === userId);
    if (!participant) {
      console.error(`[GAME] Participant ${userId} not found`);
      return;
    }

    // user requested draw ==> ask other participant to accept or reject
    if (
      reason === GameEndReason.WHITE_REQUESTED_DRAW ||
      reason === GameEndReason.BLACK_REQUESTED_DRAW
    ) {
      // TODO: send notification to other participant
      this.emitToGame(gameId, ServerToClientSocketEvents.ACCEPT_GAME_END, {
        gameId,
        userId,
        reason,
      });
    } else if (
      reason === GameEndReason.WHITE_RESIGNED ||
      reason === GameEndReason.BLACK_RESIGNED
    ) {
      // Stop and cleanup timer
      const chessTimerManager = ChessTimerManager.getInstance();
      chessTimerManager.stopTimer(gameId);
      chessTimerManager.deleteTimer(gameId);

      // update game state
      await updateGame(gameId, {
        gameState: GameState.ENDED,
        gameResult:
          reason === GameEndReason.WHITE_RESIGNED
            ? GameResult.BLACK_WON
            : GameResult.WHITE_WON,
        endedAt: new Date(),
        gameEndReason: reason,
      });

      // update participant status and winner
      const whiteParticipant = game.participants.find(
        (p) => p.color === GameParticipantColor.WHITE
      );
      const blackParticipant = game.participants.find(
        (p) => p.color === GameParticipantColor.BLACK
      );

      // white resigned ==> black won
      if (
        whiteParticipant &&
        blackParticipant &&
        reason === GameEndReason.WHITE_RESIGNED
      ) {
        await Promise.all([
          updateGameParticipant(gameId, whiteParticipant.userId, {
            status: GameParticipantStatus.LEFT,
            isWinner: false,
          }),
          updateGameParticipant(gameId, blackParticipant.userId, {
            isWinner: true,
          }),
        ]);
      } else if (
        whiteParticipant &&
        blackParticipant &&
        reason === GameEndReason.BLACK_RESIGNED
      ) {
        // black resigned ==> white won
        await Promise.all([
          updateGameParticipant(gameId, whiteParticipant.userId, {
            isWinner: false,
          }),
          updateGameParticipant(gameId, blackParticipant.userId, {
            status: GameParticipantStatus.LEFT,
            isWinner: true,
          }),
        ]);
      }

      // TODO call smart contract to end game

      // notify all participants
      this.emitToGame(gameId, ServerToClientSocketEvents.GAME_ENDED, {
        gameId,
        userId,
        reason,
      });
    }
  }
}
