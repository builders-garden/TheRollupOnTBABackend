import { getBrandById } from "../lib/database/queries";
import { ServerToClientSocketEvents } from "../types/enums";
import { JoinStreamEvent } from "../types/socket/client-to-server";
import { SocketHandler } from "./socket-handler";

export class JoinStreamHandler extends SocketHandler {
  async handle({ username, profilePicture, brandId }: JoinStreamEvent) {
    try {
      if (username === "Overlay") {
        this.socket.join(brandId);
        return;
      }

      const brand = await getBrandById(brandId);
      if (!brand) throw new Error("Brand not found");

      console.log(
        `[JOIN STREAM] ${username} joined the stream by brandId ${brand.name} id ${brandId}`
      );
      this.socket.join(brandId);
      this.emitToStream(brandId, ServerToClientSocketEvents.STREAM_JOINED, {
        brandId,
        username,
        profilePicture,
      });
    } catch (e) {
      console.error(`[JOIN STREAM] Error joining stream: ${e}`);
      this.emitToStream(brandId, ServerToClientSocketEvents.ERROR, {
        brandId,
        code: 500,
        message: "Error joining stream",
      });
    }
  }
}
