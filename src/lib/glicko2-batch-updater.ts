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

interface ProcessingResult {
  successful: PlayerRating[];
  failed: FailedUserProcessing[];
  totalProcessed: number;
}

interface FailedUserProcessing {
  userId: string;
  username?: string;
  error: string;
  retryCount: number;
  isRetryable: boolean;
}

interface BatchProcessingStats {
  totalUsers: number;
  successfullyProcessed: number;
  failedProcessing: number;
  successfullySaved: number;
  failedSaving: number;
  skippedRetries: number;
}

/**
 * Batch update Glicko-2 ratings for all players according to official recommendations
 * This should be run at the end of each rating period (weekly)
 */
export class Glicko2BatchUpdater {
  private glicko2: Glicko2;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY_MS = 1000;
  private readonly MAX_FAILURE_RATE = 0.1; // Stop processing if more than 10% of users fail

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
  async updateRatingsForPreviousPeriod(): Promise<BatchProcessingStats> {
    console.log("[GLICKO2 BATCH] Starting weekly rating update...");

    const { start: periodStart, end: periodEnd } = getPreviousRatingPeriod();

    console.log(
      `[GLICKO2 BATCH] Processing period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`
    );

    const stats: BatchProcessingStats = {
      totalUsers: 0,
      successfullyProcessed: 0,
      failedProcessing: 0,
      successfullySaved: 0,
      failedSaving: 0,
      skippedRetries: 0,
    };

    try {
      // Get all users (including inactive ones for rating decay)
      const allUsers = await getAllUsers();
      stats.totalUsers = allUsers.length;
      console.log(`[GLICKO2 BATCH] Processing ${allUsers.length} users`);

      if (allUsers.length === 0) {
        console.log("[GLICKO2 BATCH] No users to process");
        return stats;
      }

      // Process users in batches with error handling
      const processingResult = await this.processAllUsersBatches(
        allUsers,
        periodStart,
        periodEnd,
        stats
      );

      // Check if we should continue with saving based on failure rate
      const failureRate = processingResult.failed.length / allUsers.length;
      if (failureRate > this.MAX_FAILURE_RATE) {
        throw new Error(
          `High failure rate detected: ${(failureRate * 100).toFixed(1)}% (${
            processingResult.failed.length
          }/${allUsers.length}). Aborting batch update.`
        );
      }

      // Save successfully processed ratings
      if (processingResult.successful.length > 0) {
        const saveResult = await this.saveUpdatedRatingsWithErrorHandling(
          processingResult.successful,
          periodStart,
          periodEnd
        );
        stats.successfullySaved = saveResult.successful;
        stats.failedSaving = saveResult.failed;
      }

      // Log final statistics
      this.logFinalStatistics(stats, processingResult);

      console.log(
        `[GLICKO2 BATCH] Batch update completed. ${stats.successfullySaved} users updated successfully.`
      );

      return stats;
    } catch (error) {
      console.error(
        "[GLICKO2 BATCH] Critical error during batch update:",
        error
      );
      throw error;
    }
  }

