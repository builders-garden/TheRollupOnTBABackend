import { z } from "zod";
import { env } from "../config/env";
import { v4 as uuidv4 } from "uuid";

const appUrl = env.APP_URL || "https://farville.farm";

export type SendFrameNotificationResult =
  | {
      state: "error";
      error: unknown;
    }
  | { state: "no_token" }
  | {
      state: "success";
      successfulTokens: string[];
      invalidTokens: string[];
      rateLimitedTokens: string[];
    };

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

export async function sendFrameNotification({
  notificationDetails,
  title,
  body,
}: {
  notificationDetails: {
    url: string;
    token: string;
  }[];
  title: string;
  body: string;
}): Promise<SendFrameNotificationResult> {
  if (!notificationDetails.length) {
    return { state: "no_token" };
  }

  const response = await fetch(notificationDetails[0].url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notificationId: uuidv4(),
      title,
      body,
      targetUrl: appUrl,
      tokens: notificationDetails.map((detail) => detail.token),
    } satisfies SendNotificationRequest),
  });

  const responseJson = await response.json();

  if (response.status === 200) {
    const responseBody = sendNotificationResponseSchema.safeParse(responseJson);
    if (responseBody.success === false) {
      // Malformed response
      return { state: "error", error: responseBody.error.errors };
    }

    return {
      state: "success",
      successfulTokens: responseBody.data.result.successfulTokens,
      invalidTokens: responseBody.data.result.invalidTokens,
      rateLimitedTokens: responseBody.data.result.rateLimitedTokens,
    };
  }

  // Error response
  return { state: "error", error: responseJson };
}
