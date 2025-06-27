import { GameParticipantStatus, GameState } from "@prisma/client";
import { getGameById, updateGame } from "../lib/prisma/queries/game";
import { updateGameParticipant } from "../lib/prisma/queries/game-participants";
import type { ParticipantNotReadyEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class ParticipantNotReadyHandler extends SocketHandler {
	async handle({ gameId, userId }: ParticipantNotReadyEvent) {
		try {
			// 0 check game state
			const game = await getGameById(gameId);
			if (!game) {
				console.error(`[PARTICIPANT NOT READY] Game ${gameId} not found`);
				return;
			}
			if (game.gameState === GameState.ENDED) {
				console.error(`[PARTICIPANT NOT READY] Game ${gameId} is ended`);
				return;
			}
			if (game.gameState === GameState.ACTIVE) {
				console.log(
					`[PARTICIPANT NOT READY] Game ${gameId} is already active, ignoring not ready event`,
				);
				return;
			}

			// 1 update game participant status to waiting (revoke ready state)
			await updateGameParticipant(gameId, userId, {
				status: GameParticipantStatus.WAITING,
				socketId: null, // Clear socket ID since they're leaving
			});

			console.log(
				`[PARTICIPANT NOT READY] user ${userId} not ready for game ${gameId}`,
			);

			// 2 Always emit PARTICIPANT_READY_ACK with WAITING status when a participant becomes not ready
			this.emitToGame(
				gameId,
				ServerToClientSocketEvents.PARTICIPANT_READY_ACK,
				{
					gameId,
					userId,
					status: GameParticipantStatus.WAITING,
				},
			);

			// 3 Update game state back to WAITING since participant is no longer ready
			await updateGame(gameId, { gameState: GameState.WAITING });
		} catch (e) {
			console.error(
				`[PARTICIPANT NOT READY] Error updating game participant: ${e}`,
			);
			this.emitToGame(this.socket.id, ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Error updating game participant not ready status",
			});
		}
	}
}
