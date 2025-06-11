import { updateGameParticipant } from "../lib/prisma/queries/game-participants";
import { SocketHandler } from "./socket-handler";
import type { ParticipantReadyRequest } from "../types";
import { SocketEvents } from "../types/enums";
import { GameParticipantStatus, GameState } from "@prisma/client";
import { updateGame } from "../lib/prisma/queries/game";

export class ParticipantReadyHandler extends SocketHandler {
  async handle({ gameId, userId }: ParticipantReadyRequest) {
    try {
      // 1 update game participant status to ready
      const updatedGameParticipant = await updateGameParticipant(
        gameId,
        userId,
        {
          status: GameParticipantStatus.READY,
        }
      );
      // 2 let user join the room
      this.socket.join(gameId);
      console.log(
        `[PARTICIPANT READY] user ${userId} ready for game ${gameId}`
      );
      const participants = updatedGameParticipant.game.participants;
      const areAllParticipantsReady = participants.every(
        (participant) => participant.status === GameParticipantStatus.READY
      );
      if (areAllParticipantsReady) {
        // 3 update game state to active
        await updateGame(gameId, { gameState: GameState.ACTIVE });
        // 4 start the game
        this.emitToGame(gameId, SocketEvents.START_GAME, { gameId });
      } else {
        // 3 update game state to waiting
        await updateGame(gameId, { gameState: GameState.WAITING });
        // 4 emit to all participants that the game is not ready
        this.emitToGame(gameId, SocketEvents.PARTICIPANT_READY, {
          gameId,
          userId,
          status: updatedGameParticipant.status,
        });
      }
    } catch (e) {
      console.error(
        `[PARTICIPANT READY] Error updating game participant: ${e}`
      );
      this.emitToGame(this.socket.id, SocketEvents.ERROR, {
        code: 500,
        message: "Error updating game participant",
      });
    }
  }
}
