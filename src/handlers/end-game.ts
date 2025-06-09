import { SocketHandler } from "./socket-handler";
import type { EndGameRequest } from "../types";

export class EndGameHandler extends SocketHandler {
  async handle({ gameId, userId, reason }: EndGameRequest): Promise<void> {
    console.log(
      `[CONNECTION] Ending game: ${gameId} by participant: ${userId} with reason: ${reason}`
    );
    // await this.endGame(gameId, userId, reason);
  }
}
