import { gameRoomManager } from "./game-room-manager";
import { SocketHandler } from "./socket-handler";
import type { MovePieceEvent } from "../types";
import { getGameParticipantById } from "../lib/prisma/queries/game-participants";
import { getGameById } from "../lib/prisma/queries/game";

export class MovePieceHandler extends SocketHandler {
  async handle({ gameId, participantId, move }: MovePieceEvent) {
    console.log(
      `[GAME] Participant ${participantId} moving piece from ${move.from} to ${move.to} in game ${gameId}`
    );

    const room = await gameRoomManager.getGameRoom(gameId);
    if (!room) return;

    const game = await getGameById(gameId);
    if (!game) return;

    const participant = await getGameParticipantById(participantId);
    if (!participant) return;

    // TODO check if move is valid
    const validMove = true;
    if (!validMove) return;

    // TODO update game board
    // TODO update game participants
    // TODO update game
    // TODO emit move to all participants
  }
}
