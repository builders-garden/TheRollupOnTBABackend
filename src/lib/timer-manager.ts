import type { GameMode, GameOption } from "@prisma/client";
import { getGameOptionTime } from "./utils";

export interface GameTimer {
  gameId: string;
  whiteTimeLeft: number;
  blackTimeLeft: number;
  activeColor: "w" | "b" | null;
  increment: number;
  lastMoveAt: number | null;
  intervalId: NodeJS.Timeout | null;
}

type TimerUpdateCallback = (gameId: string, timer: GameTimer) => void;
type TimerExpiredCallback = (gameId: string, color: "w" | "b") => void;

export class ChessTimerManager {
  private static instance: ChessTimerManager;
  private timers: Map<string, GameTimer> = new Map();
  private onTimerUpdate: TimerUpdateCallback | null = null;
  private onTimerExpired: TimerExpiredCallback | null = null;

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): ChessTimerManager {
    if (!ChessTimerManager.instance) {
      ChessTimerManager.instance = new ChessTimerManager();
    }
    return ChessTimerManager.instance;
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
   * Create a new timer for a game
   */
  public createTimer(
    gameId: string,
    gameMode: GameMode,
    gameOption: GameOption,
    whiteTimeLeft?: number,
    blackTimeLeft?: number,
    activeColor: "w" | "b" | null = null
  ): GameTimer | null {
    try {
      // Get time control settings
      const { duration, increase } = getGameOptionTime(gameMode, gameOption);

      const timer: GameTimer = {
        gameId,
        whiteTimeLeft: whiteTimeLeft ?? duration,
        blackTimeLeft: blackTimeLeft ?? duration,
        activeColor,
        increment: increase,
        lastMoveAt: null,
        intervalId: null,
      };

      this.timers.set(gameId, timer);
      console.log(`[TIMER] Created timer for game ${gameId}`);
      return timer;
    } catch (error) {
      console.error(`[TIMER] Error creating timer for game ${gameId}:`, error);
      return null;
    }
  }

  /**
   * Start the timer for a specific color
   */
  public startTimer(gameId: string, color: "w" | "b"): boolean {
    const timer = this.timers.get(gameId);
    if (!timer) {
      console.error(`[TIMER] Timer not found for game ${gameId}`);
      return false;
    }

    // Stop existing interval if running
    if (timer.intervalId) {
      clearInterval(timer.intervalId);
    }

    timer.activeColor = color;
    timer.lastMoveAt = Date.now();

    // Start countdown interval
    timer.intervalId = setInterval(() => {
      this.tickTimer(gameId);
    }, 1000);

    console.log(`[TIMER] Started timer for ${color} in game ${gameId}`);
    return true;
  }

  /**
   * Stop the timer (pause)
   */
  public stopTimer(gameId: string): boolean {
    const timer = this.timers.get(gameId);
    if (!timer) {
      console.error(`[TIMER] Timer not found for game ${gameId}`);
      return false;
    }

    if (timer.intervalId) {
      clearInterval(timer.intervalId);
      timer.intervalId = null;
    }

    timer.activeColor = null;
    console.log(`[TIMER] Stopped timer for game ${gameId}`);
    return true;
  }

  /**
   * Switch turn to the opponent and add increment
   */
  public switchTurn(gameId: string, fromColor: "w" | "b"): boolean {
    const timer = this.timers.get(gameId);
    if (!timer) {
      console.error(`[TIMER] Timer not found for game ${gameId}`);
      return false;
    }

    // Add increment to the player who just moved
    if (fromColor === "w") {
      timer.whiteTimeLeft += timer.increment;
    } else {
      timer.blackTimeLeft += timer.increment;
    }

    // Switch to opponent
    const newActiveColor = fromColor === "w" ? "b" : "w";
    timer.activeColor = newActiveColor;
    timer.lastMoveAt = Date.now();

    console.log(
      `[TIMER] Switched turn from ${fromColor} to ${newActiveColor} in game ${gameId}. Added ${timer.increment}s increment.`
    );

    // Emit update immediately
    if (this.onTimerUpdate) {
      this.onTimerUpdate(gameId, timer);
    }

    return true;
  }

  /**
   * Get timer for a game
   */
  public getTimer(gameId: string): GameTimer | null {
    return this.timers.get(gameId) || null;
  }

  /**
   * Delete timer and cleanup resources
   */
  public deleteTimer(gameId: string): boolean {
    const timer = this.timers.get(gameId);
    if (!timer) {
      return false;
    }

    if (timer.intervalId) {
      clearInterval(timer.intervalId);
    }

    this.timers.delete(gameId);
    console.log(`[TIMER] Deleted timer for game ${gameId}`);
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
   * Internal method to handle timer tick
   */
  private tickTimer(gameId: string): void {
    const timer = this.timers.get(gameId);
    if (!timer || !timer.activeColor) {
      return;
    }

    // Decrease time for active player
    if (timer.activeColor === "w") {
      timer.whiteTimeLeft = Math.max(0, timer.whiteTimeLeft - 1);

      // Check if white time expired
      if (timer.whiteTimeLeft === 0) {
        this.handleTimerExpired(gameId, "w");
        return;
      }
    } else {
      timer.blackTimeLeft = Math.max(0, timer.blackTimeLeft - 1);

      // Check if black time expired
      if (timer.blackTimeLeft === 0) {
        this.handleTimerExpired(gameId, "b");
        return;
      }
    }

    // Emit timer update
    if (this.onTimerUpdate) {
      this.onTimerUpdate(gameId, timer);
    }
  }

  /**
   * Handle timer expiration
   */
  private handleTimerExpired(gameId: string, color: "w" | "b"): void {
    console.log(`[TIMER] Timer expired for ${color} in game ${gameId}`);

    // Stop the timer
    this.stopTimer(gameId);

    // Emit timer expired event
    if (this.onTimerExpired) {
      this.onTimerExpired(gameId, color);
    }
  }
}