  /**
   * Process all users in batches with comprehensive error handling
   */
  private async processAllUsersBatches(
    allUsers: { id: string; fid: number; username: string }[],
    periodStart: Date,
    periodEnd: Date,
    stats: BatchProcessingStats
  ): Promise<ProcessingResult> {
    const result: ProcessingResult = {
      successful: [],
      failed: [],
      totalProcessed: 0,
    };

    const BATCH_SIZE = 100;
    for (let offset = 0; offset < allUsers.length; offset += BATCH_SIZE) {
      const batchNumber = Math.floor(offset / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(allUsers.length / BATCH_SIZE);

      console.log(
        `[GLICKO2 BATCH] Processing batch ${batchNumber} of ${totalBatches}`
      );

      const userBatch = allUsers.slice(offset, offset + BATCH_SIZE);

      try {
        const batchResult = await this.processBatchWithErrorHandling(
          userBatch,
          periodStart,
          periodEnd
        );

        // Accumulate results
        result.successful.push(...batchResult.successful);
        result.failed.push(...batchResult.failed);
        result.totalProcessed += batchResult.totalProcessed;

        // Update stats
        stats.successfullyProcessed += batchResult.successful.length;
        stats.failedProcessing += batchResult.failed.length;

        console.log(
          `[GLICKO2 BATCH] Batch ${batchNumber} completed: ${batchResult.successful.length} successful, ${batchResult.failed.length} failed`
        );

        // Check if we should stop due to high failure rate in this batch
        const batchFailureRate = batchResult.failed.length / userBatch.length;
        if (batchFailureRate > this.MAX_FAILURE_RATE * 2) {
          // Double the threshold for individual batches
          console.warn(
            `[GLICKO2 BATCH] High failure rate in batch ${batchNumber}: ${(
              batchFailureRate * 100
            ).toFixed(1)}%`
          );
        }
      } catch (error) {
        console.error(
          `[GLICKO2 BATCH] Critical error in batch ${batchNumber}:`,
          error
        );
        // Mark entire batch as failed
        const batchFailures = userBatch.map((user) => ({
          userId: user.id,
          username: user.username,
          error: `Batch processing error: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          retryCount: 0,
          isRetryable: false,
        }));
        result.failed.push(...batchFailures);
        stats.failedProcessing += batchFailures.length;
      }
    }

    return result;
  }

  /**
   * Process a batch of users with individual error handling
   */
  private async processBatchWithErrorHandling(
    users: { id: string; fid: number; username: string }[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<ProcessingResult> {
    const result = {
      successful: [],
      failed: [],
      totalProcessed: users.length,
    } as ProcessingResult;

    // Process users in parallel within the batch, with individual error handling
    const userPromises = users.map(async (user) => {
      try {
        const updatedRating = await this.processUserRatingWithRetry(
          user,
          periodStart,
          periodEnd
        );
        return { success: true, rating: updatedRating, user };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[GLICKO2 BATCH] Failed to process user ${user.username} (${user.id}):`,
          errorMessage
        );

        return {
          success: false,
          error: {
            userId: user.id,
            username: user.username,
            error: errorMessage,
            retryCount: this.MAX_RETRIES,
            isRetryable: this.isRetryableError(error),
          },
          user,
        };
      }
    });

    const results = await Promise.allSettled(userPromises);

    for (const promiseResult of results) {
      if (promiseResult.status === "fulfilled") {
        const userResult = promiseResult.value;
        if (userResult.success && userResult.rating) {
          result.successful.push(userResult.rating);
        } else {
          if (userResult.error) {
            result.failed.push(userResult.error);
          }
        }
      } else {
        // This shouldn't happen since we're catching errors above, but just in case
        result.failed.push({
          userId: "unknown",
          username: "unknown",
          error: `Promise rejected: ${promiseResult.reason}`,
          retryCount: 0,
          isRetryable: false,
        });
      }
    }

    return result;
  }

  /**
   * Process a single user's rating with retry mechanism
   */
  private async processUserRatingWithRetry(
    user: { id: string; fid: number; username: string },
    periodStart: Date,
    periodEnd: Date,
    attempt = 1
  ): Promise<PlayerRating> {
    try {
      return await this.processUserRating(user.id, periodStart, periodEnd);
    } catch (error) {
      if (attempt < this.MAX_RETRIES && this.isRetryableError(error)) {
        console.warn(
          `[GLICKO2 BATCH] Retrying user ${user.username} (attempt ${
            attempt + 1
          }/${this.MAX_RETRIES})`
        );

        // Wait before retrying (exponential backoff)
        await this.delay(this.RETRY_DELAY_MS * 2 ** (attempt - 1));

        return this.processUserRatingWithRetry(
          user,
          periodStart,
          periodEnd,
          attempt + 1
        );
      }

      throw error;
    }
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (!error) return false;

    const errorMessage =
      error instanceof Error
        ? error.message.toLowerCase()
        : String(error).toLowerCase();

    // Network/connection errors are retryable
    const retryablePatterns = [
      "timeout",
      "connection",
      "network",
      "econnreset",
      "enotfound",
      "econnrefused",
      "socket hang up",
      "temporary",
    ];

    return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
  }

  /**
   * Save updated ratings with error handling using Promise.allSettled
   */
  private async saveUpdatedRatingsWithErrorHandling(
    updatedRatings: PlayerRating[],
    periodStart: Date,
    periodEnd: Date
  ): Promise<{ successful: number; failed: number }> {
    console.log(
      `[GLICKO2 BATCH] Saving ${updatedRatings.length} updated ratings...`
    );

    const savePromises = updatedRatings.map(async (rating) => {
      try {
        // Use a transaction-like approach for each user
        await Promise.all([
          upsertGlicko2RatingPeriod({
            userId: rating.userId,
            periodStart,
            periodEnd,
            rating: rating.rating,
            deviation: rating.deviation,
            volatility: rating.volatility,
          }),
          updateUserStatisticsGlicko2({
            userId: rating.userId,
            rating: rating.rating,
            deviation: rating.deviation,
            volatility: rating.volatility,
          }),
        ]);

        return { success: true, userId: rating.userId };
      } catch (error) {
        console.error(
          `[GLICKO2 BATCH] Failed to save rating for user ${rating.userId}:`,
          error
        );
        return {
          success: false,
          userId: rating.userId,
          error: error instanceof Error ? error.message : "Unknown save error",
        };
      }
    });

    const results = await Promise.allSettled(savePromises);

    let successful = 0;
    let failed = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value.success) {
          successful++;
        } else {
          failed++;
        }
      } else {
        failed++;
        console.error("[GLICKO2 BATCH] Save promise rejected:", result.reason);
      }
    }

