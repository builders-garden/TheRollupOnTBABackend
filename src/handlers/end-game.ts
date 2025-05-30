import { SocketHandler } from "./socket-handler";
import type { EndGameEvent } from "../types";

export class EndGameHandler extends SocketHandler {
  async handle({ gameId, playerId, reason }: EndGameEvent): Promise<void> {
    console.log(`[CONNECTION] Disconnecting player: ${this.socket.id}`);
    // await this.endGame(gameId, playerId, reason);
  }
}
