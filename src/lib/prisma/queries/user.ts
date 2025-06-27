import type { Prisma, User } from "@prisma/client";
import { fetchUserFromNeynar } from "../../neynar";
import { prisma } from "../client";

/**
 * Get a user by their id.
 *
 * This function gets a user by their id.
 * It takes an id and returns the user if found.
 *
 * @param id - The id of the user to get
 * @returns The user if found, otherwise null
 */
export const getUserById = async (id: string): Promise<User | null> => {
	const user = await prisma.user.findUnique({
		where: { id },
		include: {
			statistics: true,
		},
	});

	if (!user) return null;

	return user;
};

/**
 * Get a user by their fid.
 *
 * This function gets a user by their fid.
 * It takes a fid and returns the user if found.
 *
 * @param fid - The fid of the user to get
 * @returns The user if found, otherwise null
 */
export const getUserByFid = async (fid: number): Promise<User | null> => {
	const user = await prisma.user.findUnique({
		where: { fid },
		include: {
			statistics: true,
		},
	});

	if (!user) return null;

	return user;
};

/**
 * Get a user by their fid, or create a new user if they don't exist.
 *
 * This function gets a user by their fid, or creates a new user if they don't exist.
 * It takes a fid and a referrerFid, and returns the user.
 *
 * @param fid - The fid of the user to get or create
 * @param referrerFid - The fid of the referrer user
 * @returns The user if found, otherwise the created user
 */
export const getOrCreateUserByFid = async (
	fid: number,
	referrerFid?: number,
): Promise<User> => {
	const user = await getUserByFid(fid);
	if (!user) {
		const userFromNeynar = await fetchUserFromNeynar(fid);
		if (!userFromNeynar) throw new Error("User not found in Neynar");

		const dbUser = await createUser({
			fid,
			username: userFromNeynar.username,
			displayName: userFromNeynar.display_name,
			avatarUrl: userFromNeynar.pfp_url,
			walletAddresses: JSON.stringify(
				userFromNeynar.verified_addresses.eth_addresses,
			),
			notificationDetails: null,
			referrerFid: referrerFid ? referrerFid : null,
		});

		return dbUser;
	}
	return user;
};

/**
 * Update a user in the database.
 *
 * This function updates a user in the database.
 * It takes a fid and a set of updates to apply to the user.
 *
 * @param fid - The fid of the user to update
 * @param updates - The updates to apply to the user
 * @returns The updated user
 */
export const updateUser = async (
	fid: number,
	updates: Prisma.UserUpdateInput,
): Promise<User> => {
	const updatedUser = await prisma.user.update({
		where: {
			fid,
		},
		data: updates,
	});

	return updatedUser;
};

/**
 * Create a user in the database
 * @param user - The user to create
 * @returns The created user
 */
export const createUser = async (
	user: Prisma.UserCreateInput,
): Promise<User> => {
	return await prisma.user.create({
		data: user,
		include: {
			statistics: true,
			notifications: true,
			gameParticipants: true,
		},
	});
};
