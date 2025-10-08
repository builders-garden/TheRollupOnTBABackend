import type { Job } from "bullmq";
import type { Request, Response } from "express";
import { ulid } from "ulid";
import type { BullMeterWebhookJobData } from "../../../types/index.js";
import { bullMeterWebhookQueue } from "../queues/bullmeter.queue.js";

// Types for job progress and results
export type BullMeterJobProgress = {
  status: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  position?: number;
  delayReason?: string;
  processAt?: Date;
  error?: string;
  result?: BullMeterJobResult;
  attemptsMade?: number;
  attemptsRemaining?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BullMeterJobResult = {
  success: boolean;
  processedAt: string;
  pollId: string;
  txHash?: string;
  error?: string;
  status: "transaction_sent" | "transaction_failed";
};

/**
 * Handle BullMeter vote controller
 * @param req - The request object
 * @param res - The response object
 * @returns void
 */
export const handleVote = async (req: Request, res: Response) => {
  try {
    // Extract and validate required fields from request body
    const {
      pollId,
      isBull,
      votes,
      votePrice,
      platform,
      senderId,
      voterAddress,
      receiverBrandId,
      username,
      position,
      profilePicture,
      endTimeMs,
    } = req.body;

    // Validate required fields
    if (
      !pollId ||
      typeof isBull !== "boolean" ||
      !votes ||
      !votePrice ||
      !platform ||
      !senderId ||
      !voterAddress ||
      !receiverBrandId
    ) {
      console.error("Invalid request body - missing required fields");
      res.status(400).json({
        status: "error",
        error:
          "Missing required fields: pollId, isBull, votes, votePrice, platform, senderId, voterAddress, receiverBrandId",
      });
      return;
    }

    // Generate unique job ID
    const jobId = ulid();

    // Create job data
    const jobData: BullMeterWebhookJobData = {
      pollId: String(pollId),
      isBull: Boolean(isBull),
      votes: String(votes),
      votePrice: String(votePrice),
      platform: String(platform),
      senderId: String(senderId),
      voterAddress: String(voterAddress),
      receiverBrandId: String(receiverBrandId),
      // Optional fields with defaults
      username: username
        ? String(username)
        : `Voter ${String(voterAddress).slice(0, 6)}...`,
      position: position ? String(position) : "TOP_CENTER",
      profilePicture: profilePicture ? String(profilePicture) : "",
      endTimeMs: endTimeMs ? Number(endTimeMs) : undefined,
    };

    // Add job to queue
    const job = await bullMeterWebhookQueue.add(
      "process-bullmeter-webhook",
      jobData,
      {
        jobId,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        priority: 1, // Higher priority for vote jobs
      }
    );

    console.log(`BullMeter vote job added to queue: ${job.id}`);

    // Return immediately with job information
    res.status(202).json({
      jobId: job.id,
      status: "queued",
      message: "BullMeter vote job has been queued",
      pollId,
    });
  } catch (error) {
    console.error("Error handling BullMeter vote", error);
    res.status(500).json({
      status: "error",
      error: "Internal server error",
    });
  }
};

/**
 * Check the status of a BullMeter job
 */
export const checkJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        message: "Job ID is required",
      });
      return;
    }

    // Get job from queue
    const job = await bullMeterWebhookQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({
        message: "Job not found",
        jobId,
      });
      return;
    }

    // Get job state
    const state = await job.getState();
    const progress = job.progress;

    // Build response based on job state
    let response: BullMeterJobProgress | null = null;

    // Add additional info based on state
    const result = job.returnvalue as BullMeterJobResult;
    if (state === "completed") {
      response = {
        status: state,
        progress: typeof progress === "number" ? progress : 0,
        result,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.timestamp),
      };
    } else if (state === "failed") {
      response = {
        status: state,
        progress: typeof progress === "number" ? progress : 0,
        error: job.failedReason,
        result,
        attemptsMade: job.attemptsMade,
        attemptsRemaining: (job.opts.attempts || 3) - job.attemptsMade,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.timestamp),
      };
    } else if (state === "delayed") {
      response = {
        status: state,
        progress: typeof progress === "number" ? progress : 0,
        delayReason: job.opts.delay ? "Scheduled delay" : "Retry backoff",
        processAt: new Date(
          job.processedOn || Date.now() + (job.opts.delay || 0)
        ),
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.timestamp),
      };
    } else if (state === "waiting") {
      const position = (await getJobPosition(job)) || 0;
      response = {
        status: state,
        progress: typeof progress === "number" ? progress : 0,
        position,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.timestamp),
      };
    } else if (state === "active") {
      response = {
        status: state,
        progress: typeof progress === "number" ? progress : 0,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.timestamp),
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Error checking BullMeter job status:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get the position of a job in the queue
 */
async function getJobPosition(
  job: Job<BullMeterWebhookJobData>
): Promise<number | null> {
  try {
    const waitingJobs = await bullMeterWebhookQueue.getWaitingCount();
    const jobs = await bullMeterWebhookQueue.getJobs(
      ["waiting"],
      0,
      waitingJobs
    );
    const position = jobs.findIndex((j) => j.id === job.id);
    return position >= 0 ? position + 1 : null;
  } catch {
    return null;
  }
}

/**
 * Cancel a BullMeter vote job
 */
export const cancelJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        status: "error",
        error: "Job ID is required",
      });
      return;
    }

    const job = await bullMeterWebhookQueue.getJob(jobId);
    if (!job) {
      res.status(404).json({
        status: "error",
        error: "Job not found",
      });
      return;
    }

    const state = await job.getState();
    if (state === "completed") {
      res.status(400).json({
        status: "error",
        error: "Cannot cancel completed job",
      });
      return;
    }

    if (state === "failed") {
      res.status(400).json({
        status: "error",
        error: "Job has already failed",
      });
      return;
    }

    // Remove the job
    await job.remove();

    res.json({
      status: "success",
      message: "Job cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling BullMeter job:", error);
    res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
