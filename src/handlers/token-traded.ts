import { TokenTradedEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class TokenTradedHandler extends SocketHandler {
  async handle({
    username,
    profilePicture,
    tokenInAmount,
    tokenInName,
    tokenInDecimals,
    tokenInImageUrl,
    tokenOutAmount,
    tokenOutDecimals,
    tokenOutName,
    tokenOutImageUrl,
    position,
  }: TokenTradedEvent) {
    try {
      this.emitToStream(ServerToClientSocketEvents.TOKEN_TRADED, {
        username,
        profilePicture,
        tokenInAmount,
        tokenInName,
        tokenInDecimals,
        tokenInImageUrl,
        tokenOutAmount,
        tokenOutDecimals,
        tokenOutName,
        tokenOutImageUrl,
        position,
      });
    } catch (e) {
      this.emitToStream(ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error sending token traded",
      });
    }
  }
}
