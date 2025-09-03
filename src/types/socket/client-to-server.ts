
import { ClientToServerSocketEvents } from "../enums";

export type JoinStreamEvent = {
  username: string;
  profilePicture: string;
};

export type TipSentEvent = {
  username: string;
  profilePicture: string;
  tipAmount: string;
};

export type TokenTradedEvent = {
  username: string;
  profilePicture: string;
  tokenInAmount: string;
  tokenInName: string;
  tokenInDecimals: number;
  tokenInImageUrl: string;
  tokenOutAmount: string;
  tokenOutDecimals: number;
  tokenOutName: string;
  tokenOutImageUrl: string;
};

export type VoteCastedEvent = {
  username: string;
  profilePicture: string;
  voteAmount: string;
  isBull: boolean;
  promptId: string;
};

export type ClientToServerEvents = {
  [ClientToServerSocketEvents.JOIN_STREAM]: JoinStreamEvent;
  [ClientToServerSocketEvents.TIP_SENT]: TipSentEvent;
  [ClientToServerSocketEvents.TOKEN_TRADED]: TokenTradedEvent;
  [ClientToServerSocketEvents.VOTE_CASTED]: VoteCastedEvent;
};
