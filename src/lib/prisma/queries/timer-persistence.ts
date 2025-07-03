import { GameEndReason, GameState } from "@prisma/client";
import type { GameTimer } from "../../timer-manager";
import { ChessTimerManager } from "../../timer-manager";
import { getGameResultExplained, getParticipantByColor } from "../../utils";
import { prisma } from "../client";
import { getGameById } from "./game";

/**
 * Initialize timer values when a game starts
 */
export async function initializeGameTimers(
	gameId: string,
	duration: number,
): Promise<void> {
	try {
		await prisma.gameParticipant.updateMany({
			where: { gameId: gameId },
			data: {
				timeLeft: duration,
				endTime: null, // Reset any previous end time
			},
		});
		console.log(`[TIMER DB] Initialized timer values for game ${gameId}`);
	} catch (error) {
		console.error(
			`[TIMER DB] Error initializing timers for game ${gameId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Update timer values after a move
 */
export async function updateTimerAfterMove(
	gameId: string,
	timer: GameTimer,
): Promise<void> {
	try {
		// Get the game with participants to determine who is who
		const game = await getGameById(gameId);

		if (!game) {
			console.error(`[TIMER DB] Game ${gameId} not found`);
			return;
		}

		// Find white and black participants
		const whiteParticipant = getParticipantByColor(game, "w");
		const blackParticipant = getParticipantByColor(game, "b");

		if (!whiteParticipant || !blackParticipant) {
			console.error(
				`[TIMER DB] Could not find participants for game ${gameId}`,
			);
			return;
		}

		await prisma.$transaction([
			// Update white player's time
			prisma.gameParticipant.update({
				where: { id: whiteParticipant.id },
				data: {
					timeLeft: timer.whiteTimeLeft,
					endTime:
						timer.activeColor === "w"
							? new Date(Date.now() + timer.whiteTimeLeft * 1000)
							: null,
				},
			}),

			// Update black player's time
			prisma.gameParticipant.update({
				where: { id: blackParticipant.id },
				data: {
					timeLeft: timer.blackTimeLeft,
					endTime:
						timer.activeColor === "b"
							? new Date(Date.now() + timer.blackTimeLeft * 1000)
							: null,
				},
			}),
		]);
	} catch (error) {
		console.error(`[TIMER DB] Error updating timer for game ${gameId}:`, error);
		// Don't throw here - timer continues in memory
	}
}

/**
 * Restore timer state from database (for server restart)
 */
export async function restoreTimerFromDatabase(gameId: string): Promise<{
	whiteTimeLeft: number;
	blackTimeLeft: number;
	activeColor: "w" | "b" | null;
} | null> {
	try {
		const game = await getGameById(gameId);
		if (!game) {
			console.error(`[TIMER DB] Game ${gameId} not found`);
			return null;
		}

		const whiteParticipant = getParticipantByColor(game, "w");
		const blackParticipant = getParticipantByColor(game, "b");

		if (!whiteParticipant || !blackParticipant) {
			console.error(`[TIMER DB] Invalid game participants for game ${gameId}`);
			return null;
		}

		// Determine active color from game state
		let activeColor: "w" | "b" | null = null;

		if (game.gameState === GameState.ACTIVE) {
			// Parse FEN to determine whose turn it is
			const fenParts = game.currentFen.split(" ");
			activeColor = fenParts[1] === "w" ? "w" : "b";
		}

		return {
			whiteTimeLeft: whiteParticipant.timeLeft,
			blackTimeLeft: blackParticipant.timeLeft,
			activeColor,
		};
	} catch (error) {
		console.error(
			`[TIMER DB] Error restoring timer for game ${gameId}:`,
			error,
		);
		return null;
	}
}

/**
 * Finalize timer values when game ends
 */
export async function finalizeTimerValues(
	gameId: string,
	timer: GameTimer,
	gameEndReason: GameEndReason,
): Promise<void> {
	try {
		// Get the game with participants to determine who is who
		const game = await getGameById(gameId);

		if (!game) {
			console.error(`[TIMER DB] Game ${gameId} not found`);
			return;
		}

		// Find white and black participants
		const whiteParticipant = getParticipantByColor(game, "w");
		const blackParticipant = getParticipantByColor(game, "b");

		if (!whiteParticipant || !blackParticipant) {
			console.error(
				`[TIMER DB] Could not find participants for game ${gameId}`,
			);
			return;
		}

		await prisma.game.update({
			where: { id: gameId },
			data: {
				gameState: GameState.ENDED,
				gameEndReason,
				endedAt: new Date(),
			},
		});

		// Update participant timers separately
		await prisma.$transaction([
			prisma.gameParticipant.update({
				where: { id: whiteParticipant.id },
				data: {
					timeLeft: timer.whiteTimeLeft,
					endTime: null, // Clear end time when game ends
				},
			}),
			prisma.gameParticipant.update({
				where: { id: blackParticipant.id },
				data: {
					timeLeft: timer.blackTimeLeft,
					endTime: null,
				},
			}),
		]);

		console.log(`[TIMER DB] Finalized timer values for game ${gameId}`);
	} catch (error) {
		console.error(
			`[TIMER DB] Error finalizing timer for game ${gameId}:`,
			error,
		);
		throw error;
	}
}

/**
 * Get user ID by color for a game
 */
export async function getUserIdByColor(
	gameId: string,
	color: "w" | "b",
): Promise<string | null> {
	try {
		const game = await getGameById(gameId);
		if (!game) {
			console.error(`[TIMER DB] Game ${gameId} not found`);
			return null;
		}

		const participant = getParticipantByColor(game, color);
		return participant?.userId || null;
	} catch (error) {
		console.error(
			`[TIMER DB] Error getting user ID for ${color} in game ${gameId}:`,
			error,
		);
		return null;
	}
}

/**
 * End game due to timeout
 */
export async function endGameByTimeout(
	gameId: string,
	color: "w" | "b",
): Promise<void> {
	try {
		const reason =
			color === "w" ? GameEndReason.WHITE_TIMEOUT : GameEndReason.BLACK_TIMEOUT;

		const { gameResult } = getGameResultExplained(reason);

		await prisma.game.update({
			where: { id: gameId },
			data: {
				gameState: GameState.ENDED,
				gameEndReason: reason,
				gameResult: gameResult,
				endedAt: new Date(),
			},
		});

		console.log(`[TIMER DB] Ended game ${gameId} due to ${color} timeout`);
	} catch (error) {
		console.error(`[TIMER DB] Error ending game ${gameId} by timeout:`, error);
		throw error;
	}
}

/**
 * Recover active timers after server restart
 */
export async function recoverActiveTimers(): Promise<void> {
	try {
		const chessTimerManager = ChessTimerManager.getInstance();

		const activeGames = await prisma.game.findMany({
			where: {
				gameState: GameState.ACTIVE,
			},
			include: {
				creator: {
					include: {
						user: true,
					},
				},
				opponent: {
					include: {
						user: true,
					},
				},
			},
		});

		console.log(`[TIMER DB] Recovering ${activeGames.length} active games`);

		for (const game of activeGames) {
			const timerState = await restoreTimerFromDatabase(game.id);

			if (timerState?.activeColor) {
				// Recreate timer with current state
				const timer = chessTimerManager.createTimer(
					game.id,
					game.gameMode,
					game.gameOption,
					timerState.whiteTimeLeft,
					timerState.blackTimeLeft,
					timerState.activeColor,
				);

				if (timer) {
					// Check if timer should have expired during downtime
					const activeParticipant = getParticipantByColor(
						game,
						timerState.activeColor,
					);

					if (activeParticipant?.endTime) {
						const now = new Date();
						const shouldHaveExpired = now > activeParticipant.endTime;

						if (shouldHaveExpired) {
							// Timer expired during downtime
							console.log(
								`[TIMER DB] Timer expired during downtime for game ${game.id}`,
							);
							await endGameByTimeout(game.id, timerState.activeColor);
							continue;
						}
					}

					// Start timer if not expired
					chessTimerManager.startTimer(game.id, timerState.activeColor);
					console.log(`[TIMER DB] Recovered timer for game ${game.id}`);
				}
			}
		}
	} catch (error) {
		console.error("[TIMER DB] Error recovering active timers:", error);
	}
}
