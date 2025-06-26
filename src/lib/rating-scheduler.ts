import * as cron from "node-cron";
import { glicko2BatchUpdater } from "./glicko2-batch-updater";

/**
 * Rating update scheduler using cron jobs
 * Runs weekly at 3 AM on Monday (start of the new rating period)
 */
export class RatingScheduler {
  private static instance: RatingScheduler;
  private cronJob: cron.ScheduledTask | null = null;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): RatingScheduler {
    if (!RatingScheduler.instance) {
      RatingScheduler.instance = new RatingScheduler();
    }
    return RatingScheduler.instance;
  }

  /**
   * Start the weekly rating update scheduler
   * Runs every Monday at 3:00 AM (0 3 * * 1)
   */
  public startScheduler(): void {
    if (this.cronJob) {
      console.log("[RATING SCHEDULER] Scheduler is already running");
      return;
    }

    // Schedule: Run at 3:00 AM every Monday
    // Cron format: "second minute hour day-of-month month day-of-week"
    // 0 3 * * 1 = At 3:00 AM on Monday
    this.cronJob = cron.schedule(
      "0 3 * * 1",
      async () => {
        console.log(
          "[RATING SCHEDULER] Weekly rating update triggered at",
          new Date().toISOString()
        );
        await this.executeRatingUpdate();
      },
      {
        scheduled: false, // Don't start immediately
        timezone: "UTC", // Use UTC timezone for consistency
      }
    );

    // Start the cron job
    this.cronJob.start();
    console.log(
      "[RATING SCHEDULER] Weekly rating update scheduler started (runs every Monday at 3:00 AM UTC)"
    );
  }

  /**
   * Stop the scheduler
   */
  public stopScheduler(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      console.log("[RATING SCHEDULER] Scheduler stopped");
    }
  }

  /**
   * Execute the rating update with error handling
   */
  private async executeRatingUpdate(): Promise<void> {
    try {
      console.log(
        "[RATING SCHEDULER] Starting weekly Glicko-2 rating update..."
      );
      const startTime = Date.now();

      await glicko2BatchUpdater.updateRatingsForPreviousPeriod();

      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(
        `[RATING SCHEDULER] Rating update completed successfully in ${duration}ms`
      );
    } catch (error) {
      console.error("[RATING SCHEDULER] Error during rating update:", error);
      // In a production environment, you might want to:
      // - Send an alert to administrators
      // - Retry the update after a delay
      // - Log to an error monitoring service
    }
  }

  /**
   * Manual trigger for testing (runs immediately)
   */
  public async triggerManualUpdate(): Promise<void> {
    console.log("[RATING SCHEDULER] Manual rating update triggered");
    await this.executeRatingUpdate();
  }

  /**
   * Check if scheduler is running
   */
  public isRunning(): boolean {
    return this.cronJob !== null;
  }

  /**
   * Get next scheduled run time
   */
  public getNextRun(): Date | null {
    if (!this.cronJob) return null;

    // Calculate next Monday at 3 AM
    const now = new Date();
    const nextMonday = new Date(now);

    // Get days until next Monday
    const daysUntilMonday = (1 + 7 - now.getUTCDay()) % 7;
    if (daysUntilMonday === 0 && now.getUTCHours() >= 3) {
      // If it's Monday and already past 3 AM, schedule for next Monday
      nextMonday.setUTCDate(now.getUTCDate() + 7);
    } else {
      nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);
    }

    nextMonday.setUTCHours(3, 0, 0, 0);
    return nextMonday;
  }
}

// Export singleton instance
export const ratingScheduler = RatingScheduler.getInstance();
