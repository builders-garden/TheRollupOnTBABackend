import { UpdateSentimentPollEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { LiveTimerManager } from "../lib/timer-manager";
import { getBrandById } from "../lib/database/queries";

export class UpdateSentimentPollHandler extends SocketHandler {
  async handle(data: UpdateSentimentPollEvent) {
    try {
      const brand = await getBrandById(data.brandId);
      if (!brand) throw new Error("Brand not found");

      // If endTime changed, adjust timer deadline accordingly
      if (data.endTimeMs) {
        const now = Date.now();
        const end = data.endTimeMs;
        const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000));

        const manager = LiveTimerManager.getInstance();
        const timer = manager.getTimer(data.id);

        if (!timer && secondsLeft > 0) {
          manager.createTimer({
            pollId: data.id,
            brandId: data.brandId,
            timeLeft: secondsLeft,
          });
          manager.startTimer(data.id, data.brandId);
        } else if (timer) {
          // Update in-memory timer state and persist new deadline
          timer.timeLeft = secondsLeft;
          if (!manager.isTimerRunning(data.id) && secondsLeft > 0) {
            manager.startTimer(data.id, data.brandId);
          }
        }
      }
      this.emitToStream(
        data.brandId,
        ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL,
        {
          id: data.id,
          brandId: data.brandId,
          endTimeMs: data.endTimeMs,
          position: data.position,
          votes: data.votes,
          voters: data.voters,
          results: data.results,
        }
      );
    } catch (e) {
      this.emitToStream(data.brandId, ServerToClientSocketEvents.ERROR, {
        brandId: data.brandId,
        code: 500,
        message: "Error sending update sentiment poll",
      });
    }
  }
}
