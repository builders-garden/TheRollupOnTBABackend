import { UpdateSentimentPollEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class UpdateSentimentPollHandler extends SocketHandler {
  async handle(data: UpdateSentimentPollEvent) {
    try {
      console.log("poll updated to db", data);
      this.emitToStream(ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL, {
        id: data.id,
        endTime: data.endTime,
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
