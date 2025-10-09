import type { Job } from "bullmq";
import type { BullMeterWebhookJobData } from "../../../types/index.js";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  getAddress,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { env } from "../../../config/env.js";
import { bullMeterAbi } from "../../../lib/abi.js";
import { BULLMETER_ADDRESS } from "../../../lib/contract-constants.js";
import { createBullmeterVote } from "../../../lib/database/queries/bullmeter-votes.query.js";
import { getIOInstance } from "../../../lib/socket.js";
import { ServerToClientSocketEvents } from "../../../types/enums.js";
import { PopupPositions } from "../../../types/enums.js";
import { getBullMeterByPollId, updateVoteCounts } from "../../../lib/database/queries/bull-meter.query.js";
import { BullMeter } from "../../../lib/database/db.schema.js";

export const processBullMeterWebhookJob = async (
  job: Job<BullMeterWebhookJobData>
) => {
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
  } = job.data;

  try {
    // Create account from private key
    const account = privateKeyToAccount(
      env.BACKEND_PRIVATE_KEY as `0x${string}`
    );

    // Create wallet client
    const walletClient = createWalletClient({
      account,
      chain: base,
      transport: http("https://mainnet-preconf.base.org"), // flashbot rpc
    });
    const publicClient = createPublicClient({
      chain: base,
      transport: http(""),
    });

    // Convert votes string to BigInt
    const voteCountBigInt = BigInt(votes);

    // Convert pollId to hex string if needed
    const pollIdHex = pollId.startsWith("0x")
      ? (pollId as `0x${string}`)
      : (`0x${pollId}` as `0x${string}`);

    // Convert voterAddress to address format and checksumed
    const voter = voterAddress.startsWith("0x")
      ? getAddress(voterAddress as `0x${string}`)
      : getAddress(`0x${voterAddress}` as `0x${string}`);

    // Encode the vote function call
    const data = encodeFunctionData({
      abi: bullMeterAbi,
      functionName: "voteFor",
      args: [voter, pollIdHex, isBull, voteCountBigInt],
    });
    const hash = await walletClient.sendTransaction({
      account,
      to: BULLMETER_ADDRESS as `0x${string}`,
      data,
      value: BigInt(0), // No ETH value needed for this function
    });

    // Wait for the transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    // Store the vote data in the database
    if (receipt.status === "success") {
      try {
        await createBullmeterVote({
          pollId: pollIdHex,
          senderId,
          receiverBrandId,
          votePrice,
          votes: parseInt(votes),
          isBull,
          platform: platform as "farcaster" | "base" | "web-app" | null,
        });
        console.log("Vote stored in database successfully");
        // Update database with vote counts
        try {
          await updateVoteCounts(
            pollId,
            isBull,
            Number(voteCountBigInt),
          );
        } catch (dbError) {
          console.log("❌ Database update failed:", dbError);
          // Don't fail the entire request if database update fails
          // The blockchain transaction was successful
        }

        // Emit vote casted event to clients
        try {
          const io = getIOInstance();

          // Get bullmeter data for additional context
          const bullmeter = await getBullMeterByPollId(pollIdHex);

          // Emit VOTE_RECEIVED event for each individual vote
          const voteCount = parseInt(votes);
          for (let i = 0; i < voteCount; i++) {
            io.to(receiverBrandId).emit(
              ServerToClientSocketEvents.VOTE_RECEIVED,
              {
                brandId: receiverBrandId,
                username: username || `${voterAddress.slice(0, 6)}`,
                profilePicture: profilePicture || "",
                voteAmount: "1", // Each individual vote is worth 1
                isBull,
                promptId: pollIdHex,
                position:
                  (position as PopupPositions) || PopupPositions.TOP_CENTER,
              }
            );

            // Add a small delay between events to make them more visible
            if (i < voteCount - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms delay
            }
          }

          // Emit UPDATE_SENTIMENT_POLL event if bullmeter exists
          if (bullmeter) {
            const totalVotes =
              (bullmeter.totalYesVotes || 0) + (bullmeter.totalNoVotes || 0);
            const pollEndTimeMs = endTimeMs || (bullmeter.deadline || 0) * 1000;
            io.to(receiverBrandId).emit(
              ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL,
              {
                brandId: receiverBrandId,
                id: bullmeter.pollId,
                endTimeMs: pollEndTimeMs,
                position:
                  (position as PopupPositions) || PopupPositions.TOP_CENTER,
                votes: totalVotes || 0,
                voters: totalVotes || 0,
                results: {
                  bullPercent:
                    totalVotes > 0
                      ? (bullmeter.totalYesVotes || 0) / totalVotes
                      : 0,
                  bearPercent:
                    totalVotes > 0
                      ? (bullmeter.totalNoVotes || 0) / totalVotes
                      : 0,
                },
              }
            );
          }
        } catch (socketError) {
          console.log("Error emitting vote casted events:", socketError);
          // Don't fail the job if socket emission fails
        }
      } catch (dbError) {
        console.log("Database error:", dbError);
        //TODO: Handle better this error
      }
    }

    return {
      success: true,
      processedAt: new Date().toISOString(),
      pollId,
      txHash: hash,
      status: "transaction_sent",
    };
  } catch (error) {
    console.error("Error processing BullMeter webhook job:", error);

    return {
      success: false,
      processedAt: new Date().toISOString(),
      pollId,
      error: error instanceof Error ? error.message : "Unknown error",
      status: "transaction_failed",
    };
  }
};
