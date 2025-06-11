import { SocketHandler } from "./socket-handler";
import type { AcceptGameEndResponseEvent } from "../types";

export class AcceptGameEndResponseHandler extends SocketHandler {
  async handle({
    gameId,
    userId,
    accepted,
  }: AcceptGameEndResponseEvent): Promise<void> {
    console.log(
      `[CONNECTION] Accepting game end: ${gameId} by participant: ${userId} with accepted: ${accepted}`
    );
    // await this.endGame(gameId, userId, reason);
  }
}
