import { SocketHandler } from "./socket-handler";
import type { MovePieceEvent } from "../types";
import { getGameParticipant } from "../lib/prisma/queries/game-participants";
import { getGameById, updateGameWithMove } from "../lib/prisma/queries/game";
import { ServerToClientSocketEvents } from "../types/enums";
import { Chess } from "chess.js";

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

    // check if move is valid
    const chess = new Chess(game.currentFen);
    let checkMove = null;
    try {
      checkMove = chess.move(move);
    } catch (error) {}
    if (!checkMove) {
      const errorMessage = `Invalid move from ${move.from} to ${move.to}`;
      console.error(`[GAME] ${errorMessage} in game ${gameId}`);
      this.emitToGame(gameId, ServerToClientSocketEvents.MOVE_PIECE_ERROR, {
        gameId,
        userId,
        error: errorMessage,
        move,
      });
      return;
    }

    const updatedGame = await updateGameWithMove(
      gameId,
      userId,
      chess.fen(),
      checkMove
    );
    console.log(`[GAME] Updated game: ${updatedGame}`);

    // TODO emit move to all participants
    this.emitToGame(gameId, ServerToClientSocketEvents.MOVE_PIECE_ACK, {
      gameId,
      userId,
      move,
    });
  }
}