    console.log(
      `[GLICKO2 BATCH] Save completed: ${successful} successful, ${failed} failed`
    );
    return { successful, failed };
  }

  /**
   * Log comprehensive final statistics
   */
  private logFinalStatistics(
    stats: BatchProcessingStats,
    processingResult: ProcessingResult
  ): void {
    console.log("\n[GLICKO2 BATCH] ===== FINAL STATISTICS =====");
    console.log(`Total users: ${stats.totalUsers}`);
    console.log(`Successfully processed: ${stats.successfullyProcessed}`);
    console.log(`Failed processing: ${stats.failedProcessing}`);
    console.log(`Successfully saved: ${stats.successfullySaved}`);
    console.log(`Failed saving: ${stats.failedSaving}`);

    if (stats.totalUsers > 0) {
      const successRate = (
        (stats.successfullySaved / stats.totalUsers) *
        100
      ).toFixed(1);
      console.log(`Overall success rate: ${successRate}%`);
    }

    // Log details about failures
    if (processingResult.failed.length > 0) {
      console.log(
        `\n[GLICKO2 BATCH] Failed users (${processingResult.failed.length}):`
      );

      const retryableFailures = processingResult.failed.filter(
        (f) => f.isRetryable
      );
      const nonRetryableFailures = processingResult.failed.filter(
        (f) => !f.isRetryable
      );

      if (retryableFailures.length > 0) {
        console.log(`  Retryable failures: ${retryableFailures.length}`);
      }
      if (nonRetryableFailures.length > 0) {
        console.log(`  Non-retryable failures: ${nonRetryableFailures.length}`);
      }

      // Log first few failures for debugging
      for (const failure of processingResult.failed.slice(0, 5)) {
        console.log(
          `    - ${failure.username || failure.userId}: ${failure.error}`
        );
      }

      if (processingResult.failed.length > 5) {
        console.log(`    ... and ${processingResult.failed.length - 5} more`);
      }
    }
    console.log("[GLICKO2 BATCH] ===============================\n");
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
   * Manual trigger for testing purposes
   */
  async manualUpdate(): Promise<void> {
    console.log("[GLICKO2 BATCH] Manual update triggered");
    await this.updateRatingsForPreviousPeriod();
  }
}

// Export singleton instance
export const glicko2BatchUpdater = new Glicko2BatchUpdater();
