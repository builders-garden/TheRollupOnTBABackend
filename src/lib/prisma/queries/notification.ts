import type { FrameNotificationDetails } from "@farcaster/frame-sdk";
import { prisma } from "../client";

/**
 * Get a user's notification details.
 *
 * This function gets a user's notification details.
 * It takes a fid and returns the notification details for the user.
 *
 * @param fid - The fid of the user to get the notification details for
 * @returns The notification details for the user, or undefined if the user doesn't exist or has no notification details
 */
export const getUserNotificationDetails = async (
  fid: number
): Promise<FrameNotificationDetails | undefined> => {
  const user = await prisma.user.findUnique({
    where: { fid },
    select: { notificationDetails: true },
  });

  if (!user || !user.notificationDetails) return undefined;

  return typeof user.notificationDetails === "string" &&
    user.notificationDetails !== ""
    ? JSON.parse(user.notificationDetails)
    : undefined;
};

/**
 * Set a user's notification details.
 *
 * This function sets a user's notification details.
 * It takes a fid and a set of details to apply to the user.
 *
 * @param fid - The fid of the user to set the notification details for
 * @param details - The details to set for the user
 * @returns void
 */
export const setUserNotificationDetails = async (
  fid: number,
  details: FrameNotificationDetails
): Promise<void> => {
  await prisma.user.update({
    where: { fid },
    data: {
      notificationDetails: JSON.stringify(details),
    },
  });
};

/**
 * Delete a user's notification details.
 *
 * This function deletes a user's notification details.
 * It takes a fid and deletes the notification details for the user.
 *
 * @param fid - The fid of the user to delete the notification details for
 * @returns void
 */
export const deleteUserNotificationDetails = async (
  fid: number
): Promise<void> => {
  await prisma.user.update({
    where: { fid },
    data: {
      notificationDetails: undefined,
    },
  });
};
