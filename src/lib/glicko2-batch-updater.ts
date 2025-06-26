import { GameIsWhite, GameResult } from "@prisma/client";
import type { Game } from "../types/database";
import { Glicko2, type Player } from "glicko2";
import {
  getAllUsers,
  getUserGamesInPeriod,
  getOpponentRatingAtPeriodStart,
  upsertGlicko2RatingPeriod,
  updateUserStatisticsGlicko2,
  getPreviousRatingPeriod,
  getLatestGlicko2RatingPeriod,
} from "./prisma/queries/user-statistics";

interface PlayerRating {
  userId: string;
  rating: number;
  deviation: number;
  volatility: number;
}

interface GameMatch {
  playerId: string;
  opponentId: string;
  result: GameResult;
  isPlayerWhite: boolean;
  opponentRating: PlayerRating;
}

/**
 * Batch update Glicko-2 ratings for all players according to official recommendations
 * This should be run at the end of each rating period (weekly)
 */
export class Glicko2BatchUpdater {
  private glicko2: Glicko2;

  constructor() {
    // Initialize Glicko-2 calculator with recommended settings
    this.glicko2 = new Glicko2({
      tau: 0.5, // Volatility change parameter (0.3-1.2 range)
      rating: 1500, // Default rating
      rd: 350, // Default rating deviation
      vol: 0.06, // Default volatility
    });
  }

  /**
   * Process the previous rating period and update all player ratings
   */
  async updateRatingsForPreviousPeriod(): Promise<void> {
    console.log("[GLICKO2 BATCH] Starting weekly rating update...");

    const { start: periodStart, end: periodEnd } = getPreviousRatingPeriod();

    console.log(
      `[GLICKO2 BATCH] Processing period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`
    );

    try {
      // Get all users (including inactive ones for rating decay)
      const allUsers = await getAllUsers();
      console.log(`[GLICKO2 BATCH] Processing ${allUsers.length} users`);

      // Process each user
      const updatedRatings = new Map<string, PlayerRating>();
      const BATCH_SIZE = 100;
      for (let offset = 0; offset < allUsers.length; offset += BATCH_SIZE) {
        console.log(
          `[GLICKO2 BATCH] Processing batch ${
            offset / BATCH_SIZE + 1
          } of ${Math.ceil(allUsers.length / BATCH_SIZE)}`
        );
        const userBatch = allUsers.slice(offset, offset + BATCH_SIZE);
        const batchUpdatedRatings = await this.processBatch(
          userBatch,
          periodStart,
          periodEnd
        );
        console.log(
          `[GLICKO2 BATCH] Batch ${offset / BATCH_SIZE + 1} of ${Math.ceil(
            allUsers.length / BATCH_SIZE
          )} processed`
        );
        for (const [userId, rating] of batchUpdatedRatings) {
          updatedRatings.set(userId, rating);
        }
      }

      // Save all updated ratings to database
      await this.saveUpdatedRatings(updatedRatings, periodStart, periodEnd);

      console.log(
        `[GLICKO2 BATCH] Successfully updated ratings for ${updatedRatings.size} users`
      );
    } catch (error) {
      console.error("[GLICKO2 BATCH] Error during batch update:", error);
      throw error;
    }
  }

