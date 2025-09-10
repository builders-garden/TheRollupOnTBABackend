import { TipSentEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class TipSentHandler extends SocketHandler {
  async handle({
    username,
    profilePicture,
    tipAmount,
    position,
  }: TipSentEvent) {
    try {
      this.emitToStream(ServerToClientSocketEvents.TIP_RECEIVED, {
        username,
        profilePicture,
        tipAmount,
        position,
      });
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending tip",
      });
    }
  }
}
