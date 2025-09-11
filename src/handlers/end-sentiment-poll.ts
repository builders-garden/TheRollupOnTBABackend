import { env } from "../config/env";
import { EndSentimentPollEvent } from "../types";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class EndSentimentPollHandler extends SocketHandler {
  async handle({ id }: EndSentimentPollEvent) {
    try {
      // TODO update and retrieve poll to db
      console.log("poll ended also updated to db", {
        id,
      });
      this.emitToStream(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
        id,
        pollQuestion: "",
        endTime: new Date(),
        votes: 0,
        voters: 0,
        qrCodeUrl: `https://${env.APP_URL}/poll/${id}`,
        position: PopupPositions.TOP_LEFT,
        results: {
          bullPercent: 30,
          bearPercent: 70,
        },
      });
      this.emitToStream(ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL, {
        id,
        position: PopupPositions.TOP_LEFT,
        endTime: new Date(),
        voters: 0,
        votes: 0,
        results: {
          bullPercent: 30,
          bearPercent: 70,
        },
      });
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending end sentiment poll",
      });
    }
  }
}
