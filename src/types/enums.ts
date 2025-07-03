// client to server
export enum ClientToServerSocketEvents {
	// 1. create game (done on nextjs backend)
	JOIN_GAME_REQUEST = "join_game_request", // 2. join game
	PAYMENT_CONFIRMED = "payment_confirmed", // 3. payment confirmed
	PARTICIPANT_READY = "participant_ready", // 5. participant ready
	PARTICIPANT_NOT_READY = "participant_not_ready", // 5.b participant not ready (revoke ready state)
	MOVE_PIECE = "move_piece", // 6. move piece
	END_GAME_REQUEST = "end_game_request", // 7. end game (resign or request draw)
	ACCEPT_GAME_END_RESPONSE = "accept_game_end_response", // 8. accept game end response
	DELETE_GAME_REQUEST = "delete_game_request", // 9. delete game (creator only)
	MESSAGE_SENT = "message_sent", // 10. message sent (text, image or tip)
	SPECTATOR_JOIN = "spectator_join", // 11. spectator join
	RESET_GAME_REQUEST = "reset_game_request", // 12. reset game request (dev only)
	// matchmaking
	JOIN_MATCHMAKING_QUEUE = "join_matchmaking_queue", // 13. join matchmaking queue
	LEAVE_MATCHMAKING_QUEUE = "leave_matchmaking_queue", // 14. leave matchmaking queue
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
	ACCEPT_GAME_END = "accept_game_end", // 8. end game: participant accept or reject game end request
	GAME_END_ACK = "game_end_ack", // 8.a end game: immediate acknowledgment for game end request
	GAME_ENDED = "game_ended", // 8.b end game: final game ended event with complete data
	GAME_DELETED = "game_deleted", // 8.c game deleted
	RESUME_GAME = "resume_game", // 8.d resume game (draw rejected)
	// extra
	MESSAGE_SENT_ACK = "message_sent_ack", // 12. message sent acknowledged
	SPECTATOR_JOIN_ACK = "spectator_join_ack", // 13. spectator join acknowledged
	// timer events
	TIMER_UPDATE = "timer_update", // 14. timer update (1-second intervals)
	TIMER_EXPIRED = "timer_expired", // 15. timer expired (timeout)
	// matchmaking
	QUEUE_STATUS_UPDATE = "queue_status_update", // 16. queue status update
	MATCH_FOUND = "match_found", // 17. match found
	QUEUE_JOINED = "queue_joined", // 18. successfully joined queue
	QUEUE_LEFT = "queue_left", // 19. successfully left queue
	// other
	ERROR = "error", // 20. error
	BANNED = "banned", // 21. user found cheating ==> banned
	RESET_GAME = "reset_game", // 22. reset game (dev only)
	// notifications
	IN_APP_NOTIFICATION = "in_app_notification", // 23. in-app notification for all online players
}
