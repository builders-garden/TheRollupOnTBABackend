import { env } from "../config/env";
import { EndSentimentPollEvent } from "../types";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { LiveTimerManager } from "../lib/timer-manager";
import { getBrandById } from "../lib/database/queries";

export class EndSentimentPollHandler extends SocketHandler {
  async handle({ id, brandId, votes, voters, results }: EndSentimentPollEvent) {
    try {
      const brand = await getBrandById(brandId);
      if (!brand) throw new Error("Brand not found");

      // Stop and remove timer, clear deadline
      const manager = LiveTimerManager.getInstance();
      manager.stopTimer(id);
      manager.deleteTimer(id);

      this.emitToStream(
        brandId,
        ServerToClientSocketEvents.END_SENTIMENT_POLL,
        {
          id,
          brandId,
          pollQuestion: "",
          endTimeMs: Date.now(),
          votes: votes,
          voters: voters,
          qrCodeUrl: `${env.APP_URL}/poll/${id}`,
          position: PopupPositions.TOP_CENTER,
          results: {
            bullPercent: results.bullPercent,
            bearPercent: results.bearPercent,
          },
        }
      );
    } catch (e) {
      // emit end also for errors on the timer
      this.emitToStream(
        brandId,
        ServerToClientSocketEvents.END_SENTIMENT_POLL,
        {
          id,
          brandId,
          pollQuestion: "",
          endTimeMs: Date.now(),
          votes: 0,
          voters: 0,
          qrCodeUrl: `${env.APP_URL}/poll/${id}`,
          position: PopupPositions.TOP_CENTER,
          results: {
            bullPercent: 30,
            bearPercent: 70,
          },
        }
      );
      // also emit error
      this.emitToStream(brandId, ServerToClientSocketEvents.ERROR, {
        brandId,
        code: 500,
        message: "Error sending end sentiment poll",
      });
    }
  }
}
