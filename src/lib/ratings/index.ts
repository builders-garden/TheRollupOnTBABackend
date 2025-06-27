import { GameResult } from "@prisma/client";
import type { GameParticipant } from "../../types/database";
import { bulkUpdateUserStatistics } from "../prisma/queries/user-statistics";
import { calculateEloRating } from "./elo";

export const calculateRatingChanges = async ({
	whiteUser,
	blackUser,
	gameResult,
}: {
	whiteUser: GameParticipant;
	blackUser: GameParticipant;
	gameResult: GameResult;
}) => {
	if (!whiteUser.user?.statistics || !blackUser.user?.statistics) {
		console.error("[RATINGS] User statistics not found for participants");
		return null;
	}

	// Calculate new ELO ratings
	const outcomeScore =
		gameResult === GameResult.DRAW
			? 0.5
			: gameResult === GameResult.WHITE_WON
				? 1
				: 0;

	const { newWhiteEloRating, newBlackEloRating } = calculateEloRating({
		whiteUserRating: whiteUser.user.statistics.eloRating,
		whiteUserKFactor: whiteUser.user.statistics.eloKFactor,
		blackUserRating: blackUser.user.statistics.eloRating,
		blackUserKFactor: blackUser.user.statistics.eloKFactor,
		outcomeScore,
	});

	return {
		whitePlayer: {
			userId: whiteUser.user.id,
			oldRating: whiteUser.user.statistics.eloRating,
			newRating: newWhiteEloRating,
			change: newWhiteEloRating - whiteUser.user.statistics.eloRating,
		},
		blackPlayer: {
			userId: blackUser.user.id,
			oldRating: blackUser.user.statistics.eloRating,
			newRating: newBlackEloRating,
			change: newBlackEloRating - blackUser.user.statistics.eloRating,
		},
	};
};

export const updateRatings = async ({
	gameId,
	whiteUser,
	blackUser,
	gameResult,
}: {
	gameId: string;
	whiteUser: GameParticipant;
	blackUser: GameParticipant;
	gameResult: GameResult;
}) => {
	if (!whiteUser.user?.statistics || !blackUser.user?.statistics) {
		console.error(
			`[RATINGS] User statistics not found for participants in game ${gameId}`,
		);
		return;
	}
	// update elo rating
	const outcomeScore =
		gameResult === GameResult.DRAW
			? 0.5
			: gameResult === GameResult.WHITE_WON
				? 1
				: 0;
	const { newWhiteEloRating, newBlackEloRating } = calculateEloRating({
		whiteUserRating: whiteUser.user.statistics.eloRating,
		whiteUserKFactor: whiteUser.user.statistics.eloKFactor,
		blackUserRating: blackUser.user.statistics.eloRating,
		blackUserKFactor: blackUser.user.statistics.eloKFactor,
		outcomeScore,
	});

	// update user statistics
	await bulkUpdateUserStatistics([
		{
			userId: whiteUser.user.id,
			data: { eloRating: newWhiteEloRating },
		},
		{
			userId: blackUser.user.id,
			data: { eloRating: newBlackEloRating },
		},
	]);

	console.log(
		`[GAME END] Updated ratings for game ${gameId} - White: ${whiteUser.user.statistics.eloRating} -> ${newWhiteEloRating} | Black: ${blackUser.user.statistics.eloRating} -> ${newBlackEloRating}`,
	);
};
