import { prisma } from "../client";
import type { Prisma } from "@prisma/client";
import type { Move } from "chess.js";

/**
 * Get a game by its id.
 *
 * This function gets a game by its id.
 * It takes a game id and returns the game if found.
 *
 * @param gameId - The id of the game to get
 * @returns The game if found, otherwise null
 */
export function getGameById(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      creator: {
        include: {
          user: {
            include: {
              statistics: true,
            },
          },
        },
      },
      opponent: {
        include: {
          user: {
            include: {
              statistics: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Update a game.
 *
 * This function updates a game.
 * It takes a game id and a set of updates to apply to the game.
 *
 * @param gameId - The id of the game to update
 * @param game - The updates to apply to the game
 * @returns The updated game
 */
export function updateGame(gameId: string, game: Prisma.GameUpdateInput) {
  return prisma.game.update({
    where: { id: gameId },
    data: game,
  });
}

/**
 * Update a game creating a move.
 *
 * This function updates a game creating a move.
 * It takes a game id and a move to apply to the game.
 *
 * @param gameId - The id of the game to update
 * @param userId - The id of the user who made the move
 * @param newFen - The new FEN of the game
 * @param move - The move to apply to the game
 * @returns The updated game
 */
export function updateGameWithMove(
  gameId: string,
  userId: string,
  newFen: string,
  move: Move
) {
  return prisma.game.update({
    where: { id: gameId },
    data: {
      currentFen: newFen,
      moves: {
        create: [
          {
            userId,
            move: JSON.stringify(move),
            fen: newFen,
            san: move.san,
            lan: move.lan,
          },
        ],
      },
      totalMoves: {
        increment: 1,
      },
    },
  });
}
