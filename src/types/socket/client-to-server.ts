import { ClientToServerSocketEvents, PopupPositions } from "../enums";
import { Guest } from "../poll.type";

export type JoinStreamEvent = {
  username: string;
  profilePicture: string;
};

export type TipSentEvent = {
  position: PopupPositions;
  username: string;
  profilePicture: string;
  tipAmount: string;
};

export type TokenTradedEvent = {
  position: PopupPositions;
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
  position: PopupPositions;
  username: string;
  profilePicture: string;
  voteAmount: string;
  isBull: boolean;
  promptId: string;
  endTimeMs: number;
};

export type StartSentimentPollEvent = {
  id: string;
  position: PopupPositions;
  //username: string;
  //profilePicture: string;
  pollQuestion: string;
  endTimeMs: number;
  guests: Guest[];
  results: { bullPercent: number; bearPercent: number };
};

export type EndSentimentPollEvent = {
  id: string;
  votes: number;
  voters: number;
  results: { bullPercent: number; bearPercent: number };
};

export type UpdateSentimentPollEvent = {
  id: string;
  position: PopupPositions;
  endTimeMs: number;
  voters: number;
  votes: number;
  results: { bullPercent: number; bearPercent: number };
};

export type ClientToServerEvents = {
  [ClientToServerSocketEvents.JOIN_STREAM]: JoinStreamEvent;
  [ClientToServerSocketEvents.TIP_SENT]: TipSentEvent;
  [ClientToServerSocketEvents.TOKEN_TRADED]: TokenTradedEvent;
  [ClientToServerSocketEvents.VOTE_CASTED]: VoteCastedEvent;
  [ClientToServerSocketEvents.START_SENTIMENT_POLL]: StartSentimentPollEvent;
  [ClientToServerSocketEvents.END_SENTIMENT_POLL]: EndSentimentPollEvent;
  [ClientToServerSocketEvents.UPDATE_SENTIMENT_POLL]: UpdateSentimentPollEvent;
};
