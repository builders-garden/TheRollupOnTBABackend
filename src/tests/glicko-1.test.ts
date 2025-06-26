import { calculateGlicko1Rating } from "../lib/ratings/glicko-1";
import { GameResult } from "@prisma/client";

describe("Glicko1.calculateGlicko1Rating", () => {
  // Helper to get the rating diff for white
  function ratingDiff(
    whiteUserRating: number,
    whiteUserRd: number,
    blackUserRating: number,
    blackUserRd: number,
    outcome: GameResult
  ) {
    const baseDate = new Date("2024-01-01T00:00:00Z");
    const { updatedWhitePlayer } = calculateGlicko1Rating({
      whiteUserRating,
      blackUserRating,
      whiteUserRd,
      blackUserRd,
      whiteUserLastPlayedMatch: baseDate,
      blackUserLastPlayedMatch: baseDate,
      gameResult: outcome,
    });
    return Math.round(updatedWhitePlayer.rating - whiteUserRating);
  }

  test("new rating calculation over one game", () => {
    // [whiteRating, whiteRD, blackRating, blackRD, outcome, expectedDelta]
    // outcome: GameResult.WHITE_WON, GameResult.BLACK_WON, GameResult.DRAW
    expect(
      ratingDiff(1500, 200, 1500, 200, GameResult.WHITE_WON)
    ).toBeGreaterThan(0);
    expect(ratingDiff(1500, 200, 1500, 200, GameResult.BLACK_WON)).toBeLessThan(
      0
    );
    expect(ratingDiff(1500, 200, 1500, 200, GameResult.DRAW)).toBeCloseTo(0, 0);
    expect(
      ratingDiff(1500, 200, 1700, 200, GameResult.WHITE_WON)
    ).toBeGreaterThan(0);
    expect(ratingDiff(1500, 200, 1700, 200, GameResult.BLACK_WON)).toBeLessThan(
      0
    );
    expect(ratingDiff(1500, 200, 1700, 200, GameResult.DRAW)).toBeGreaterThan(
      -1
    );
    expect(
      ratingDiff(1800, 100, 1500, 100, GameResult.WHITE_WON)
    ).toBeGreaterThan(0);
    expect(ratingDiff(1800, 100, 1500, 100, GameResult.BLACK_WON)).toBeLessThan(
      0
    );
    expect(ratingDiff(1800, 100, 1500, 100, GameResult.DRAW)).toBeLessThan(0);
  });
});
