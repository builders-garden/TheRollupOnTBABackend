import { SocketHandler } from "./socket-handler";
import type { AcceptGameEndResponseEvent } from "../types";
import { getGameById, updateGame } from "../lib/prisma/queries/game";
import { GameEndReason, GameParticipantColor, GameState } from "@prisma/client";
import { ServerToClientSocketEvents } from "../types/enums";
import { handleGameEnd } from "../lib/game-end-handler";

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
      // Draw accepted - end the game using centralized handler
      const participantColor = participant.color;
      const gameEndReason =
        participantColor === GameParticipantColor.WHITE
          ? GameEndReason.WHITE_REQUESTED_DRAW
          : GameEndReason.BLACK_REQUESTED_DRAW;

      // Use centralized game end handler for draw acceptance
      // This will stop timers, update database, and emit events
      await handleGameEnd(this.io, gameId, userId, gameEndReason);
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
