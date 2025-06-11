import { SocketHandler } from "./socket-handler";
import type { EndGameRequestEvent } from "../types";

export class EndGameHandler extends SocketHandler {
  async handle({ gameId, userId, reason }: EndGameRequestEvent): Promise<void> {
    console.log(
      `[CONNECTION] Ending game: ${gameId} by participant: ${userId} with reason: ${reason}`
    );
    // await this.endGame(gameId, userId, reason);
  }
}
