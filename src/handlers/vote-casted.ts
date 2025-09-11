import { VoteCastedEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class VoteCastedHandler extends SocketHandler {
  async handle({
    username,
    profilePicture,
    voteAmount,
    isBull,
    promptId,
    position,
  }: VoteCastedEvent) {
    try {
      // TODO update db with vote

      this.emitToStream(ServerToClientSocketEvents.VOTE_RECEIVED, {
        username,
        profilePicture,
        voteAmount,
        isBull,
        promptId,
        position,
      });
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending vote casted",
      });
    }
  }
}
