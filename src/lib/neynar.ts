import { env } from "../config/env";

export interface NeynarUser {
  fid: string;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
    primary: {
      eth_address: string | null;
      sol_address: string | null;
    };
  };
}

type NeynarResponse = {
  users: NeynarUser[];
};

export const fetchUsers = async (fids: string[]): Promise<NeynarUser[]> => {
  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fids.join(",")}`,
    {
      headers: {
        "x-api-key": env.NEYNAR_API_KEY,
      },
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to fetch Farcaster user on Neynar: ${JSON.stringify(errorData)}`
    );
  }

  const data = (await response.json()) as NeynarResponse;

  if (!data.users?.[0]) {
    throw new Error("No user found in Neynar response");
  }

  return data.users;
};
