import { prisma } from "../client";
import type { CreateGameRequest } from "../../../types";
import { GameParticipantColor, type Prisma } from "@prisma/client";
import { getUserByFid, getOrCreateUserByFid } from "./user";

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
 * Create a game.
 *
 * This function creates a game.
 * It takes a game, payment, and participants.
 *
 * @param game - The game to create
 * @param payment - The payment for the game
 * @param participants - The participants in the game
 * @returns The created game
 */
export async function createGame({
  game,
  payment,
  participants,
}: CreateGameRequest) {
  const creator = participants.find((p) => p.isCreator);
  const opponent = participants.find((p) => !p.isCreator);
  if (!creator || !opponent) throw new Error("Participants not found");
  const creatorUser = await getUserByFid(creator.participantFid);
  if (!creatorUser) throw new Error("Creator user not found");
  const opponentUser = await getOrCreateUserByFid(
    opponent.participantFid,
    creator.participantFid
  );
  if (!opponentUser) throw new Error("Opponent user not found");

  const randomNumber = Math.random();

  const whitePlayerId = randomNumber < 0.5 ? creatorUser.id : opponentUser.id;
  const whitePaid = randomNumber < 0.5;
  const whitePaidTxHash = randomNumber < 0.5 ? payment.txHash : null;

  const blackPlayerId = randomNumber < 0.5 ? opponentUser.id : creatorUser.id;
  const blackPaid = randomNumber >= 0.5;
  const blackPaidTxHash = randomNumber >= 0.5 ? payment.txHash : null;

  return prisma.game.create({
    data: {
      contractId: game.contractId ?? undefined,
      // game details
      gameMode: game.mode ?? undefined,
      gameOption: game.option ?? undefined,
      wageAmount: Number(payment.amount),
      // participants
      participants: {
        create: [
          {
            userId: whitePlayerId,
            color: GameParticipantColor.WHITE,
            isCreator: creatorUser.id === whitePlayerId,
            paid: whitePaid,
            paidTxHash: whitePaidTxHash,
          },
          {
            userId: blackPlayerId,
            color: GameParticipantColor.BLACK,
            isCreator: creatorUser.id === blackPlayerId,
            paid: blackPaid,
            paidTxHash: blackPaidTxHash,
          },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });
}
