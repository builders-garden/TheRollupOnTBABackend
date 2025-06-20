import { SocketHandler } from "./socket-handler";
import type { MovePieceEvent } from "../types";
import { getGameParticipant } from "../lib/prisma/queries/game-participants";
import { getGameById, updateGameWithMove } from "../lib/prisma/queries/game";
import { ServerToClientSocketEvents } from "../types/enums";
import { Chess } from "chess.js";
import { ChessTimerManager } from "../lib/timer-manager";
import { updateTimerAfterMove } from "../lib/prisma/queries/timer-persistence";
import { GameEndReason } from "@prisma/client";
import { handleGameEnd } from "../lib/game-end-handler";

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
      // move is invalid
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

    // Switch timer to opponent
    const chessTimerManager = ChessTimerManager.getInstance();
    const timer = chessTimerManager.getTimer(gameId);

    if (timer) {
      chessTimerManager.switchTurn(gameId, move.color);

      // Update database with new timer values
      await updateTimerAfterMove(gameId, timer);
    }

    // update game with valid move
    const updatedGame = await updateGameWithMove(
      gameId,
      userId,
      chess.fen(),
      checkMove
    );
    console.log(`[GAME] Updated game: ${updatedGame}`);

    // check if game has ended
    let gameEndReason: GameEndReason | null = null;
    const turn = chess.turn();
    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        gameEndReason =
          turn === "w"
            ? GameEndReason.BLACK_CHECKMATE
            : GameEndReason.WHITE_CHECKMATE;
      } else if (chess.isStalemate()) {
        gameEndReason =
          turn === "w"
            ? GameEndReason.WHITE_STALEMATE
            : GameEndReason.BLACK_STALEMATE;
      } else if (chess.isThreefoldRepetition()) {
        gameEndReason =
          turn === "w"
            ? GameEndReason.WHITE_THREEFOLD_REPETITION
            : GameEndReason.BLACK_THREEFOLD_REPETITION;
      } else if (chess.isInsufficientMaterial()) {
        gameEndReason =
          turn === "w"
            ? GameEndReason.WHITE_INSUFFICIENT_MATERIAL
            : GameEndReason.BLACK_INSUFFICIENT_MATERIAL;
      } else if (chess.isDrawByFiftyMoves()) {
        gameEndReason =
          turn === "w"
            ? GameEndReason.WHITE_FIFTY_MOVE_RULE
            : GameEndReason.BLACK_FIFTY_MOVE_RULE;
      } else {
        gameEndReason = GameEndReason.OTHER;
      }

      // Use centralized game end handler for checkmate, stalemate, etc.
      // This will stop timers, update database, and emit events
      await handleGameEnd(this.io, gameId, userId, gameEndReason);
      return;
    }

    // emit move to all participants
    this.emitToGame(gameId, ServerToClientSocketEvents.MOVE_PIECE_ACK, {
      gameId,
      userId,
      move,
    });
  }
}
