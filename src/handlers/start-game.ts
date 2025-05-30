import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { StartGameEvent } from "../types";

export class StartGameHandler extends SocketHandler {
  async handle({ gameId, playerId }: StartGameEvent) {
    console.log(`[GAME] Starting game ${gameId}`);

    const room = await gameRoomManager.getGameRoom(gameId);
    console.log("room", room);
    if (!room) return;
    const allPlayersReady = Array.from(room.players.values()).every(
      (player) => player.ready
    );
    console.log("allPlayersReady", allPlayersReady);
    if (!allPlayersReady) {
      console.log(`[GAME] Not all players are ready to start game ${gameId}`);
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
      players: Array.from(room.players.values()),
    });
    const newPlayers = Array.from(room.players.values()).map((player) => ({
      ...player,
      availableLetters: "WORDS",
    }));
    console.log("newPlayers", newPlayers);
    this.emitToGame(gameId, "refreshed_available_letters", {
      gameId,
      players: newPlayers,
    });
  }
}
