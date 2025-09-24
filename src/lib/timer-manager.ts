export interface LiveTimer {
  pollId: string;
  brandId: string;
  timeLeft: number;
  intervalId: NodeJS.Timeout | null;
  lastMoveAt: number | null;
}

type TimerUpdateCallback = (
  pollId: string,
  brandId: string,
  timer: LiveTimer
) => void;
type TimerExpiredCallback = (pollId: string) => void;

export class LiveTimerManager {
  private static instance: LiveTimerManager;
  private timers: Map<string, LiveTimer> = new Map();
  private onTimerUpdate: TimerUpdateCallback | null = null;
  private onTimerExpired: TimerExpiredCallback | null = null;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): LiveTimerManager {
    if (!LiveTimerManager.instance) {
      LiveTimerManager.instance = new LiveTimerManager();
    }
    return LiveTimerManager.instance;
  }

  /**
   * Set callback for timer updates (called every second)
   */
  public setOnTimerUpdate(callback: TimerUpdateCallback): void {
    this.onTimerUpdate = callback;
  }

  /**
   * Set callback for timer expiration
   */
  public setOnTimerExpired(callback: TimerExpiredCallback): void {
    this.onTimerExpired = callback;
  }

  /**
   * Create a new timer for a live poll
   */
  public createTimer({
    pollId,
    brandId,
    timeLeft,
  }: {
    pollId: string;
    brandId: string;
    timeLeft: number;
  }): LiveTimer | null {
    try {
      // Check if timer already exists for this live poll
      const existingTimer = this.timers.get(pollId);
      if (existingTimer) {
        console.log(
          `[TIMER] Timer already exists for live poll ${pollId}, returning existing timer`
        );
        return existingTimer;
      }

      const timer: LiveTimer = {
        pollId,
        brandId,
        timeLeft,
        lastMoveAt: null,
        intervalId: null,
      };

      this.timers.set(pollId, timer);
      console.log(`[TIMER] Created timer for live poll ${pollId}`);
      return timer;
    } catch (error) {
      console.error(
        `[TIMER] Error creating timer for live poll ${pollId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Start the timer for a live poll
   */
  public startTimer(pollId: string, brandId: string): boolean {
    const timer = this.timers.get(pollId);
    if (!timer) {
      console.error(`[TIMER] Timer not found for live poll ${pollId}`);
      return false;
    }

    // Check if timer is already running
    if (timer.intervalId) {
      console.log(`[TIMER] Timer already running for live poll ${pollId}`);
      return true;
    }

    // Stop existing interval if running
    if (timer.intervalId) {
      console.log(`[TIMER] Stopping existing interval for live poll ${pollId}`);
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }

    timer.lastMoveAt = Date.now();

    // Start countdown interval
    timer.intervalId = setInterval(() => {
      this.tickTimer(pollId, brandId);
    }, 1000);

    console.log(`[TIMER] Started timer for live poll ${pollId}`);
    return true;
  }

  /**
   * Stop the timer (pause)
   */
  public stopTimer(pollId: string): boolean {
    const timer = this.timers.get(pollId);
    if (!timer) {
      console.error(`[TIMER] Timer not found for live poll ${pollId}`);
      return false;
    }

    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }

    console.log(`[TIMER] Stopped timer for live poll ${pollId}`);
    return true;
  }

  /**
   * Get timer for a live poll
   */
  public getTimer(pollId: string): LiveTimer | null {
    return this.timers.get(pollId) || null;
  }

  /**
   * Check if timer is running for a live poll
   */
  public isTimerRunning(pollId: string): boolean {
    const timer = this.timers.get(pollId);
    return timer ? timer.intervalId !== null : false;
  }

  /**
   * Get debug information about all timers
   */
  public getDebugInfo(): string {
    const info = Array.from(this.timers.entries()).map(([pollId, timer]) => {
      return `Live poll ${pollId}: time ${timer.timeLeft} - ${
        timer.intervalId ? "RUNNING" : "STOPPED"
      }`;
    });
    return `Active timers: ${this.timers.size}\n${info.join("\n")}`;
  }

  /**
   * Delete timer and cleanup resources
   */
  public deleteTimer(pollId: string): boolean {
    const timer = this.timers.get(pollId);
    if (!timer) {
      return false;
    }

    if (timer.intervalId) {
      clearInterval(timer.intervalId);
    }

    this.timers.delete(pollId);
    console.log(`[TIMER] Deleted timer for live poll ${pollId}`);
    return true;
  }

  /**
   * Get all active timers
   */
  public getActiveTimers(): string[] {
    return Array.from(this.timers.keys());
  }

  /**
   * Cleanup all timers (for server shutdown)
   */
  public cleanup(): void {
    console.log(`[TIMER] Cleaning up ${this.timers.size} timers`);
    for (const [, timer] of this.timers.entries()) {
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
      }
    }
    this.timers.clear();
  }

  /**
   * Stop all active timers (useful for shutdown)
   */
  public stopAllTimers(): void {
    console.log(`[TIMER] Stopping ${this.timers.size} active timers...`);

    for (const [pollId, timer] of this.timers.entries()) {
      if (timer.intervalId) {
        clearInterval(timer.intervalId);
        timer.intervalId = null;
        console.log(`[TIMER] Stopped timer for live poll: ${pollId}`);
      }
    }
  }

  /**
   * Get count of active timers (for monitoring)
   */
  public getActiveTimerCount(): number {
    return this.timers.size;
  }

  /**
   * Internal method to handle timer tick
   */
  private tickTimer(pollId: string, brandId: string): void {
    const timer = this.timers.get(pollId);
    if (!timer) {
      return;
    }

    timer.timeLeft = Math.max(0, timer.timeLeft - 1);

    // Check if black time expired
    if (timer.timeLeft === 0) {
      this.handleTimerExpired(pollId);
      return;
    }

    // Emit timer update
    if (this.onTimerUpdate) {
      this.onTimerUpdate(pollId, brandId, timer);
    }
  }

  /**
   * Handle timer expiration
   */
  private handleTimerExpired(pollId: string): void {
    console.log(`[TIMER] Timer expired for live poll ${pollId}`);

    // Stop the timer
    this.stopTimer(pollId);

    // Emit timer expired event
    if (this.onTimerExpired) {
      this.onTimerExpired(pollId);
    }
  }
}
