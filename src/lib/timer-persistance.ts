import type { Hex } from "viem";
import { LiveTimerManager } from "./timer-manager";
import { getActiveBullMeters } from "./database/queries";

/**
 * Recover active timers from DB using bull meters deadlines.
 * A bull meter is considered active if `deadline > now`.
 * For each active bull meter, we restore an in-memory timer with the remaining time.
 */
export async function recoverActiveTimers(): Promise<void> {
  try {
    const now = Date.now();
    const active = await getActiveBullMeters(now);

    if (!active.length) {
      console.log("[TIMER-PERSISTENCE] No active timers to recover");
      return;
    }

    const manager = LiveTimerManager.getInstance();
    for (const meter of active) {
      if (!meter.pollId || !meter.deadline) continue;
      const remainingMs = Math.max(0, meter.deadline - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      if (remainingSec <= 0) continue;

      const created = manager.createTimer(meter.pollId as Hex, remainingSec);
      if (created) {
        manager.startTimer(meter.pollId as Hex);
        console.log(
          `[TIMER-PERSISTENCE] Recovered timer for poll ${meter.pollId} with ${remainingSec}s left`
        );
      }
    }
  } catch (error) {
    console.error("[TIMER-PERSISTENCE] Failed to recover timers:", error);
  }
}
