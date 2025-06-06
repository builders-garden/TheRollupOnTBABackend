import { createGame } from "../lib/prisma/queries/game";
import { SocketHandler } from "./socket-handler";
import type { CreateGameRequest } from "../types";
import { SocketEvents } from "../types/enums";

export class CreateGameHandler extends SocketHandler {
  async handle({
    game: { mode, option, contractId },
    participants,
    payment,
  }: CreateGameRequest) {
    try {
      // 1 save game to db
      const newGame = await createGame({
        game: { mode, option, contractId },
        payment,
        participants,
      });
      // 2 creator join the room
      this.socket.join(newGame.id);
      console.log(
        `[CREATE GAME] game created ${newGame.id} between ${participants[0].participantFid} and ${participants[1].participantFid}`
      );
      this.emitToGame(newGame.id, SocketEvents.CREATE_GAME_RESPONSE, {
        gameId: newGame.id,
        status: newGame.gameState,
        participants: newGame.participants,
      });
    } catch (e) {
      console.error(`[CREATE GAME] Error creating game: ${e}`);
      this.emitToGame(this.socket.id, SocketEvents.ERROR, {
        code: 500,
        message: "Error creating game",
      });
    }
  }
}
