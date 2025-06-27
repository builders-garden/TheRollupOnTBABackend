import { GameParticipantStatus } from "@prisma/client";
import { getGameById } from "../lib/prisma/queries/game";
import type { JoinGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class JoinGameHandler extends SocketHandler {
	async handle({ gameId, userId }: JoinGameRequestEvent) {
		try {
			// 1 get game from db
			const game = await getGameById(gameId);
			if (!game) throw new Error("Game not found");

			// 2 creator join the room
			this.socket.join(gameId);
			console.log(`[JOIN GAME] game ${game.id} joined by ${userId}`);
			this.emitToGame(game.id, ServerToClientSocketEvents.JOIN_GAME_RESPONSE, {
				gameId: game.id,
				status: game.gameState,
				participants: [game.creator, game.opponent]
					.filter((p) => p !== null)
					.map((p) => ({
						socketId: this.socket.id,
						participantFid: p.user?.fid || 0,
						participantUsername: p.user?.username || "Unknown",
						avatarUrl: p.user?.avatarUrl || "",
						ready: p.status === GameParticipantStatus.READY,
						score: 0, // TODO: get score from db
						isCreator: p.id === game.creatorId,
					})),
			});
		} catch (e) {
			console.error(`[CREATE GAME] Error creating game: ${e}`);
			this.emitToGame(this.socket.id, ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Error creating game",
			});
		}
	}
}
