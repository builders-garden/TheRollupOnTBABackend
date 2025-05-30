import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { PaymentConfirmedEvent } from "../types";

export class PaymentConfirmedHandler extends SocketHandler {
  async handle({
    gameId,
    playerId,
    amount,
    currency,
    txHash,
    walletAddress,
  }: PaymentConfirmedEvent) {
    console.log(`[LOBBY] Player ${playerId} confirmed stake in game ${gameId}`);
    await gameRoomManager.updatePlayerReady(gameId, playerId, true);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        players: Array.from(room.players.values()),
      });
    }
  }
}
