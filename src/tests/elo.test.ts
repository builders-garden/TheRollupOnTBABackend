import { calculateEloRating } from "../lib/ratings/elo";

describe("Elo.calculateEloRating", () => {
  // Helper to get the rating diff for white
  function ratingDiff(
    whiteUserRating: number,
    whiteUserKFactor: number,
    blackUserRating: number,
    outcomeScore: number
  ) {
    const { newWhiteEloRating } = calculateEloRating({
      whiteUserRating,
      blackUserRating,
      whiteUserKFactor,
      blackUserKFactor: whiteUserKFactor, // Use same K for both for these tests
      outcomeScore,
    });
    return Math.round(newWhiteEloRating - whiteUserRating);
  }

  test("new rating calculation over one game", () => {
    // [whiteRating, k, blackRating, outcomeScore, expectedDelta]
    // outcomeScore: 1 = win, 0.5 = draw, 0 = loss
    expect(ratingDiff(1037.6, 40, 1000, 1)).toBe(18);
    expect(ratingDiff(1500, 40, 1500, 1)).toBe(20);
    expect(ratingDiff(1500, 40, 1500, 0)).toBe(-20);
    expect(ratingDiff(1500, 40, 1500, 0.5)).toBe(0);
    expect(ratingDiff(1500, 40, 1900, 1)).toBe(37);
    expect(ratingDiff(1500, 40, 1900, 0)).toBe(-3);
    expect(ratingDiff(1500, 40, 1900, 0.5)).toBe(17);
    expect(ratingDiff(1500, 40, 2900, 1)).toBe(37);
    expect(ratingDiff(1500, 40, 2900, 0)).toBe(-3);
    expect(ratingDiff(1500, 40, 2900, 0.5)).toBe(17);
    expect(ratingDiff(1500, 40, 1600, 1)).toBe(26);
    expect(ratingDiff(1500, 40, 1600, 0)).toBe(-14);
    expect(ratingDiff(1500, 40, 1600, 0.5)).toBe(6);
    expect(ratingDiff(2000, 40, 1600, 1)).toBe(3);
    expect(ratingDiff(2000, 40, 1600, 0)).toBe(-37);
    expect(ratingDiff(2000, 40, 1600, 0.5)).toBe(-17);
    expect(ratingDiff(2000, 40, 1000, 1)).toBe(3);
    expect(ratingDiff(2000, 40, 1000, 0)).toBe(-37);
    expect(ratingDiff(2000, 40, 1000, 0.5)).toBe(-17);
    expect(ratingDiff(2000, 40, 1900, 1)).toBe(14);
    expect(ratingDiff(2000, 40, 1900, 0)).toBe(-26);
    expect(ratingDiff(2000, 40, 1900, 0.5)).toBe(-6);
  });
});
