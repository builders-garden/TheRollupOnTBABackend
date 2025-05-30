import { gameRoomManager } from "./game-room-manager";
import { createGame } from "../lib/prisma/queries/games";
import { getPlayerById } from "../lib/prisma/queries/players";
import { SocketHandler } from "./socket-handler";
import type { CreateGameRequest } from "../types";

export class CreateGameHandler extends SocketHandler {
  async handle({
    game: { mode, option, opponentId },
    playerId,
    amount,
    currency,
    txHash,
    walletAddress,
  }: CreateGameRequest) {
    // check if player is already in a game
    const player = await getPlayerById(playerId);
    if (player.gameId) {
      console.error(`[LOBBY] Player ${playerId} is already in a game`);
      return;
    }

    const game = await createGame({
      mode,
      option,
      opponentId,
      playerId,
      amount,
      currency,
      txHash,
      walletAddress,
    });
    this.socket.join(game.id);

    let room = gameRoomManager.getGameRoom(game.id);
    if (!room) {
      console.log(`[LOBBY] Creating new game room ${game.id}`);
      room = await gameRoomManager.createGameRoom(game.id, player);
    } else {
      await gameRoomManager.addPlayer(game.id, player);
    }

    console.log(`[LOBBY] Player ${playerId} joined game ${game.id}`);
    this.emitToGame(game.id, "player_joined", { playerId });
    this.emitToGame(game.id, "game_update", {
      players: Array.from(room.players.values()),
    });
  }
}
