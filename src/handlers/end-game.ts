import { SocketHandler } from "./socket-handler";
import type { EndGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameEndReason } from "@prisma/client";
import { getGameById } from "../lib/prisma/queries";
import { handleGameEnd } from "../lib/game-end-handler";

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
      // Use centralized game end handler for resignations
      // This will stop timers, update database, and emit events
      await handleGameEnd(this.io, gameId, userId, reason);
    }
  }
}
