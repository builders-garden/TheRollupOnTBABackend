import { createGame } from "../lib/prisma/queries/game";
import { SocketHandler } from "./socket-handler";
import type { CreateGameRequestEvent } from "../types";
import { ServerToClientSocketEvents } from "../types/enums";

export class CreateGameHandler extends SocketHandler {
  async handle({
    game: { mode, option, contractId },
    participants,
    payment,
  }: CreateGameRequestEvent) {
    try {
      // 1 save game to db
      const newGame = await createGame({
        game: { mode, option, contractId },
        payment,
        participants,
        creatorSocketId: this.socket.id,
      });
      // 2 creator join the room
      this.socket.join(newGame.id);
      console.log(
        `[CREATE GAME] game created ${newGame.id} between ${participants[0].participantFid} and ${participants[1].participantFid}`
      );
      this.emitToGame(
        newGame.id,
        ServerToClientSocketEvents.CREATE_GAME_RESPONSE,
        {
          gameId: newGame.id,
          status: newGame.gameState,
          participants: newGame.participants,
        }
      );
    } catch (e) {
      console.error(`[CREATE GAME] Error creating game: ${e}`);
      this.emitToGame(this.socket.id, ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error creating game",
      });
    }
  }
}
