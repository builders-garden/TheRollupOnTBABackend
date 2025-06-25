// client to server
export enum ClientToServerSocketEvents {
  // 1. create game (done on nextjs backend)
  JOIN_GAME_REQUEST = "join_game_request", // 2. join game
  PAYMENT_CONFIRMED = "payment_confirmed", // 3. payment confirmed
  PARTICIPANT_READY = "participant_ready", // 5. participant ready
  MOVE_PIECE = "move_piece", // 6. move piece
  END_GAME_REQUEST = "end_game_request", // 7. end game (resign or request draw)
  ACCEPT_GAME_END_RESPONSE = "accept_game_end_response", // 8. accept game end response
  MESSAGE_SENT = "message_sent", // 9. message sent (text, image or tip)
  SPECTATOR_JOIN = "spectator_join", // 10. spectator join
  RESET_GAME_REQUEST = "reset_game_request", // 11. reset game request (dev only)
  // matchmaking
  JOIN_MATCHMAKING_QUEUE = "join_matchmaking_queue", // 12. join matchmaking queue
  LEAVE_MATCHMAKING_QUEUE = "leave_matchmaking_queue", // 13. leave matchmaking queue
}

// server to client
export enum ServerToClientSocketEvents {
  // 1. create game (done on nextjs backend)
  JOIN_GAME_RESPONSE = "join_game_response", // 2. join game
  PAYMENT_CONFIRMED_ACK = "payment_confirmed_ack", // 2.b payment confirmed acknowledged
  PARTICIPANT_READY_ACK = "participant_ready_ack", // 3. participant ready acknowledged
  START_GAME = "start_game", // 4. start game
  PARTICIPANT_LEFT = "participant_left", // 5. participant left
  PARTICIPANT_JOINED = "participant_joined", // 6. participant joined
  MOVE_PIECE_ACK = "move_piece_ack", // 7. move piece acknowledged
  MOVE_PIECE_ERROR = "move_piece_error", // 7.b move piece error
  ACCEPT_GAME_END = "accept_game_end", // 8. accept game end (ask other player to accept draw)
  GAME_ENDED = "game_ended", // 9. game ended (either via resign or draw request accepted)
  RESUME_GAME = "resume_game", // 10. resume game (after draw request rejected)
  // extra
  MESSAGE_SENT_ACK = "message_sent_ack", // 11. message sent acknowledged
  SPECTATOR_JOIN_ACK = "spectator_join_ack", // 12. spectator join acknowledged
  // timer events
  TIMER_UPDATE = "timer_update", // 13. timer update (1-second intervals)
  TIMER_EXPIRED = "timer_expired", // 14. timer expired (timeout)
  // matchmaking
  QUEUE_STATUS_UPDATE = "queue_status_update", // 15. queue status update
  MATCH_FOUND = "match_found", // 16. match found
  QUEUE_JOINED = "queue_joined", // 17. successfully joined queue
  QUEUE_LEFT = "queue_left", // 18. successfully left queue
  // other
  ERROR = "error", // 19. error
  BANNED = "banned", // 20. user found cheating ==> banned
  RESET_GAME = "reset_game", // 21. reset game (dev only)
}
