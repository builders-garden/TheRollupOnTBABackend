import { MatchmakingQueue } from "../lib/matchmaking-queue";
import type { JoinMatchmakingQueueEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { broadcastNotification } from "../lib/notifications";

export class JoinMatchmakingQueueHandler extends SocketHandler {
	async handle({
		userId,
		userFid,
		username,
		gameMode,
		gameOption,
		wageAmount,
		fromBroadcast,
	}: JoinMatchmakingQueueEvent) {
		try {
			// Validate input data
			if (
				!userId ||
				!userFid ||
				!username ||
				!gameMode ||
				!gameOption ||
				!wageAmount
			) {
				console.error("[MATCHMAKING] Invalid data:", {
					userId,
					userFid,
					username,
					gameMode,
					gameOption,
					wageAmount,
				});
				this.socket.emit(ServerToClientSocketEvents.ERROR, {
					code: 400,
					message: "Missing required data for matchmaking",
				});
				return;
			}

			if (typeof userFid !== "number" || userFid <= 0) {
				console.error("[MATCHMAKING] Invalid userFid:", userFid);
				this.socket.emit(ServerToClientSocketEvents.ERROR, {
					code: 400,
					message: "Invalid user FID",
				});
				return;
			}

			console.log(
				`[MATCHMAKING] Player ${username} (fid: ${userFid}) joining queue for ${gameMode} ${gameOption}`,
			);

			const matchmakingQueue = MatchmakingQueue.getInstance();

			// Add player to queue
			matchmakingQueue.addToQueue({
				userId,
				userFid,
				username,
				socketId: this.socket.id,
				gameMode,
				gameOption,
				wageAmount,
				queuedAt: Date.now(),
			});

			// Get current queue status
			const queueStatus = matchmakingQueue.getQueueStatus(gameMode, gameOption);

			// Emit confirmation to player
			this.socket.emit(ServerToClientSocketEvents.QUEUE_JOINED, {
				playersInQueue: queueStatus.playersInQueue,
				estimatedWaitTime: queueStatus.estimatedWaitTime,
				position: queueStatus.playersInQueue, // They are the last in queue
			});

			if (!fromBroadcast) {
				broadcastNotification(this.io, {
					type: "info",
					title: `Join casual game`,
					message: `Join @${username} in a casual game ${
						parseFloat(wageAmount) > 0
							? `with ${wageAmount} USDC bet`
							: "for free"
					}`,
					gameMode,
					gameOption,
					wageAmount,
					userId,
				});
			}
		} catch (error) {
			console.error("[MATCHMAKING] Error joining queue:", error);
			this.socket.emit(ServerToClientSocketEvents.ERROR, {
				code: 500,
				message: "Failed to join matchmaking queue",
			});
		}
	}
}
