import { prisma } from "../client";
import { GameState, type Prisma } from "@prisma/client";

/**
 * Update a user's statistics.
 *
 * This function updates a user's statistics.
 * It takes a user id and a set of updates to apply to the user's statistics.
 *
 * @param userId - The id of the user to update
 * @param updates - The updates to apply to the user's statistics
 * @returns The updated user statistics
 */
export const updateUserStatistics = async (
  userId: string,
  updates: Prisma.UserStatisticsUpdateInput
) => {
  return prisma.userStatistics.update({
    where: { userId },
    data: updates,
  });
};

/**
 * Get the latest Glicko-2 rating period for a user
 */
export async function getLatestGlicko2RatingPeriod(userId: string) {
  return prisma.glicko2RatingPeriod.findFirst({
    where: { userId },
    orderBy: { periodStart: "desc" },
  });
}

/**
 * Get all users who played games in a specific period
 */
export async function getUsersWithGamesInPeriod(
  periodStart: Date,
  periodEnd: Date
) {
  const usersWithGames = await prisma.user.findMany({
    where: {
      gameParticipants: {
        some: {
          OR: [
            {
              gameCreator: {
                some: { endedAt: { gte: periodStart, lt: periodEnd } },
              },
            },
            {
              gameOpponent: {
                some: { endedAt: { gte: periodStart, lt: periodEnd } },
              },
            },
          ],
        },
      },
    },
    select: {
      id: true,
      fid: true,
      username: true,
    },
  });

  return usersWithGames;
}

/**
 * Get all users (for rating decay of inactive players)
 */
export async function getAllUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      fid: true,
      username: true,
    },
  });
}

/**
 * Get games played by a user in a specific period
 */
export async function getUserGamesInPeriod(
  userId: string,
  periodStart: Date,
  periodEnd: Date
) {
  return prisma.game.findMany({
    where: {
      endedAt: { gte: periodStart, lt: periodEnd },
      gameState: GameState.ENDED,
      OR: [{ creator: { userId } }, { opponent: { userId } }],
    },
    include: {
      creator: {
        include: {
          user: { include: { statistics: true } },
          bot: true,
        },
      },
      opponent: {
        include: {
          user: { include: { statistics: true } },
          bot: true,
        },
      },
    },
  });
}

/**
 * Get opponent's rating at the start of the period
 */
export async function getOpponentRatingAtPeriodStart(
  opponentId: string,
  periodStart: Date
) {
  // First try to get rating from the previous period
  const previousRating = await prisma.glicko2RatingPeriod.findFirst({
    where: {
      userId: opponentId,
      periodStart: { lt: periodStart },
    },
    orderBy: { periodStart: "desc" },
  });

  if (previousRating) {
    return {
      rating: previousRating.rating,
      deviation: previousRating.deviation,
      volatility: previousRating.volatility,
    };
  }

  // If no previous rating, use default initial values
  return {
    rating: 1500,
    deviation: 350,
    volatility: 0.06,
  };
}

/**
 * Create or update a Glicko-2 rating period for a user
 */
export async function upsertGlicko2RatingPeriod({
  userId,
  periodStart,
  periodEnd,
  rating,
  deviation,
  volatility,
}: {
  userId: string;
  periodStart: Date;
  periodEnd: Date;
  rating: number;
  deviation: number;
  volatility: number;
}) {
  return prisma.glicko2RatingPeriod.upsert({
    where: {
      userId_periodStart: {
        userId,
        periodStart,
      },
    },
    create: {
      userId,
      periodStart,
      periodEnd,
      rating,
      deviation,
      volatility,
    },
    update: {
      periodEnd,
      rating,
      deviation,
      volatility,
    },
  });
}

/**
 * Update UserStatistics with latest Glicko-2 values
 */
export async function updateUserStatisticsGlicko2({
  userId,
  rating,
  deviation,
  volatility,
}: {
  userId: string;
  rating: number;
  deviation: number;
  volatility: number;
}) {
  return prisma.userStatistics.upsert({
    where: { userId },
    create: {
      userId,
      glicko2Rating: rating,
      glicko2Deviation: deviation,
      glicko2Volatility: volatility,
      glicko2LastUpdate: new Date(),
    },
    update: {
      glicko2Rating: rating,
      glicko2Deviation: deviation,
      glicko2Volatility: volatility,
      glicko2LastUpdate: new Date(),
    },
  });
}

/**
 * Get the current rating period boundaries (start of week to end of week)
 */
export function getCurrentRatingPeriod(): { start: Date; end: Date } {
  const now = new Date();

  // Get the start of the current week (Monday at 00:00:00)
  const startOfWeek = new Date(now);
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday to 6, others to day-1
  startOfWeek.setDate(now.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);

  // Get the end of the current week (Sunday at 23:59:59)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  endOfWeek.setHours(0, 0, 0, 0); // Start of next week

  return {
    start: startOfWeek,
    end: endOfWeek,
  };
}

/**
 * Get the previous rating period boundaries
 */
export function getPreviousRatingPeriod(): { start: Date; end: Date } {
  const current = getCurrentRatingPeriod();
  const start = new Date(current.start);
  start.setDate(start.getDate() - 7);

  const end = new Date(current.start);

  return { start, end };
}

/**
 * Bulk update multiple users' statistics using Prisma transaction
 * More efficient than separate queries and maintains type safety
 */
export const bulkUpdateUserStatistics = async (
  updates: Array<{
    userId: string;
    data: Prisma.UserStatisticsUpdateInput;
  }>
) => {
  if (updates.length === 0) return;

  return prisma.$transaction(
    updates.map((update) =>
      prisma.userStatistics.update({
        where: { userId: update.userId },
        data: update.data,
      })
    )
  );
};
