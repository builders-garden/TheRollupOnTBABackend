import { SocketHandler } from "./socket-handler";
import type { ResetGameRequestEvent } from "../types";
import { updateGame } from "../lib/prisma/queries/game";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameState } from "@prisma/client";

export class ResetGameHandler extends SocketHandler {
  async handle({ gameId, userId }: ResetGameRequestEvent) {
    console.log(`[GAME] Resetting game ${gameId} by participant ${userId}`);

    // TODO update game board
    await updateGame(gameId, {
      gameState: GameState.ACTIVE,
      gameResult: null,
      gameEndReason: null,
      endedAt: null,
      totalMoves: 0,
      currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    });

    // TODO emit reset to all participants
    this.emitToGame(gameId, ServerToClientSocketEvents.RESET_GAME, {
      gameId,
      userId,
    });
  }
}
