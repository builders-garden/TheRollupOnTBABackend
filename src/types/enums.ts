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

export enum GameEndReason {
  CHECKMATE = "checkmate",
  RESIGNATION = "resignation",
  TIME_OUT = "time_out",
  AGREEMENT = "agreement",
  STALEMATE = "stalemate",
  THREEFOLD_REPETITION = "threefold_repetition",
  FIFTY_MOVE_RULE = "fifty_move_rule",
}

export enum SocketEvents {
  // client to server
  CREATE_GAME_REQUEST = "create_game_request",
  JOIN_GAME_REQUEST = "join_game_request",
  PAYMENT_CONFIRMED_REQUEST = "payment_confirmed_request",
  START_GAME_REQUEST = "start_game_request",
  PARTICIPANT_READY_REQUEST = "participant_ready_request",
  MOVE_PIECE_REQUEST = "move_piece_request",
  END_GAME_REQUEST = "end_game_request",
  // server to client
  CREATE_GAME_RESPONSE = "create_game_response",
  JOIN_GAME_RESPONSE = "join_game_response",
  PAYMENT_CONFIRMED = "payment_confirmed",
  PARTICIPANT_READY = "participant_ready",
  PARTICIPANT_LEFT = "participant_left",
  PARTICIPANT_JOINED = "participant_joined",
  START_GAME = "start_game",
  MOVE_PIECE = "move_piece",
  ACCEPT_GAME_END = "accept_game_end",
  GAME_ENDED = "game_ended",
  ERROR = "error",
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
