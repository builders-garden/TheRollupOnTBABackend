import type { GameMode, GameOption } from "@prisma/client";
import { GAME_OPTIONS } from "./constants";

export const getGameOptionTime = (mode: GameMode, option: GameOption) => {
  const data = GAME_OPTIONS[mode]?.[option];
  if (!data) {
    throw new Error(
      `Duration not found for mode: ${mode} and option: ${option}`
    );
  }

  return { duration: data.duration, increase: data.increase };
};
