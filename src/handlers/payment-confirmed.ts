import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { PaymentConfirmedAckEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameParticipantStatus } from "@prisma/client";

export class PaymentConfirmedHandler extends SocketHandler {
  async handle({ gameId, userId }: PaymentConfirmedAckEvent) {
    console.log(
      `[LOBBY] Participant ${userId} confirmed stake in game ${gameId}`
    );
    await gameRoomManager.updateParticipantReady(gameId, userId, true);
    const room = await gameRoomManager.getGameRoom(gameId);
    if (room) {
      this.emitToGame(
        gameId,
        ServerToClientSocketEvents.PARTICIPANT_READY_ACK,
        {
          gameId,
          userId,
          status: GameParticipantStatus.READY,
        }
      );
    }
  }
}
