import { SocketHandler } from "./socket-handler";
import type { PaymentConfirmedEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameParticipantStatus } from "@prisma/client";
import {
  getGameParticipant,
  updateGameParticipant,
} from "../lib/prisma/queries/game-participants";

export class PaymentConfirmedHandler extends SocketHandler {
  async handle({ gameId, userId, payment }: PaymentConfirmedEvent) {
    console.log(
      `[PAYMENT] Participant ${userId} confirmed stake in game ${gameId} with txHash: https://basescan.org/tx/${payment.txHash}`
    );
    const gameParticipant = await getGameParticipant(gameId, userId);
    if (!gameParticipant) {
      console.error(
        `[PAYMENT] Game participant ${userId} not found in game ${gameId}`
      );
      return;
    }
    await updateGameParticipant(gameId, userId, {
      status: GameParticipantStatus.READY,
      paid: true,
      paidTxHash: payment.txHash,
    });

    this.emitToGame(gameId, ServerToClientSocketEvents.PARTICIPANT_READY_ACK, {
      gameId,
      userId,
      status: GameParticipantStatus.READY,
    });
  }
}
