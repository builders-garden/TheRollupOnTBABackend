/**
 * Manual script to trigger Glicko-2 rating updates
 * Useful for testing the rating system before deploying the cron job
 */
import { glicko2BatchUpdater } from "../lib/glicko2-batch-updater";
import {
	getCurrentRatingPeriod,
	getPreviousRatingPeriod,
} from "../lib/prisma/queries/user-statistics";

async function main() {
	console.log("=== Manual Glicko-2 Rating Update ===");
	console.log("Starting manual rating update...\n");

	try {
		// Show current and previous periods
		const currentPeriod = getCurrentRatingPeriod();
		const previousPeriod = getPreviousRatingPeriod();

		console.log("Rating Periods:");
		console.log(
			`Previous: ${previousPeriod.start.toISOString()} to ${previousPeriod.end.toISOString()}`,
		);
		console.log(
			`Current:  ${currentPeriod.start.toISOString()} to ${currentPeriod.end.toISOString()}`,
		);
		console.log("");

		// Execute the rating update
		const startTime = Date.now();
		await glicko2BatchUpdater.manualUpdate();
		const endTime = Date.now();

		console.log("\n=== Rating Update Completed ===");
		console.log(`Total time: ${endTime - startTime}ms`);
		console.log(
			"All player ratings have been updated for the previous period.",
		);
	} catch (error) {
		console.error("Error during manual rating update:", error);
		process.exit(1);
	}
}

// Run the script if called directly
if (require.main === module) {
	main()
		.then(() => {
			console.log("\nScript completed successfully!");
			process.exit(0);
		})
		.catch((error) => {
			console.error("Script failed:", error);
			process.exit(1);
		});
}
