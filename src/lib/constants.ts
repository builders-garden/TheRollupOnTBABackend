import { GameMode, GameOption } from "@prisma/client";
import type { GameOptionDetails } from "../types";

export const GAME_OPTIONS: Record<
  GameMode,
  Partial<Record<GameOption, GameOptionDetails>>
> = {
  [GameMode.BULLET]: {
    [GameOption.BULLET_1]: {
      label: "1 minute",
      value: "1",
      duration: 60, // 60 seconds
      increase: 0,
    },
    [GameOption.BULLET_1_PLUS_1]: {
      label: "1 + 1",
      value: "1+1",
      duration: 60, // 60 seconds
      increase: 1, // 1 second per round
    },
    [GameOption.BULLET_2_PLUS_1]: {
      label: "2 + 1",
      value: "2+1",
      duration: 120, // 120 seconds
      increase: 1, // 1 second per round
    },
  },
  [GameMode.BLITZ]: {
    [GameOption.BLITZ_3]: {
      label: "3 min",
      value: "3",
      duration: 180, // 180 seconds
      increase: 0, // 0 second per round
    },
    [GameOption.BLITZ_3_PLUS_2]: {
      label: "3 + 2",
      value: "3+2",
      duration: 180, // 180 seconds
      increase: 2, // 2 second per round
    },
  },
  [GameMode.BLUNT]: {
    [GameOption.BLUNT_4_20]: {
      label: "4:20 min",
      value: "4:20",
      duration: 240, // 240 seconds
      increase: 0, // 0 second per round
    },
  },
  [GameMode.RAPID]: {
    [GameOption.RAPID_5]: {
      label: "5 min",
      value: "5",
      duration: 300, // 300 seconds
      increase: 0, // 0 second per round
    },
    [GameOption.RAPID_10]: {
      label: "10 min",
      value: "10",
      duration: 600, // 600 seconds
      increase: 0, // 0 second per round
    },
  },
};
