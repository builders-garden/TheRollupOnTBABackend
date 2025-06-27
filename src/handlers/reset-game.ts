import { GameState } from "@prisma/client";
import { getGameById, updateGame } from "../lib/prisma/queries/game";
import { initializeGameTimers } from "../lib/prisma/queries/timer-persistence";
import { ChessTimerManager } from "../lib/timer-manager";
import { getGameOptionTime } from "../lib/utils";
import type { ResetGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class ResetGameHandler extends SocketHandler {
	async handle({ gameId, userId }: ResetGameRequestEvent) {
		console.log(`[GAME] Resetting game ${gameId} by participant ${userId}`);

		// Stop and cleanup timer
		const chessTimerManager = ChessTimerManager.getInstance();
		chessTimerManager.stopTimer(gameId);
		chessTimerManager.deleteTimer(gameId);

		const game = await getGameById(gameId);
		if (!game) {
			console.error(`[GAME] Game ${gameId} not found`);
			return;
		}

		const { duration } = getGameOptionTime(game.gameMode, game.gameOption);

		await initializeGameTimers(gameId, duration);

		// Update game board
		await updateGame(gameId, {
			gameState: GameState.ACTIVE,
			gameResult: null,
			gameEndReason: null,
			endedAt: null,
			totalMoves: 0,
			currentFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
		});

		// Emit reset to all participants
		this.emitToGame(gameId, ServerToClientSocketEvents.RESET_GAME, {
			gameId,
			userId,
		});
	}
}
