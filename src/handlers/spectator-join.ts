import { getGameByIdWithSpectators } from "../lib/prisma/queries/game";
import { addGameSpectator } from "../lib/prisma/queries/game-spectator";
import { getUserById } from "../lib/prisma/queries/user";
import { ServerToClientSocketEvents } from "../types/enums";
import type { SpectatorJoinEvent } from "../types/socket/client-to-server";
import { SocketHandler } from "./socket-handler";

export class SpectatorJoinHandler extends SocketHandler {
  async handle({ gameId, userId }: SpectatorJoinEvent) {
    try {
      // 0 check game state
      const [game, user] = await Promise.all([
        getGameByIdWithSpectators(gameId),
        getUserById(userId),
      ]);
      if (!game) {
        console.error(`[SPECTATOR JOIN] Game ${gameId} not found`);
        return;
      }

      if (!user) {
        console.error(`[SPECTATOR JOIN] User ${userId} not found`);
        return;
      }

      // 2 let user join the room
      this.socket.join(gameId);
      console.log(`[SPECTATOR JOIN] user ${userId} joined game ${gameId}`);

      const userIsAlreadySpectator = game.spectators.find(
        (spectator) => spectator.userId === userId
      );
      // add user to spectators list, if not already a spectator
      if (!userIsAlreadySpectator) {
        const newSpectator = await addGameSpectator(gameId, userId);
        // Always emit SPECTATOR_JOIN_ACK when a spectator joins
        this.emitToGame(gameId, ServerToClientSocketEvents.SPECTATOR_JOIN_ACK, {
          gameId,
          spectator: {
            id: newSpectator.id,
            user: newSpectator.user,
          },
        });
      } else {
        this.emitToGame(gameId, ServerToClientSocketEvents.SPECTATOR_JOIN_ACK, {
          gameId,
          spectator: {
            id: userIsAlreadySpectator.id,
            user: userIsAlreadySpectator.user,
          },
        });
      }
    } catch (e) {
      console.error(`[SPECTATOR JOIN] Error updating game: ${e}`);
      this.emitToGame(this.socket.id, ServerToClientSocketEvents.ERROR, {
        code: 500,
        message: "Error updating game participant",
      });
    }
  }
}
