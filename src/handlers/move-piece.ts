import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { MovePieceEvent } from "../types";

export class MovePieceHandler extends SocketHandler {
  async handle({ gameId, playerId, move }: MovePieceEvent) {
    console.log(
      `[GAME] Player ${playerId} moving piece from ${move.from} to ${move.to} in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    if (room.board[x][y] === "") {
      room.board[x][y] = letter;
      await gameRoomManager.updatePlayerBoard(gameId, player.fid, room.board);
      this.emitToGame(gameId, "letter_placed", {
        x,
        y,
        letter,
        gameId,
        player,
      });
    }
  }
}
