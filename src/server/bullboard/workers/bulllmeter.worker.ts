import { Worker } from "bullmq";
import { redisConnection } from "../../../lib/redis.js";
import { QUEUES } from "../../../types/index.js";
import { processBullMeterWebhookJob } from "../jobs/bullmeter.job.js";

export const bullMeterWebhookWorker = new Worker(
  QUEUES.BULLMETER_WEBHOOK_QUEUE,
  async (job) => {
    try {
      console.log(
        `| bullmeter-webhook-worker | processing job #${job.id} | pollId: ${job.data.pollId} | isBull: ${job.data.isBull} | votes: ${job.data.votes} | votePrice: ${job.data.votePrice} | platform: ${job.data.platform} | senderId: ${job.data.senderId} | voterAddress: ${job.data.voterAddress} | receiverBrandId: ${job.data.receiverBrandId}`
      );

      const result = await processBullMeterWebhookJob(job);

      console.log(
        `| bullmeter-webhook-worker | completed job #${job.id} | status: ${
          result.status
        } | txHash: ${result.txHash || "N/A"}`
      );

      return result;
    } catch (error) {
      console.error(
        `| bullmeter-webhook-worker | failed job #${job.id} |`,
        error
      );
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Process up to 1 job concurrently for nonce management
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds (default is 30 seconds)
    maxStalledCount: 3, // Allow job to stall 3 times before marking as failed (default is 1)
  }
);

// Event listeners for monitoring
bullMeterWebhookWorker.on("completed", (job) => {
  console.log(`BullMeter webhook job ${job.id} completed successfully`);
});

bullMeterWebhookWorker.on("failed", (job, err) => {
  console.error(`BullMeter webhook job ${job?.id} failed:`, err);
});

bullMeterWebhookWorker.on("error", (err) => {
  console.error("BullMeter webhook worker error:", err);
});
