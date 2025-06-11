export enum GameStatus {
  REQUESTED = "Requested",
  CREATED = "Created",
  LIVE = "Live",
  FINISHED = "Finished",
}

export enum GameMode {
  BULLET = "bullet",
  BLITZ = "blitz",
  BLUNT = "blunt",
  RAPID = "rapid",
}

export enum GameOption {
  BULLET_1 = "bullet_1",
  BULLET_1_PLUS_1 = "bullet_1_plus_1",
  BULLET_2_PLUS_1 = "bullet_2_plus_1",
  BLITZ_3 = "blitz_3",
  BLITZ_3_PLUS_2 = "blitz_3_plus_2",
  BLUNT_4_20 = "blunt_4_20",
  RAPID_5 = "rapid_5",
  RAPID_10 = "rapid_10",
}

export enum PaymentStatus {
  STARTED = "started",
  COMPLETED = "completed",
  BOUNCED = "bounced",
}

// client to server
export enum ClientToServerSocketEvents {
  CREATE_GAME_REQUEST = "create_game_request", // 1. create game
  JOIN_GAME_REQUEST = "join_game_request", // 2. join game
  PAYMENT_CONFIRMED = "payment_confirmed", // 3. payment confirmed
  PARTICIPANT_READY = "participant_ready", // 5. participant ready
  MOVE_PIECE = "move_piece", // 6. move piece
  END_GAME_REQUEST = "end_game_request", // 7. end game (resign or request draw)
  ACCEPT_GAME_END_RESPONSE = "accept_game_end_response", // 8. accept game end response
  MESSAGE_SENT = "message_sent", // 9. message sent (text, image or tip)
  SPECTATOR_JOIN = "spectator_join", // 10. spectator join
}

// server to client
export enum ServerToClientSocketEvents {
  CREATE_GAME_RESPONSE = "create_game_response", // 1. create game
  JOIN_GAME_RESPONSE = "join_game_response", // 2. join game
  PAYMENT_CONFIRMED_ACK = "payment_confirmed_ack", // 2.b payment confirmed acknowledged
  PARTICIPANT_READY_ACK = "participant_ready_ack", // 3. participant ready acknowledged
  START_GAME = "start_game", // 4. start game
  PARTICIPANT_LEFT = "participant_left", // 5. participant left
  PARTICIPANT_JOINED = "participant_joined", // 6. participant joined
  MOVE_PIECE_ACK = "move_piece_ack", // 7. move piece acknowledged
  ACCEPT_GAME_END = "accept_game_end", // 8. accept game end (ask other player to accept draw)
  GAME_ENDED = "game_ended", // 9. game ended (either via resign or draw request accepted)
  RESUME_GAME = "resume_game", // 10. resume game (after draw request rejected)
  // extra
  MESSAGE_SENT_ACK = "message_sent_ack", // 11. message sent acknowledged
  SPECTATOR_JOIN_ACK = "spectator_join_ack", // 12. spectator join acknowledged
  // other
  ERROR = "error", // 13. error
  BANNED = "banned", // 14. user found cheating ==> banned
}

export const GAME_MODE_OPTIONS = {
  [GameMode.BULLET]: [
    {
      label: "1 minute",
      value: "1",
      duration: 60, // 60 seconds
      increase: 0,
      mode: GameMode.BULLET,
    },
    {
      label: "1 + 1",
      value: "1+1",
      duration: 60, // 60 seconds
      increase: 1, // 1 second per round
      mode: GameMode.BULLET,
    },
    {
      label: "2 + 1",
      value: "2+1",
      duration: 120, // 120 seconds
      increase: 1, // 1 second per round
      mode: GameMode.BULLET,
    },
  ],
  [GameMode.BLITZ]: [
    {
      label: "3 min",
      value: "3",
      duration: 180, // 180 seconds
      increase: 0, // 0 second per round
      mode: GameMode.BLITZ,
    },
    {
      label: "3 + 2",
      value: "3+2",
      duration: 180, // 180 seconds
      increase: 2, // 2 second per round
      mode: GameMode.BLITZ,
    },
  ],
  [GameMode.BLUNT]: [
    {
      label: "4:20 min",
      value: "4:20",
      duration: 240, // 240 seconds
      increase: 0, // 0 second per round
      mode: GameMode.BLUNT,
    },
  ],
  [GameMode.RAPID]: [
    {
      label: "5 min",
      value: "5",
      duration: 300, // 300 seconds
      increase: 0, // 0 second per round
      mode: GameMode.RAPID,
    },
    {
      label: "10 min",
      value: "10",
      duration: 600, // 600 seconds
      increase: 0, // 0 second per round
      mode: GameMode.RAPID,
    },
  ],
};
