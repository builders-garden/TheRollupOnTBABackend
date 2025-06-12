import { updateGameParticipant } from "../lib/prisma/queries/game-participants";
import { SocketHandler } from "./socket-handler";
import type { ParticipantReadyEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameParticipantStatus, GameState } from "@prisma/client";
import { updateGame } from "../lib/prisma/queries/game";

export class ParticipantReadyHandler extends SocketHandler {
  async handle({ gameId, userId }: ParticipantReadyEvent) {
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
        this.emitToGame(gameId, ServerToClientSocketEvents.START_GAME, {
          gameId,
          gameState: GameState.ACTIVE,
        });
      } else {
        // 3 update game state to waiting
        await updateGame(gameId, { gameState: GameState.WAITING });
        // 4 emit to all participants that the game is not ready
        this.emitToGame(
          gameId,
          ServerToClientSocketEvents.PARTICIPANT_READY_ACK,
          {
            gameId,
            userId,
            status: updatedGameParticipant.status,
          }
        );
      }
    } catch (e) {
      console.error(
        `[PARTICIPANT READY] Error updating game participant: ${e}`
      );
      this.emitToGame(this.socket.id, ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error updating game participant",
      });
    }
  }
}
