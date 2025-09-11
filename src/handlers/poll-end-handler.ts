import type { Server } from "socket.io";
import { PopupPositions, ServerToClientSocketEvents } from "../types/enums";
import { LiveTimerManager } from "../lib/timer-manager";
import { Hex } from "viem";
import { getBullMeterByPollId } from "../lib/database/queries/bull-meter.query";
import { env } from "../config/env";
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

    const bullmeter = await getBullMeterByPollId(pollId as Hex);

    if (bullmeter) {
      const totalVotes =
        (bullmeter.totalYesVotes || 0) + (bullmeter.totalNoVotes || 0);
      const deadline = new Date((bullmeter.deadline || 0) * 1000);

      io.emit(ServerToClientSocketEvents.END_SENTIMENT_POLL, {
        id: bullmeter.pollId,
        pollQuestion: bullmeter.prompt,
        qrCodeUrl: `https://${env.APP_URL}/poll/${bullmeter.pollId}`,
        endTime: deadline,
        position: PopupPositions.TOP_CENTER,
        votes: bullmeter.totalYesVotes || 0,
        voters: bullmeter.totalNoVotes || 0,
        results: {
          bullPercent: (bullmeter.totalYesVotes || 0) / totalVotes,
          bearPercent: (bullmeter.totalNoVotes || 0) / totalVotes,
        },
      });
    }

    console.log(`[TIMER EXPIRED] Completed expiration handling for ${pollId}`);
  } catch (error) {
    console.error(
      `[TIMER EXPIRED] Error handling expiration for ${pollId}:`,
      error
    );
  }
}
