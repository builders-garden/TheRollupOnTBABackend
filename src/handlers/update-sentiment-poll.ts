import { UpdateSentimentPollEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { LiveTimerManager } from "../lib/timer-manager";

export class UpdateSentimentPollHandler extends SocketHandler {
  async handle(data: UpdateSentimentPollEvent) {
    try {
      // If endTime changed, adjust timer deadline accordingly
      if (data.endTimeMs) {
        const now = Date.now();
        const end = data.endTimeMs;
        const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000));

        const manager = LiveTimerManager.getInstance();
        const timer = manager.getTimer(data.id);

        if (!timer && secondsLeft > 0) {
          manager.createTimer(data.id, secondsLeft);
          manager.startTimer(data.id);
        } else if (timer) {
          // Update in-memory timer state and persist new deadline
          timer.timeLeft = secondsLeft;
          if (!manager.isTimerRunning(data.id) && secondsLeft > 0) {
            manager.startTimer(data.id);
          }
        }
      }
      this.emitToStream(ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL, {
        id: data.id,
        endTimeMs: data.endTimeMs,
        position: data.position,
        votes: data.votes,
        voters: data.voters,
        results: data.results,
      });
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending update sentiment poll",
      });
    }
  }
}
