import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { StartGameEvent } from "../types";

export class StartGameHandler extends SocketHandler {
  async handle({ gameId }: StartGameEvent) {
    console.log(`[GAME] Starting game ${gameId}`);

    const room = await gameRoomManager.getGameRoom(gameId);
    console.log("room", room);
    if (!room) return;
    const allParticipantsReady = Array.from(room.participants.values()).every(
      (participant) => participant.ready
    );
    console.log("allParticipantsReady", allParticipantsReady);
    if (!allParticipantsReady) {
      console.log(
        `[GAME] Not all participants are ready to start game ${gameId}`
      );
      return;
    }

    // Start game timer
    room.timer = setInterval(() => {
      room.timeRemaining--;
      this.emitToGame(gameId, "timer_tick", room.timeRemaining);
      if (room.timeRemaining <= 0) {
        console.log(`[GAME] Game ${gameId} ended due to time expiration`);
        clearInterval(room.timer!);
        this.emitToGame(gameId, "game_ended", {});
      }
    }, 1000);
    // populate center of the board with a random word
    await gameRoomManager.initBoard(gameId);
    this.emitToGame(gameId, "game_started", {
      board: room.board,
      timeRemaining: room.timeRemaining,
      participants: Array.from(room.participants.values()),
    });
    const newParticipant = Array.from(room.participants.values()).map(
      (participant) => ({
        ...participant,
        availableLetters: "WORDS",
      })
    );
    console.log("newParticipant", newParticipant);
    this.emitToGame(gameId, "participant_ready", {
      gameId,
      newParticipant,
    });
  }
}
