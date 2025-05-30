import { gameRoomManager } from "./game-room-manager";
import { createGame } from "../lib/prisma/queries/games";
import { getParticipantById } from "../lib/prisma/queries/participants";
import { SocketHandler } from "./socket-handler";
import type { CreateGameRequest } from "../types";

export class CreateGameHandler extends SocketHandler {
  async handle({
    game: { mode, option, opponentId },
    participants,
    payment,
  }: CreateGameRequest) {
    // check if participant is already in a game
    const creatorId = participants.find((p) => p.isCreator)?.participantId;
    if (!creatorId) {
      console.error("[LOBBY] No creator found in participants");
      this.emitToGame(this.socket.id, "error", {
        code: 400,
        message: "No creator found in participants",
      });
      return;
    }
    const creator = await getParticipantById(creatorId);
    if (creator.gameId) {
      console.error(`[LOBBY] Participant ${creatorId} is already in a game`);
      this.emitToGame(this.socket.id, "error", {
        code: 400,
        message: "Participant is already in a game",
      });
      return;
    }
    console.log(`[LOBBY] Creating game for participant: ${creatorId}`);

    const game = await createGame({
      mode,
      option,
      opponentId,
      participantId: creatorId,
      amount: payment.amount,
      currency: payment.currencyAddress,
      txHash: payment.txHash,
      walletAddress: payment.walletAddress,
    });
    this.socket.join(game.id);

    let room = gameRoomManager.getGameRoom(game.id);
    if (!room) {
      console.log(`[LOBBY] Creating new game room ${game.id}`);
      room = await gameRoomManager.createGameRoom(game.id, creator);
    } else {
      await gameRoomManager.addParticipant(game.id, creator);
    }

    console.log(`[LOBBY] participant ${creatorId} joined game ${game.id}`);
    this.emitToGame(game.id, "participant_joined", {
      participantId: creatorId,
    });
    this.emitToGame(game.id, "game_update", {
      participants: Array.from(room.participants.values()),
    });
  }
}
