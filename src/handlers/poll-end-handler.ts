import type { Server } from "socket.io";
import { ServerToClientSocketEvents } from "../types/enums";
import { LiveTimerManager } from "../lib/timer-manager";
/**
 * Handle timer expiration for a poll: clear persisted deadline, cleanup timer and notify clients.
 */
export async function handleTimerExpiration(
  io: Server,
  pollId: string
): Promise<void> {
  try {
    console.log(`[TIMER EXPIRED] Handling expiration for ${pollId}`);

    // Ensure in-memory timer is removed
    const manager = LiveTimerManager.getInstance();
    manager.deleteTimer(pollId);

    // Notify clients in the room that the poll ended
    io.to(pollId).emit(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
      id: pollId,
      votes: 0,
      voters: 0,
      results: { bullPercent: 0, bearPercent: 0 },
    });

    console.log(`[TIMER EXPIRED] Completed expiration handling for ${pollId}`);
  } catch (error) {
    console.error(
      `[TIMER EXPIRED] Error handling expiration for ${pollId}:`,
      error
    );
  }
}
