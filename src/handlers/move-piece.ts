import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { MovePieceEvent } from "../types";

export class MovePieceHandler extends SocketHandler {
  async handle({ gameId, participantId, move }: MovePieceEvent) {
    console.log(
      `[GAME] Participant ${participantId} moving piece from ${move.from} to ${move.to} in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    if (room.board[x][y] === "") {
      room.board[x][y] = letter;
      await gameRoomManager.updateParticipantBoard(
        gameId,
        participantId,
        room.board
      );
      this.emitToGame(gameId, "letter_placed", {
        x,
        y,
        letter,
        gameId,
        participantId,
      });
    }
  }
}
