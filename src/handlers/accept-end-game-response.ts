import { GameEndReason, GameState } from "@prisma/client";
import { handleGameEnd } from "../lib/game-end-handler";
import { getGameById, updateGame } from "../lib/prisma/queries/game";
import type { AcceptGameEndResponseEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class AcceptGameEndResponseHandler extends SocketHandler {
	async handle({
		gameId,
		userId,
		accepted,
	}: AcceptGameEndResponseEvent): Promise<void> {
		console.log(
			`[CONNECTION] Accepting game end: ${gameId} by participant: ${userId} with accepted: ${accepted}`,
		);

		const game = await getGameById(gameId);
		if (!game) {
			console.error(`[GAME] Game ${gameId} not found`);
			return;
		}
		if (
			(!game.creator.user || !game.opponent?.user) &&
			game.creator.user?.id !== userId &&
			game.opponent?.user?.id !== userId
		) {
			console.error(
				`[GAME] User ${userId} is not a participant in game ${gameId}`,
			);
			return;
		}
		const isCreator = game.creator.user?.id === userId;

		const participant = isCreator ? game.creator : game.opponent;
		const otherParticipant = isCreator ? game.opponent : game.creator;
		if (!participant || !otherParticipant) {
			console.error(`[GAME] Participants not found for game ${gameId}`);
			return;
		}

		if (accepted) {
			// Draw accepted - end the game using centralized handler
			// Determine which color the accepting participant is
			let gameEndReason: GameEndReason;

			// Check if this participant is the creator or opponent
			if (participant.id === game.creatorId) {
				// This is the creator accepting the draw
				gameEndReason =
					game.isWhite === "CREATOR"
						? GameEndReason.WHITE_REQUESTED_DRAW
						: GameEndReason.BLACK_REQUESTED_DRAW;
			} else {
				// This is the opponent accepting the draw
				gameEndReason =
					game.isWhite === "CREATOR"
						? GameEndReason.BLACK_REQUESTED_DRAW
						: GameEndReason.WHITE_REQUESTED_DRAW;
			}

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
