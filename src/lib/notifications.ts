import { Server } from "socket.io";
import { ServerToClientSocketEvents } from "../types/enums";

import { z } from "zod";
import { env } from "../config/env";
import { ulid } from "ulid";
import { GameMode, GameOption } from "@prisma/client";

export const frameNotificationDetailsSchema = z.object({
  url: z.string().url().min(1),
  token: z.string().min(1),
});

export type FrameNotificationDetails = z.infer<
  typeof frameNotificationDetailsSchema
>;

export type SendFarcasterNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | { state: "invalid_token"; invalidTokens: string[] }
  | { state: "rate_limit"; rateLimitedTokens: string[] }
  | { state: "success" };

interface SendNotificationRequest {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

const sendNotificationResponseSchema = z.object({
  result: z.object({
    successfulTokens: z.array(z.string()),
    invalidTokens: z.array(z.string()),
    rateLimitedTokens: z.array(z.string()),
  }),
});

/**
 * Send a notification to a Farcaster user.
 *
 * @param fid - The Farcaster user ID
 * @param title - The title of the notification
 * @param body - The body of the notification
 * @param targetUrl - The URL to redirect to when the notification is clicked (optional)
 * @param notificationDetails - The notification details of the user (required)
 * @returns The result of the notification
 */
export async function sendFrameNotification({
  fid,
  title,
  body,
  targetUrl,
  notificationDetails,
}: {
  fid: number;
  title: string;
  body: string;
  targetUrl?: string;
  notificationDetails?: string | null;
}): Promise<SendFarcasterNotificationResult> {
  if (!notificationDetails) return { state: "no_token" };
  const userNotificationDetails = frameNotificationDetailsSchema.safeParse(
    JSON.parse(notificationDetails)
  ).success
    ? frameNotificationDetailsSchema.parse(JSON.parse(notificationDetails))
    : null;
  if (!userNotificationDetails) return { state: "no_token" };

  const response = await fetch(userNotificationDetails.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: crypto.randomUUID(),
      title,
      body,
      targetUrl: targetUrl ?? env.APP_URL,
      tokens: [userNotificationDetails.token],
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (!responseBody.success) {
      console.error(
        `Error sending notification to ${fid}: malformed response`,
        responseBody.error.errors
      );
      return { state: "error", error: responseBody.error.errors };
    }

    if (responseBody.data.result.invalidTokens.length > 0) {
      console.error(
        `Error sending notification to ${fid}: invalid tokens`,
        responseBody.data.result.invalidTokens
      );
      return {
        state: "invalid_token",
        invalidTokens: responseBody.data.result.invalidTokens,
      };
    }

    if (responseBody.data.result.rateLimitedTokens.length > 0) {
      console.error(
        `Error sending notification to ${fid}: rate limited`,
        responseBody.data.result.rateLimitedTokens
      );
      return {
        state: "rate_limit",
        rateLimitedTokens: responseBody.data.result.rateLimitedTokens,
      };
    }

    return { state: "success" };
  }

  console.error(`Error sending notification to ${fid}: ${response.status}`);
  return { state: "error", error: responseJson };
}

// Function to broadcast in-app notifications to all connected clients
export function broadcastNotification(
  io: Server,
  notification: {
    type: "info" | "success" | "warning" | "error";
    title: string;
    message: string;
    duration?: number;
    actionUrl?: string;
    metadata?: Record<string, any>;
    gameMode: GameMode;
    gameOption: GameOption;
    wageAmount: string;
    userId: string;
  }
) {
  // Broadcast to all connected clients
  io.emit(ServerToClientSocketEvents.IN_APP_NOTIFICATION, {
    id: `notification_${ulid()}`,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    gameMode: notification.gameMode,
    gameOption: notification.gameOption,
    wageAmount: notification.wageAmount,
    userId: notification.userId,
    timestamp: Date.now(),
    duration: notification.duration || 5000,
    actionUrl: notification.actionUrl,
    metadata: notification.metadata,
  });

  console.log(
    `[NOTIFICATION] Broadcasted to all clients: ${notification.title}`
  );
}
