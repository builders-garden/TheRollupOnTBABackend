import { GameMode, GameOption } from "@prisma/client";
import { GAME_OPTIONS } from "./constants";

export const getGameOptionTime = (mode: GameMode, option: GameOption) => {
  try {
    const data = GAME_OPTIONS[mode]?.[option];
    if (!data) {
      throw new Error(
        `Duration not found for mode: ${mode} and option: ${option}`
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
