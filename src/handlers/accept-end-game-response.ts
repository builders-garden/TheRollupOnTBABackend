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

    if (accepted) {
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
      // update game state with draw
      await updateGame(gameId, {
        gameState: GameState.ENDED,
        gameResult: GameResult.DRAW,
        gameEndReason,
      });

      this.emitToGame(gameId, ServerToClientSocketEvents.GAME_ENDED, {
        gameId,
        userId,
        reason: gameEndReason,
      });
    } else {
      // TODO: update game state with draw
      await updateGame(gameId, {
        gameState: GameState.ACTIVE,
        gameResult: null,
        gameEndReason: null,
      });

      this.emitToGame(gameId, ServerToClientSocketEvents.RESUME_GAME, {
        gameId,
        userId,
        status: GameState.ACTIVE,
        message: "Game resumed",
      });
    }
  }
}
