import { GameEndReason, GameResult, GameState } from "@prisma/client";
import type { Server } from "socket.io";
import { disconnectTimeouts } from "../handlers";
import type { Game } from "../types/database";
import { ServerToClientSocketEvents } from "../types/enums";
import { sendFrameNotification } from "./notifications";
import { endGameIfNotEnded, getGameById, updateGame } from "./prisma/queries";
import {
	finalizeTimerValues,
	getUserIdByColor,
} from "./prisma/queries/timer-persistence";
import { calculateRatingChanges, updateRatings } from "./ratings";
import { BackendSmartContractService } from "./smart-contract-service";
import { ChessTimerManager } from "./timer-manager";
import { getGameEndReason } from "./utils";

/**
 * Central handler for all game ending scenarios
 * Ensures timers are properly stopped and cleaned up
 */
export async function handleGameEnd(
	io: Server,
	gameId: string,
	userId: string,
	reason: GameEndReason,
): Promise<void> {
	const chessTimerManager = ChessTimerManager.getInstance();

	try {
		console.log(
			`[GAME END] Processing game end for ${gameId}. Reason: ${reason}`,
		);

		// 1. Get current timer state before stopping
		const timer = chessTimerManager.getTimer(gameId);

		// 2. Stop the server timer immediately
		const timerStopped = chessTimerManager.stopTimer(gameId);
		console.log(`[GAME END] Timer stopped for game ${gameId}: ${timerStopped}`);

		// 3. Check if game already ended
		const game = await getGameById(gameId);
		if (!game) {
			console.error(`[GAME END] Game ${gameId} not found`);
			return;
		}

		// Prevent multiple game endings
		if (game.gameState === GameState.ENDED) {
			console.log(
				`[GAME END] Game ${gameId} already ended. Skipping duplicate end request.`,
			);
			return;
		}

		// Find white and black participants
		let whiteUser = null;
		let blackUser = null;

		if (game.isWhite === null) {
			console.error(`[GAME END] Game ${gameId} has no color assignment`);
			return;
		}

		// Determine which participant is white based on isWhite field
		const creatorParticipant = game.creator;
		const opponentParticipant = game.opponent;

		if (!creatorParticipant || !opponentParticipant) {
			console.error(
				`[GAME END] Creator or opponent not found in game ${gameId}`,
			);
			return;
		}

		if (game.isWhite === "CREATOR") {
			whiteUser = creatorParticipant;
			blackUser = opponentParticipant;
		} else {
			whiteUser = opponentParticipant;
			blackUser = creatorParticipant;
		}

		// Ensure users exist
		if (!whiteUser?.user || !blackUser?.user) {
			console.error(
				`[GAME END] User data not found for participants in game ${gameId}`,
			);
			return;
		}

		const { gameResult, gameResultExplanation } = getGameEndReason(
			reason,
			whiteUser.user.username,
			blackUser.user.username,
		);

		// 4. Update game state to ENDED (with additional safety check)
		try {
			const updateResult = await endGameIfNotEnded(gameId, {
				gameState: GameState.ENDED,
				gameEndReason: reason,
				gameResult,
				endedAt: new Date(),
			});

			// Check if we actually updated any rows (count should be 1)
			if (!updateResult || updateResult.count === 0) {
				console.log(
					`[GAME END] Game ${gameId} was already ended or not found. Skipping duplicate end request.`,
				);
				return;
			}
		} catch (error) {
			console.error(
				`[GAME END] Error updating game ${gameId} to ENDED state:`,
				error,
			);
			return;
		}

		// Calculate rating changes before updating
		const ratingChanges = await calculateRatingChanges({
			whiteUser,
			blackUser,
			gameResult,
		});

		// Calculate payout information
		const payoutInfo = await calculatePayoutInfo(game, gameResult);

		// update ratings
		const gameWage = Number.parseFloat(game.wageAmount);
		await updateRatings({
			gameId,
			whiteUser,
			blackUser,
			gameResult,
			gameWage,
		});

		// 5. Finalize game on smart contract (if contract ID exists)
		if (game.contractId) {
			try {
				console.log(
					`[CONTRACT] Finalizing game ${gameId} with contract ID ${game.contractId}`,
				);

				// Set game result on smart contract with the new signature
				const contractResult = await BackendSmartContractService.setGameResult(
					game.contractId,
					{
						creator: creatorParticipant,
						opponent: opponentParticipant,
						isWhite: game.isWhite,
					},
					gameResult,
				);

				if (contractResult.success) {
					console.log(
						`[CONTRACT] Game ${gameId} finalized on contract. Result: ${gameResult}. TX: ${contractResult.txHash}`,
					);

					// Update game with contract transaction hash
					await updateGame(gameId, {
						gameEndTxHash: contractResult.txHash,
					});
				} else {
					console.error(
						`[CONTRACT] Failed to finalize game ${gameId} on contract: ${contractResult.error}`,
					);
					// Game continues to end normally even if contract call fails
				}
			} catch (error) {
				console.error(
					`[CONTRACT] Error finalizing game ${gameId} on contract:`,
					error,
				);
				// Continue with normal game ending flow even if contract interaction fails
			}
		} else {
			console.log(
				`[GAME END] Game ${gameId} has no contract ID - skipping contract finalization`,
			);
		}

		// Note: Winner determination is now handled at the game level via gameResult
		// Individual participant winner tracking has been removed from the schema

		// 6. Finalize timer values in database
		if (timer) {
			await finalizeTimerValues(gameId, timer, reason);
		}

		// 7. Delete timer from memory after database update
		chessTimerManager.deleteTimer(gameId);
		console.log(`[GAME END] Timer deleted for game ${gameId}`);

		// 8. Clear any pending disconnect timeouts for this game
		const timeoutKeys = Array.from(disconnectTimeouts.keys()).filter((key) =>
			key.startsWith(gameId),
		);
		for (const key of timeoutKeys) {
			const timeout = disconnectTimeouts.get(key);
			if (timeout) {
				clearTimeout(timeout);
				disconnectTimeouts.delete(key);
				console.log(`[GAME END] Cleared disconnect timeout for ${key}`);
			}
		}

		// 9. Emit game ended event to all clients in the game room
		// This will trigger frontend timer stopping
		io.to(gameId).emit(ServerToClientSocketEvents.GAME_ENDED, {
			gameId,
			userId,
			reason,
			ratingChanges,
			payoutInfo,
		});

		// 10. Send notification to all participants
		for (const participant of [creatorParticipant, opponentParticipant]) {
			if (participant.user) {
				await sendFrameNotification({
					fid: participant.user.fid,
					title: "Game ended",
					body: `Game ${whiteUser.user.username} vs ${blackUser.user.username} ended. ${gameResultExplanation}`,
					notificationDetails: participant.user.notificationDetails,
				});
			}
		}

		console.log(
			`[GAME END] Game ${gameId} ended successfully. Reason: ${reason}. Timers stopped.`,
		);
	} catch (error) {
		console.error(`[GAME END] Error ending game ${gameId}:`, error);

		// Still emit game ended event even if database update fails
		// This ensures frontend timers are stopped regardless
		io.to(gameId).emit(ServerToClientSocketEvents.GAME_ENDED, {
			gameId,
			userId,
			reason,
			// Don't include rating/payout data on error case
		});

		// Still try to cleanup timer on error
		chessTimerManager.stopTimer(gameId);
		chessTimerManager.deleteTimer(gameId);
	}
}

