import type {
  User as DbUser,
  GameParticipant as DbGameParticipant,
  Bot as DbBot,
  Game as DbGame,
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
