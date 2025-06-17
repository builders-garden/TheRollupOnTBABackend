import { SocketHandler } from "./socket-handler";
import {
  getGameParticipantsBySocketId,
  updateGameParticipant,
} from "../lib/prisma/queries/game-participants";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameParticipantStatus } from "@prisma/client";

export class DisconnectParticipantHandler extends SocketHandler {
  async handle(): Promise<void> {
    console.log(`[DISCONNECT] Disconnecting participant: ${this.socket.id}`);

    // get all game participants by socket id
    const gameParticipants = await getGameParticipantsBySocketId(
      this.socket.id
    );

    if (gameParticipants.length === 0) {
      console.log(
        `[DISCONNECT] No game participant found for socket id: ${this.socket.id}`
      );
      return;
    }

    // initiate game pause for each client

    for (const gameParticipant of gameParticipants) {
      console.log(`[DISCONNECT] Disconnected participant: ${this.socket.id}`);

      // update game participant status to waiting
      await updateGameParticipant(
        gameParticipant.gameId,
        gameParticipant.userId,
        {
          status: GameParticipantStatus.LEFT,
        }
      );

      this.emitToGame(
        gameParticipant.gameId,
        ServerToClientSocketEvents.PARTICIPANT_LEFT,
        {
          gameId: gameParticipant.gameId,
          userId: gameParticipant.userId,
          status: GameParticipantStatus.WAITING,
        }
      );
    }
  }
}
// retrieve game by socket id
// if game is not found or game already ended, return
// else notify participant in the game