  /**
   * Process a batch of users
   */
  private async processBatch(
    users: {
      id: string;
      fid: number;
      username: string;
    }[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<Map<string, PlayerRating>> {
    const updatedRatings = new Map<string, PlayerRating>();
    for (const user of users) {
      const updatedRating = await this.processUserRating(
        user.id,
        periodStart,
        periodEnd
      );
      updatedRatings.set(user.id, updatedRating);
    }
    return updatedRatings;
  }

  /**
   * Process a single user's rating for the given period
   */
  private async processUserRating(
    userId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<PlayerRating> {
    // Get user's current rating (from the previous period)
    const currentRating = await this.getUserCurrentRating(userId, periodStart);

    // Get games played during this period
    const games = await getUserGamesInPeriod(userId, periodStart, periodEnd);

    // If no games played, apply rating decay
    if (games.length === 0) {
      return this.applyRatingDecay(currentRating);
    }

    // Prepare matches for Glicko-2 calculation
    const matches = await this.prepareMatches(userId, games, periodStart);

    // Calculate new rating using Glicko-2
    return this.calculateNewRating(currentRating, matches);
  }

  /**
   * Get user's current rating at the start of the period
   */
  private async getUserCurrentRating(
    userId: string,
    periodStart: Date
  ): Promise<PlayerRating> {
    const latestRating = await getLatestGlicko2RatingPeriod(userId);

    if (latestRating && latestRating.periodStart < periodStart) {
      return {
        userId,
        rating: latestRating.rating,
        deviation: latestRating.deviation,
        volatility: latestRating.volatility,
      };
    }

    // Return default initial rating
    return {
      userId,
      rating: 1500,
      deviation: 350,
      volatility: 0.06,
    };
  }

  /**
   * Apply rating decay for inactive players (increases uncertainty)
   */
  private applyRatingDecay(currentRating: PlayerRating): PlayerRating {
    // Create a dummy player and update without any matches
    const player = this.glicko2.makePlayer(
      currentRating.rating,
      currentRating.deviation,
      currentRating.volatility
    );

    // Update with empty matches array (this applies rating decay)
    this.glicko2.updateRatings([]);

    return {
      userId: currentRating.userId,
      rating: player.getRating(),
      deviation: player.getRd(),
      volatility: player.getVol(),
    };
  }

  /**
   * Prepare matches for Glicko-2 calculation
   */
  private async prepareMatches(
    userId: string,
    games: Game[],
    periodStart: Date
  ): Promise<GameMatch[]> {
    const matches: GameMatch[] = [];

    for (const game of games) {
      if (!game.creator.user || !game.opponent?.user) continue;

      // Determine if user was white or black
      const isCreator = game.creator.user.id === userId;
      const isUserWhite = isCreator
        ? game.isWhite === GameIsWhite.CREATOR
        : game.isWhite === GameIsWhite.OPPONENT;
      const opponent = isCreator ? game.opponent : game.creator;

      if (!opponent?.userId) continue; // Skip bot games for now

      // Get opponent's rating at the start of the period
      const opponentRating = await getOpponentRatingAtPeriodStart(
        opponent.userId,
        periodStart
      );

      matches.push({
        playerId: userId,
        opponentId: opponent.userId,
        result: game.gameResult ?? GameResult.DRAW,
        isPlayerWhite: isUserWhite,
        opponentRating: {
          userId: opponent.userId,
          rating: opponentRating.rating,
          deviation: opponentRating.deviation,
          volatility: opponentRating.volatility,
        },
      });
    }

    return matches;
  }

  /**
   * Calculate new rating using Glicko-2 algorithm
   */
  private calculateNewRating(
    currentRating: PlayerRating,
    matches: GameMatch[]
  ): PlayerRating {
    // Create player with current rating
    const player = this.glicko2.makePlayer(
      currentRating.rating,
      currentRating.deviation,
      currentRating.volatility
    );

    // Create opponents and match results
    const glickoMatches: [Player, Player, number][] = [];

    for (const match of matches) {
      const opponent = this.glicko2.makePlayer(
        match.opponentRating.rating,
        match.opponentRating.deviation,
        match.opponentRating.volatility
      );

      // Convert game result to score from player's perspective
      const score = this.getPlayerScore(
        match.result,
        currentRating.userId,
        match
      );

      glickoMatches.push([player, opponent, score]);
    }

    // Update ratings
    this.glicko2.updateRatings(glickoMatches);

    return {
      userId: currentRating.userId,
      rating: player.getRating(),
      deviation: player.getRd(),
      volatility: player.getVol(),
    };
  }

  /**
   * Convert GameResult to score from player's perspective
   */
  private getPlayerScore(
    result: GameResult,
    playerId: string,
    match: GameMatch
  ): number {
    switch (result) {
      case GameResult.WHITE_WON:
        return playerId === match.playerId ? 1 : 0;
      case GameResult.BLACK_WON:
        return playerId === match.playerId ? 0 : 1;
      case GameResult.DRAW:
        return 0.5;
      default:
        return 0.5; // Treat unknown results as draws
    }
  }

  /**
   * Save all updated ratings to database
   */
  private async saveUpdatedRatings(
    updatedRatings: Map<string, PlayerRating>,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    console.log(
      `[GLICKO2 BATCH] Saving ${updatedRatings.size} updated ratings...`
    );

    const promises = [];

    for (const [userId, rating] of updatedRatings) {
      // Save to rating periods table
      const periodPromise = upsertGlicko2RatingPeriod({
        userId,
        periodStart,
        periodEnd,
        rating: rating.rating,
        deviation: rating.deviation,
        volatility: rating.volatility,
      });

      // Update user statistics with latest values
      const statsPromise = updateUserStatisticsGlicko2({
        userId,
        rating: rating.rating,
        deviation: rating.deviation,
        volatility: rating.volatility,
      });

      promises.push(periodPromise, statsPromise);
    }

    await Promise.all(promises);
    console.log("[GLICKO2 BATCH] All ratings saved successfully");
  }

  /**
   * Manual trigger for testing purposes
   */
  async manualUpdate(): Promise<void> {
    console.log("[GLICKO2 BATCH] Manual update triggered");
    await this.updateRatingsForPreviousPeriod();
  }
}

// Export singleton instance
export const glicko2BatchUpdater = new Glicko2BatchUpdater();
