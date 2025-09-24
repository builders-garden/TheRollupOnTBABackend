import { getBrandById } from "../lib/database/queries";
import { TokenTradedEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class TokenTradedHandler extends SocketHandler {
  async handle({
    brandId,
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
      const brand = await getBrandById(brandId);
      if (!brand) throw new Error("Brand not found");

      this.emitToStream(brandId, ServerToClientSocketEvents.TOKEN_TRADED, {
        brandId,
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
      this.emitToStream(brandId, ServerToClientSocketEvents.ERROR, {
        brandId,
        code: 500,
        message: "Error sending token traded",
      });
    }
  }
}
