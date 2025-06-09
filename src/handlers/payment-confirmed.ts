import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { PaymentConfirmedEvent } from "../types";

export class PaymentConfirmedHandler extends SocketHandler {
  async handle({ gameId, userId }: PaymentConfirmedEvent) {
    console.log(
      `[LOBBY] Participant ${userId} confirmed stake in game ${gameId}`
    );
    await gameRoomManager.updateParticipantReady(gameId, userId, true);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        participants: Array.from(room.participants.values()),
      });
    }
  }
}
