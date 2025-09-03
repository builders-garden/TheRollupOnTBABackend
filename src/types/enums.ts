// client to server
export enum ClientToServerSocketEvents {
  TIP_SENT = "tip_sent", 
  TOKEN_TRADED = "token_traded",
  VOTE_CASTED = "vote_casted", 
  JOIN_STREAM = "stream_joined",
}

// server to client
export enum ServerToClientSocketEvents {
  TIP_RECEIVED = "tip_received",
  VOTE_RECEIVED = "vote_received", 
  TOKEN_TRADED = "token_traded", 
  STREAM_JOINED = "stream_joined",
  ERROR = "error",
}
