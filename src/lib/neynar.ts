import { env } from "../config/env";
import type { NeynarUser } from "../types/neynar";

export const fetchUserFromNeynar = async (fid: number): Promise<NeynarUser> => {
  const data = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        "x-api-key": env.NEYNAR_API_KEY,
      },
    }
  ).then((res) => res.json() as Promise<{ users: NeynarUser[] }>);

  return data.users[0];
};
