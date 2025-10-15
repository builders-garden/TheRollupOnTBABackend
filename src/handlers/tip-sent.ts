import { getBrandById } from "../lib/database/queries";
import { TipSentEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { SocketHandler } from "./socket-handler";

export class TipSentHandler extends SocketHandler {
  async handle({
    brandId,
    username,
    profilePicture,
    tipAmount,
    position,
    customMessage
  }: TipSentEvent) {
    try {
      const brand = await getBrandById(brandId);
      if (!brand) throw new Error("Brand not found");

      this.emitToStream(brandId, ServerToClientSocketEvents.TIP_RECEIVED, {
        brandId,
        username,
        profilePicture,
        tipAmount,
        position,
        customMessage,
      });
    } catch (e) {
      this.emitToStream(brandId, ServerToClientSocketEvents.ERROR, {
        brandId,
        code: 500,
        message: "Error sending tip",
      });
    }
  }
}
