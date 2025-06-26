import { GameResult } from "@prisma/client";
import { Glicko, type Player, type Match } from "glicko-ts";

/**
 * Calculate the new Glicko1 ratings for a game
 * @file https://www.glicko.net/glicko/glicko.pdf
 *
 *
 * @param whiteUserRating - The rating of the white user
 * @param blackUserRating - The rating of the black user
 * @param whiteUserRd - The rating deviation of the white user
 * @param blackUserRd - The rating deviation of the black user
 * @param whiteUserLastPlayedMatch - The last time the white user played a match
 * @param blackUserLastPlayedMatch - The last time the black user played a match
 * @param gameResult - The result of the game
 * @returns The new Glicko1 ratings for the white and black users
 */
export function calculateGlicko1Rating({
  whiteUserRating,
  blackUserRating,
  whiteUserRd,
  blackUserRd,
  whiteUserLastPlayedMatch,
  blackUserLastPlayedMatch,
  gameResult,
}: {
  whiteUserRating: number;
  blackUserRating: number;
  whiteUserRd: number;
  blackUserRd: number;
  whiteUserLastPlayedMatch: Date;
  blackUserLastPlayedMatch: Date;
  gameResult: GameResult;
}) {
  // 1. Initialize the Glicko calculator (using default or custom config)
  const glicko = new Glicko({
    initialRating: 1500,
    initialRD: 350,
    inactivityConstant: 0.5, // Controls how fast RD increases
    rdCeiling: 350, // Maximum RD value
    daysPerRatingPeriod: 30, // Used for inactivity calc scaling
    roundingPrecision: 2, // Decimal places for final results
  });

  // 2. Get player states *before* the rating period begins
  const playerW: Player = glicko.initializeNewPlayer({
    rating: whiteUserRating,
    rd: whiteUserRd,
    lastPlayedMatch: new Date(whiteUserLastPlayedMatch),
  });

  const playerB: Player = glicko.initializeNewPlayer({
    rating: blackUserRating,
    rd: blackUserRd,
    lastPlayedMatch: new Date(blackUserLastPlayedMatch),
  });

  // 3. Define matches played *during* this rating period
  // Note: The 'score' is always from the perspective of the 'player' in the Match object.
  // A single game between A and B results in two Match objects, one for each player's perspective.
  const scoreW_vs_B =
    gameResult === GameResult.WHITE_WON
      ? 1
      : gameResult === GameResult.DRAW
      ? 0.5
      : 0;
  const scoreB_vs_W =
    gameResult === GameResult.BLACK_WON
      ? 1
      : gameResult === GameResult.DRAW
      ? 0.5
      : 0;
  const matchW_vs_B: Match = {
    player: playerW,
    opponent: playerB,
    score: scoreW_vs_B,
    datePlayed: new Date(),
  };
  const matchB_vs_W: Match = {
    player: playerB,
    opponent: playerW,
    score: scoreB_vs_W,
    datePlayed: new Date(),
  };

  // 4. Collate matches for each player for this period
  const matchesForPlayerW = [matchW_vs_B];
  const matchesForPlayerB = [matchB_vs_W];

  // 5. Calculate inactivity days for each player (time between their last update and the *start* of this period)
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysInactiveWhite = Math.floor(
    (new Date().getTime() - new Date(whiteUserLastPlayedMatch).getTime()) /
      msPerDay
  );
  const daysInactiveBlack = Math.floor(
    (new Date().getTime() - new Date(blackUserLastPlayedMatch).getTime()) /
      msPerDay
  );

  // 6. Process results for each player
  // This is the standard way: process inactivity and matches in one call.
  const updatedWhitePlayer = glicko.processGameResults(
    playerW,
    matchesForPlayerW,
    daysInactiveWhite
  );
  const updatedBlackPlayer = glicko.processGameResults(
    playerB,
    matchesForPlayerB,
    daysInactiveBlack
  );

  return {
    updatedWhitePlayer,
    updatedBlackPlayer,
  };
}
