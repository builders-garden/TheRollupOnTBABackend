import { env } from "../config/env";
import { StartSentimentPollEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";
import { LiveTimerManager } from "../lib/timer-manager";

export class StartSentimentPollHandler extends SocketHandler {
  async handle({
    id,
    //username,
    //profilePicture,
    pollQuestion,
    endTime,
    guests,
    position,
    results,
  }: StartSentimentPollEvent) {
    try {
      // Create and start a timer based on provided endTime
      const now = Date.now();
      const end = new Date(endTime).getTime();
      const secondsLeft = Math.max(0, Math.ceil((end - now) / 1000));

      if (secondsLeft > 0) {
        const manager = LiveTimerManager.getInstance();
        manager.createTimer(id, secondsLeft);
        manager.startTimer(id);
      }
      // TODO save poll to db
      console.log("poll saved to db", {
        id,
        pollQuestion,
        endTime,
        guests,
        //username,
        //profilePicture,
      });
      this.emitToStream(ServerToClientSocketEvents.START_SENTIMENT_POLL, {
        id,
        pollQuestion,
        endTime,
        votes: 0,
        voters: 0,
        qrCodeUrl: `https://${env.APP_URL}/poll/${id}`,
        position,
        results,
      });
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending start sentiment poll",
      });
    }
  }
}
