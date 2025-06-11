import { prisma } from "../client";
import type { CreateGameRequestEvent } from "../../../types";
import {
  GameParticipantColor,
  GameParticipantStatus,
  type Prisma,
} from "@prisma/client";
import { getUserByFid, getOrCreateUserByFid } from "./user";
import { getGameOptionTime } from "../../utils";

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
      participants: {
        include: {
          user: true,
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
  creatorSocketId,
}: CreateGameRequestEvent & { creatorSocketId: string }) {
  const creator = participants.find((p) => p.isCreator);
  const opponent = participants.find((p) => !p.isCreator);
  if (!creator || !opponent) throw new Error("Participants not found");
  const [creatorUser, opponentUser] = await Promise.all([
    getUserByFid(creator.participantFid),
    getOrCreateUserByFid(opponent.participantFid, creator.participantFid),
  ]);
  if (!creatorUser) throw new Error("Creator user not found");
  if (!opponentUser) throw new Error("Opponent user not found");

  const randomNumber = Math.random();

  const whitePlayerId = randomNumber < 0.5 ? creatorUser.id : opponentUser.id;
  const whitePaidTxHash = randomNumber < 0.5 ? payment.txHash : null;

  const blackPlayerId = randomNumber < 0.5 ? opponentUser.id : creatorUser.id;
  const blackPaidTxHash = randomNumber >= 0.5 ? payment.txHash : null;

  const { duration } = getGameOptionTime(game.mode, game.option);

  return prisma.game.create({
    data: {
      contractId: game.contractId ?? undefined,
      // game details
      gameMode: game.mode ?? undefined,
      gameOption: game.option ?? undefined,
      wageAmount: payment.amountUSDC,
      // participants
      participants: {
        create: [
          {
            userId: whitePlayerId,
            color: GameParticipantColor.WHITE,
            isCreator: creatorUser.id === whitePlayerId,
            paid: creatorUser.id === whitePlayerId,
            paidTxHash: whitePaidTxHash,
            socketId:
              creatorUser.id === whitePlayerId ? creatorSocketId : undefined,
            status:
              creatorUser.id === whitePlayerId
                ? GameParticipantStatus.JOINED
                : GameParticipantStatus.WAITING,
            timeLeft: duration,
          },
          {
            userId: blackPlayerId,
            color: GameParticipantColor.BLACK,
            isCreator: creatorUser.id === blackPlayerId,
            paid: creatorUser.id === blackPlayerId,
            paidTxHash: blackPaidTxHash,
            socketId:
              creatorUser.id === blackPlayerId ? creatorSocketId : undefined,
            status:
              creatorUser.id === blackPlayerId
                ? GameParticipantStatus.JOINED
                : GameParticipantStatus.WAITING,
            timeLeft: duration,
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
