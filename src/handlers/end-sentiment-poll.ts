import { env } from "../config/env";
import { EndSentimentPollEvent } from "../types";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { LiveTimerManager } from "../lib/timer-manager";

export class EndSentimentPollHandler extends SocketHandler {
  async handle({ id, votes, voters, results }: EndSentimentPollEvent) {
    try {
      // Stop and remove timer, clear deadline
      const manager = LiveTimerManager.getInstance();
      manager.stopTimer(id);
      manager.deleteTimer(id);

      this.emitToStream(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
        id,
        pollQuestion: "",
        endTime: new Date(),
        votes: votes,
        voters: voters,
        qrCodeUrl: `${env.APP_URL}/poll/${id}`,
        position: PopupPositions.TOP_CENTER,
        results: {
          bullPercent: results.bullPercent,
          bearPercent: results.bearPercent,
        },
      });
    } catch (e) {
      // emit end also for errors on the timer
      this.emitToStream(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
        id,
        pollQuestion: "",
        endTime: new Date(),
        votes: 0,
        voters: 0,
        qrCodeUrl: `${env.APP_URL}/poll/${id}`,
        position: PopupPositions.TOP_CENTER,
        results: {
          bullPercent: 30,
          bearPercent: 70,
        },
      });
      // also emit error
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending end sentiment poll",
      });
    }
  }
}
