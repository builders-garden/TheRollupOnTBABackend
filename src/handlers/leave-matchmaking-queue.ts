import { MatchmakingQueue } from "../lib/matchmaking-queue";
import type { LeaveMatchmakingQueueEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class LeaveMatchmakingQueueHandler extends SocketHandler {
	async handle({ userId }: LeaveMatchmakingQueueEvent) {
		try {
			console.log(`[MATCHMAKING] Player ${userId} leaving queue`);

			const matchmakingQueue = MatchmakingQueue.getInstance();

			// Remove player from queue
			const removed = matchmakingQueue.removeFromQueue(userId);

			// Emit confirmation to player
			this.socket.emit(ServerToClientSocketEvents.QUEUE_LEFT, {
				success: removed,
			});
		} catch (error) {
			console.error("[MATCHMAKING] Error leaving queue:", error);
			this.socket.emit(ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Failed to leave matchmaking queue",
			});
		}
	}
}
