import { GameEndReason } from "@prisma/client";
import { handleGameEnd } from "../lib/game-end-handler";
import { getGameById } from "../lib/prisma/queries";
import type { EndGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class EndGameHandler extends SocketHandler {
	async handle({ gameId, userId, reason }: EndGameRequestEvent): Promise<void> {
		console.log(
			`[CONNECTION] Ending game: ${gameId} by participant: ${userId} with reason: ${reason}`,
		);

		const game = await getGameById(gameId);
		if (!game) {
			console.error(`[GAME] Game ${gameId} not found`);
			return;
		}
		if (!game.opponent) {
			console.error(`[GAME] Game ${gameId} has no opponent`);
			return;
		}

		const isUserParticipant =
			game.creator.userId === userId || game.opponent.userId === userId;
		if (!isUserParticipant) {
			console.error(`[GAME] Participant ${userId} not found in game ${gameId}`);
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
			// INSTANT RESPONSE: Immediately acknowledge the game end request
			// This allows frontend to stop timers and show loading state immediately
			this.emitToGame(gameId, ServerToClientSocketEvents.GAME_END_ACK, {
				gameId,
				userId,
				reason,
				message: "Processing game end...",
			});

			// ASYNC PROCESSING: Handle the actual game ending with smart contract transaction
			// This runs asynchronously and will emit GAME_ENDED when complete
			setImmediate(async () => {
				await handleGameEnd(this.io, gameId, userId, reason);
			});
		}
	}
}
