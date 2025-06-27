import type {
	Bot as DbBot,
	Game as DbGame,
	GameParticipant as DbGameParticipant,
	User as DbUser,
	UserStatistics,
} from "@prisma/client";

export type User = DbUser & {
	statistics: UserStatistics | null;
};

export type GameParticipant = DbGameParticipant & {
	user?: User | null;
	bot?: DbBot | null;
};

export type Game = DbGame & {
	creator: GameParticipant;
	opponent?: GameParticipant | null;
};
