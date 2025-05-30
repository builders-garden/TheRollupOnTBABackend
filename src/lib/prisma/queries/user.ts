import { prisma } from "../client";
import type { Prisma, User } from "@prisma/client";

import type { FrameNotificationDetails } from "@farcaster/frame-sdk";

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

export const updateUser = async (
  fid: number,
  updates: Prisma.UserUpdateInput
): Promise<User> => {
  const updatedUser = await prisma.user.update({
    where: {
      fid,
    },
    data: updates,
  });

  return updatedUser;
};

export const getUser = async (fid: number): Promise<User | null> => {
  const user = await prisma.user.findUnique({
    where: { fid },
    include: {
      statistics: true,
    },
  });

  if (!user) return null;

  return user;
};