/**
 * Handle timeout-specific game ending
 */
export async function handleTimerExpiration(
	io: Server,
	gameId: string,
	color: "w" | "b",
): Promise<void> {
	try {
		// Get user ID for the player who timed out
		const userId = await getUserIdByColor(gameId, color);

		if (!userId) {
			console.error(
				`[TIMEOUT] Could not find user ID for ${color} in game ${gameId}`,
			);
			return;
		}

		const reason =
			color === "w" ? GameEndReason.WHITE_TIMEOUT : GameEndReason.BLACK_TIMEOUT;

		// Use the centralized game end handler
		await handleGameEnd(io, gameId, userId, reason);

		console.log(`[TIMEOUT] Game ${gameId} ended due to ${color} timeout`);
	} catch (error) {
		console.error(
			`[TIMEOUT] Error handling timeout for game ${gameId}:`,
			error,
		);
	}
}

/**
 * Calculate payout information for a game
 */
async function calculatePayoutInfo(game: Game, gameResult: GameResult) {
	// If there's no contract ID, there's no payout
	if (!game.contractId) {
		return null;
	}

	try {
		// Get contract game details to get bet amount
		const contractGame = await BackendSmartContractService.getContractGame(
			game.contractId,
		);

		// Convert bet amount from wei to USDC (assuming 6 decimals for USDC)
		const betAmountInUsdc = Number(contractGame.betAmount) / 1000000;

		// Determine winner
		let winnerId = null;
		let winnerPayout = 0;

		if (gameResult === GameResult.DRAW) {
			// In a draw, both players get their bet back
			winnerPayout = betAmountInUsdc; // Each player gets their original bet
		} else {
			// Determine winner based on game result and color assignment
			const creatorIsWhite = game.isWhite === "CREATOR";
			const isWhiteWinner = gameResult === GameResult.WHITE_WON;
			const creatorWon = creatorIsWhite === isWhiteWinner;

			winnerId = creatorWon ? game.creator.user?.id : game.opponent?.user?.id;
			winnerPayout = betAmountInUsdc * 2; // Winner gets both bets (minus any fees)
		}

		return {
			betAmount: betAmountInUsdc,
			winnerId,
			winnerPayout,
		};
	} catch (error) {
		console.error(
			`[PAYOUT] Error calculating payout info for game ${game.id}:`,
			error,
		);
		return null;
	}
}
