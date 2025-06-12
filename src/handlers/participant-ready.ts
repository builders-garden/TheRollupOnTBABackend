import { updateGameParticipant } from "../lib/prisma/queries/game-participants";
import { SocketHandler } from "./socket-handler";
import type { ParticipantReadyEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";
import { GameParticipantStatus, GameState } from "@prisma/client";
import { updateGame } from "../lib/prisma/queries/game";
import { ChessTimerManager } from "../lib/timer-manager";
import { initializeGameTimers } from "../lib/timer-persistence";
import { getGameOptionTime } from "../lib/utils";

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

        // 3.1 Initialize and start timer (only if not already exists)
        const chessTimerManager = ChessTimerManager.getInstance();
        const game = updatedGameParticipant.game;

        // Check if timer already exists for this game
        const existingTimer = chessTimerManager.getTimer(gameId);
        if (!existingTimer) {
          // Get time control settings
          const { duration } = getGameOptionTime(
            game.gameMode,
            game.gameOption
          );

          // Initialize timer values in database
          await initializeGameTimers(gameId, duration);

          // Create and start timer
          const timer = chessTimerManager.createTimer(
            gameId,
            game.gameMode,
            game.gameOption,
            duration,
            duration,
            "w" // white moves first
          );

          if (timer) {
            chessTimerManager.startTimer(gameId, "w");
            console.log(`[TIMER] Started timer for game ${gameId}`);
          }
        } else {
          console.log(
            `[TIMER] Timer already exists for game ${gameId}, not creating duplicate`
          );
        }

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
