/*
 * FIDE Elo rating system
 * https://handbook.fide.com/chapter/B022022
 * https://ratings.fide.com/calc.phtml
 * */

// The original step table (upper bounds and values)
const conversionSteps: [number, number][] = [
  [3, 0.5],
  [10, 0.51],
  [17, 0.52],
  [25, 0.53],
  [32, 0.54],
  [39, 0.55],
  [46, 0.56],
  [53, 0.57],
  [61, 0.58],
  [68, 0.59],
  [76, 0.6],
  [83, 0.61],
  [91, 0.62],
  [98, 0.63],
  [106, 0.64],
  [113, 0.65],
  [121, 0.66],
  [129, 0.67],
  [137, 0.68],
  [145, 0.69],
  [153, 0.7],
  [162, 0.71],
  [170, 0.72],
  [179, 0.73],
  [188, 0.74],
  [197, 0.75],
  [206, 0.76],
  [215, 0.77],
  [225, 0.78],
  [235, 0.79],
  [245, 0.8],
  [256, 0.81],
  [267, 0.82],
  [278, 0.83],
  [290, 0.84],
  [302, 0.85],
  [315, 0.86],
  [328, 0.87],
  [344, 0.88],
  [357, 0.89],
  [374, 0.9],
  [391, 0.91],
];

// Precompute the lookup table for 0..400
const conversionTableFIDE: number[] = Array(401).fill(0.92);
let prev = 0;
for (const [up, value] of conversionSteps) {
  for (let i = prev; i <= up; i++) {
    conversionTableFIDE[i] = value;
  }
  prev = up + 1;
}

// Usage:
function getExpectedScore(ratingDiff: number) {
  const absDiff = Math.min(Math.abs(ratingDiff), 400);
  const expected = conversionTableFIDE[absDiff];
  return ratingDiff <= 0 ? expected : 1 - expected;
}

function cappedRatingDiff(a: number, b: number) {
  return Math.max(-400, Math.min(400, b - a));
}

/**
 * Calculate the new Elo ratings for a game
 * @param whiteUserRating - The rating of the white user
 * @param blackUserRating - The rating of the black user
 * @param whiteUserKFactor - The K-factor of the white user
 * @param blackUserKFactor - The K-factor of the black user
 * @param outcomeScore - The outcome score of the game
 */
export function calculateEloRating({
  whiteUserRating,
  blackUserRating,
  whiteUserKFactor,
  blackUserKFactor,
  outcomeScore,
}: {
  whiteUserRating: number;
  blackUserRating: number;
  whiteUserKFactor: number;
  blackUserKFactor: number;
  outcomeScore: number;
}) {
  // Calculate the Winning Probability
  const ratingDiff = cappedRatingDiff(whiteUserRating, blackUserRating);
  const expectedWhite = getExpectedScore(ratingDiff);
  const expectedBlack = getExpectedScore(-ratingDiff);

  // Update the Elo Ratings
  const newWhiteEloRating =
    whiteUserRating + whiteUserKFactor * (outcomeScore - expectedWhite);
  const newBlackEloRating =
    blackUserRating + blackUserKFactor * (1 - outcomeScore - expectedBlack);

  return { newWhiteEloRating, newBlackEloRating };
}
