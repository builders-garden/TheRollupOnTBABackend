import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { PaymentConfirmedEvent } from "../types";

export class PaymentConfirmedHandler extends SocketHandler {
  async handle({ gameId, participantId }: PaymentConfirmedEvent) {
    console.log(
      `[LOBBY] Participant ${participantId} confirmed stake in game ${gameId}`
    );
    await gameRoomManager.updateParticipantReady(gameId, participantId, true);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(gameId, "game_update", {
        participants: Array.from(room.participants.values()),
      });
    }
  }
}
