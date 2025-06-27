import { GameResult } from "@prisma/client";
import { Glicko2, type Player } from "glicko2";

/**
 * Calculate the new Glicko2 ratings for a game
 * @file https://www.glicko.net/glicko/glicko2.pdf
 *
 *
 * @param whiteUserRating - The rating of the white user
 * @param blackUserRating - The rating of the black user
 * @param whiteUserDeviation - The deviation of the white user
 * @param blackUserDeviation - The deviation of the black user
 * @param whiteUserVolatility - The volatility of the white user
 * @param blackUserVolatility - The volatility of the black user
 * @param gameResult - The result of the game
 * @returns The new Glicko1 ratings for the white and black users
 */
export function calculateGlicko2Rating({
	whiteUserRating,
	blackUserRating,
	whiteUserDeviation,
	blackUserDeviation,
	whiteUserVolatility,
	blackUserVolatility,
	gameResult,
}: {
	whiteUserRating: number;
	blackUserRating: number;
	whiteUserDeviation: number;
	blackUserDeviation: number;
	whiteUserVolatility: number;
	blackUserVolatility: number;
	gameResult: GameResult;
}) {
	// 1. Initialize the Glicko calculator (using default or custom config)
	const glicko2 = new Glicko2({
		// tau : "Reasonable choices are between 0.3 and 1.2, though the system should
		//      be tested to decide which value results in greatest predictive accuracy."
		// If not set, default value is 0.5
		tau: 0.5,
		// rating : default rating
		// If not set, default value is 1500
		rating: 1500,
		// rd : Default rating deviation
		// small number = good confidence on the rating accuracy
		// If not set, default value is 350
		rd: 200,

		// vol : Default volatility (expected fluctation on the player rating)
		// If not set, default value is 0.06
		vol: 0.06,
	});

	// 2. Get player states *before* the rating period begins
	const playerW = glicko2.makePlayer(
		whiteUserRating,
		whiteUserDeviation,
		whiteUserVolatility,
	);
	const playerB = glicko2.makePlayer(
		blackUserRating,
		blackUserDeviation,
		blackUserVolatility,
	);

	// 3. Define matches played *during* this rating period
	// Note: The 'score' is always from the perspective of the 'player' in the Match object.
	const gameScore =
		gameResult === GameResult.WHITE_WON
			? 1
			: gameResult === GameResult.BLACK_WON
				? 0
				: 0.5;
	const matches = [];
	matches.push([playerW, playerB, gameScore] as [Player, Player, number]);

	glicko2.updateRatings(matches);

	// 4. Process results for each player
	const newWhiteRating = playerW.getRating();
	const newWhiteDeviation = playerW.getRd();
	const newWhiteVolatility = playerW.getVol();
	const newBlackRating = playerB.getRating();
	const newBlackDeviation = playerB.getRd();
	const newBlackVolatility = playerB.getVol();

	return {
		whiteUser: {
			rating: newWhiteRating,
			deviation: newWhiteDeviation,
			volatility: newWhiteVolatility,
		},
		blackUser: {
			rating: newBlackRating,
			deviation: newBlackDeviation,
			volatility: newBlackVolatility,
		},
	};
}
