import { PopupPositions, ServerToClientSocketEvents } from "../enums";

export type StreamJoinedEvent = {
  username: string;
  profilePicture: string;
};

export type TipReceivedEvent = {
  position: PopupPositions;
  username: string;
  profilePicture: string;
  tipAmount: string;
};

export type TokenTradeEvent = {
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

export type VoteReceivedEvent = {
  position: PopupPositions;
  username: string;
  profilePicture: string;
  voteAmount: string;
  isBull: boolean;
  promptId: string;
};

export type ErrorEvent = {
  code: number;
  message: string;
};

export type PollNotificationEvent = {
  id: string;
  pollQuestion: string;
  endTime: Date;
  votes: number;
  voters: number;
  qrCodeUrl: string;
  position: PopupPositions;
  results?: {
    bullPercent: number;
    bearPercent: number;
  };
};

export type EndPollNotificationEvent = {
  id: string;
  pollQuestion: string;
  endTime: Date;
  votes: number;
  voters: number;
  qrCodeUrl: string;
  position: PopupPositions;
  results?: {
    bullPercent: number;
    bearPercent: number;
  };
};
export type UpdatePollNotificationEvent = {
  id: string;
  endTime: Date;
  position: PopupPositions;
  voters: number;
  votes: number;
  results?: {
    bullPercent: number;
    bearPercent: number;
  };
};

export type ServerToClientEvents = {
  [ServerToClientSocketEvents.STREAM_JOINED]: StreamJoinedEvent;
  [ServerToClientSocketEvents.ERROR]: ErrorEvent;
  [ServerToClientSocketEvents.TIP_RECEIVED]: TipReceivedEvent;
  [ServerToClientSocketEvents.TOKEN_TRADED]: TokenTradeEvent;
  [ServerToClientSocketEvents.VOTE_RECEIVED]: VoteReceivedEvent;
  [ServerToClientSocketEvents.START_SENTIMENT_POLL]: PollNotificationEvent;
  [ServerToClientSocketEvents.END_SENTIMENT_POLL]: EndPollNotificationEvent;
  [ServerToClientSocketEvents.UPDATE_SENTIMENT_POLL]: UpdatePollNotificationEvent;
  [ServerToClientSocketEvents.ERROR]: ErrorEvent;
};
