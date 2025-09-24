import { env } from "../config/env";
import { StartSentimentPollEvent } from "../types";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { LiveTimerManager } from "../lib/timer-manager";
import { getBrandById } from "../lib/database/queries";

export class StartSentimentPollHandler extends SocketHandler {
  async handle({
    id,
    brandId,
    //username,
    //profilePicture,
    pollQuestion,
    endTimeMs,
    //guests,
    results,
  }: StartSentimentPollEvent) {
    try {
      const brand = await getBrandById(brandId);
      if (!brand) throw new Error("Brand not found");

      // Create and start a timer based on provided endTime
      const now = Date.now();
      const end = endTimeMs;
      const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000));

      if (secondsLeft > 0) {
        const manager = LiveTimerManager.getInstance();
        manager.createTimer({ pollId: id, brandId, timeLeft: secondsLeft });
        manager.startTimer(id, brandId);
      }
      this.emitToStream(
        brandId,
        ServerToClientSocketEvents.START_SENTIMENT_POLL,
        {
          id,
          brandId,
          pollQuestion,
          endTimeMs,
          votes: 0,
          voters: 0,
          qrCodeUrl: `${env.APP_URL}/poll/${id}`,
          position: PopupPositions.TOP_CENTER,
          results,
        }
      );
    } catch (e) {
      this.emitToStream(brandId, ServerToClientSocketEvents.ERROR, {
        brandId,
        code: 500,
        message: "Error sending start sentiment poll",
      });
    }
  }
}
