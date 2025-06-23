import { MatchmakingQueue } from "../lib/matchmaking-queue";
import { SocketHandler } from "./socket-handler";
import type { JoinMatchmakingQueueEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";

export class JoinMatchmakingQueueHandler extends SocketHandler {
  async handle({
    userId,
    userFid,
    username,
    gameMode,
    gameOption,
  }: JoinMatchmakingQueueEvent) {
    try {
      // Validate input data
      if (!userId || !userFid || !username || !gameMode || !gameOption) {
        console.error(`[MATCHMAKING] Invalid data:`, {
          userId,
          userFid,
          username,
          gameMode,
          gameOption,
        });
        this.socket.emit(ServerToClientSocketEvents.ERROR, {
          code: 400,
          message: "Missing required data for matchmaking",
        });
        return;
      }

      if (typeof userFid !== "number" || userFid <= 0) {
        console.error(`[MATCHMAKING] Invalid userFid:`, userFid);
        this.socket.emit(ServerToClientSocketEvents.ERROR, {
          code: 400,
          message: "Invalid user FID",
        });
        return;
      }

      console.log(
        `[MATCHMAKING] Player ${username} (fid: ${userFid}) joining queue for ${gameMode} ${gameOption}`
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
    } catch (error) {
      console.error(`[MATCHMAKING] Error joining queue:`, error);
      this.socket.emit(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Failed to join matchmaking queue",
      });
    }
  }
}
