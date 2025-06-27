import {
	type Game,
	GameEndReason,
	GameIsWhite,
	GameMode,
	GameOption,
	type GameParticipant,
	GameResult,
	type User,
} from "@prisma/client";
import { GAME_OPTIONS } from "./constants";

export const getGameOptionTime = (mode: GameMode, option: GameOption) => {
	try {
		const data = GAME_OPTIONS[mode]?.[option];
		if (!data) {
			throw new Error(
				`Duration not found for mode: ${mode} and option: ${option}`,
			);
		}

		return { duration: data.duration, increase: data.increase };
	} catch (error) {
		console.error("Error getting game option time", error);
		const defaultOption = GAME_OPTIONS[GameMode.RAPID][GameOption.RAPID_5];
		return {
			duration: defaultOption?.duration ?? 300,
			increase: defaultOption?.increase ?? 0,
		};
	}
};

export const getGameEndReason = (
	reason: GameEndReason,
	whiteParticipantUsername: string,
	blackParticipantUsername: string,
): {
	gameResult: GameResult;
	gameResultExplanation: string;
} => {
	let gameResult: GameResult | null = null;
	let gameResultExplanation: string | null = null;
	switch (reason) {
		case GameEndReason.WHITE_CHECKMATE:
			gameResult = GameResult.WHITE_WON;
			gameResultExplanation = `${whiteParticipantUsername} won`;
			break;
		case GameEndReason.BLACK_CHECKMATE:
			gameResult = GameResult.BLACK_WON;
			gameResultExplanation = `${blackParticipantUsername} won`;
			break;
		case GameEndReason.WHITE_RESIGNED:
			gameResult = GameResult.BLACK_WON;
			gameResultExplanation = `${blackParticipantUsername} won, ${whiteParticipantUsername} resigned`;
			break;
		case GameEndReason.BLACK_RESIGNED:
			gameResult = GameResult.WHITE_WON;
			gameResultExplanation = `${whiteParticipantUsername} won, ${blackParticipantUsername} resigned`;
			break;
		case GameEndReason.WHITE_REQUESTED_DRAW:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${whiteParticipantUsername} requested`;
			break;
		case GameEndReason.BLACK_REQUESTED_DRAW:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${blackParticipantUsername} requested`;
			break;
		case GameEndReason.WHITE_STALEMATE:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${whiteParticipantUsername} stalemate`;
			break;
		case GameEndReason.BLACK_STALEMATE:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${blackParticipantUsername} stalemate`;
			break;
		case GameEndReason.WHITE_INSUFFICIENT_MATERIAL:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${whiteParticipantUsername} insufficient material`;
			break;
		case GameEndReason.BLACK_INSUFFICIENT_MATERIAL:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${blackParticipantUsername} insufficient material`;
			break;
		case GameEndReason.WHITE_THREEFOLD_REPETITION:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${whiteParticipantUsername} threefold repetition`;
			break;
		case GameEndReason.BLACK_THREEFOLD_REPETITION:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${blackParticipantUsername} threefold repetition`;
			break;
		case GameEndReason.WHITE_FIFTY_MOVE_RULE:
			gameResult = GameResult.DRAW;
			gameResultExplanation = `Draw, ${whiteParticipantUsername} fifty move rule`;
			break;
		case GameEndReason.WHITE_TIMEOUT:
			gameResult = GameResult.BLACK_WON;
			gameResultExplanation = `${blackParticipantUsername} won, ${whiteParticipantUsername} timeout`;
			break;
		case GameEndReason.BLACK_TIMEOUT:
			gameResult = GameResult.WHITE_WON;
			gameResultExplanation = `${whiteParticipantUsername} won, ${blackParticipantUsername} timeout`;
			break;
		default:
			gameResult = GameResult.DRAW;
			gameResultExplanation = "Draw";
			break;
	}

	return { gameResult, gameResultExplanation };
};

/**
 * Get participant by color
 */
export const getParticipantByColor = (
	game: Game & {
		creator: GameParticipant & { user: User | null };
		opponent: (GameParticipant & { user: User | null }) | null;
	},
	color: "w" | "b",
): GameParticipant | null => {
	if (color === "w") {
		return game.isWhite === GameIsWhite.CREATOR ? game.creator : game.opponent;
	}
	return game.isWhite === GameIsWhite.CREATOR ? game.opponent : game.creator;
};
