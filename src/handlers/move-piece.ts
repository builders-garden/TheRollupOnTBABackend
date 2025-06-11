import { SocketHandler } from "./socket-handler";
import type { MovePieceEvent } from "../types";
import { getGameParticipant } from "../lib/prisma/queries/game-participants";
import { getGameById, updateGame } from "../lib/prisma/queries/game";
import { ServerToClientSocketEvents } from "../types/enums";

export class MovePieceHandler extends SocketHandler {
  async handle({ gameId, userId, move }: MovePieceEvent) {
    console.log(
      `[GAME] Participant ${userId} moving piece from ${move.from} to ${move.to} in game ${gameId}`
    );
    const [game, participant] = await Promise.all([
      getGameById(gameId),
      getGameParticipant(gameId, userId),
    ]);
    if (!game) {
      console.error(`[GAME] Game ${gameId} not found`);
      return;
    }
    if (!participant) {
      console.error(`[GAME] Participant ${userId} not found`);
      return;
    }

    // TODO check if move is valid
    const validMove = true;
    if (!validMove) {
      console.error(
        `[GAME] Invalid move from ${move.from} to ${move.to} in game ${gameId}`
      );
      return;
    }

    // TODO update game board
    const updatedGame = await updateGame(gameId, {
      currentFen: move.fen,
    });
    console.log(`[GAME] Updated game: ${updatedGame}`);

    // TODO emit move to all participants
    this.emitToGame(gameId, ServerToClientSocketEvents.MOVE_PIECE_ACK, {
      gameId,
      userId,
      move,
    });
  }
}
