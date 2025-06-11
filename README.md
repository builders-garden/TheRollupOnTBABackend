# Checkmates Service

A Node.js TypeScript service implementing Express API and websocket server.

## Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (for database)
- npm or yarn

## Setup

1. Clone the repository:

```bash
git clone <repository-url> checkmates-backend
cd checkmates-backend
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:

   - Copy `.env.example` to `.env`
   - Update the following variables in `.env`:
     - `DATABASE_URL`: Your PostgreSQL connection string
     - `DIRECT_URL`: Direct PostgreSQL connection string (same as DATABASE_URL)
     - `NEYNAR_API_KEY`: Your Neynar API key
     - `APP_URL`: Your application's public URL
     - Other variables can be left as default for local development


## Development

Run the development server with hot reload:

```bash
pnpm run dev
```

The server will start on `http://localhost:3000` by default.

## Production

Build and start the production server:

```bash
pnpm run build

# Start the server
pnpm run start
```

## Available Scripts

- `pnpm run dev`: Start development server with hot reload
- `pnpm run build`: Build the TypeScript code
- `pnpm run start`: Start the production server
- `pnpm run lint`: Run ESLint

## Project Structure

```
src/
  ├── index.ts          # Application entry point
  ├── routes/           # API routes
  ├── controllers/      # Route controllers
  ├── services/         # Business logic
  └── types/            # TypeScript type definitions
```

## Environment Variables

Key environment variables that need to be configured:

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `API_SECRET_KEY`: Secret key for API authentication (min 32 characters)
- `DATABASE_URL`: PostgreSQL connection string
- `DIRECT_URL`: Direct PostgreSQL connection string
- `NEYNAR_API_KEY`: Your Neynar API key
- `APP_URL`: Your application's public URL

## API Authentication

All API endpoints (except `/health`) require authentication using an API secret key. To make authenticated requests:

1. Set the `API_SECRET_KEY` in your environment variables
2. Include the secret key in your requests using the `x-api-secret` header:

```bash
curl -X POST http://localhost:3000/api/notifications \
  -H "x-api-secret: your-secret-key-here" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "text": "Message"}'
```

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## License

See [LICENSE.md](./LICENSE.md)


# Websocket Events

Explanation of the websocket events based on the flow of the game.

## 1. Game Creation

## 1.a Against a friend

- `create_game_request`: Client sends a request to create a game with an opponent
- `create_game_response`: Server sends a response to the client with the game id and status.
- The client now can share the game id with the opponent through the app, either via a DC or a public cast.
- if the opponent has the miniapp saved, he will receive a notification to join the game.


## 1.b Against a random opponent

- TBD


## 2. Game Joining

Once an opponent joins the game, it sends a `JoinGameRequest` to the server.

- `join_game_request`: Client sends a request to join a game.
- `join_game_response`: Server sends a response to the client with the game id and status.
- `payment_confirmed`: The opponent send this once he has paid the requested amount to join the game.
- `payment_confirmed_ack`: Once the payment is confirmed, the server sends a `payment_confirmed_ack` to the client.
- The client now can start the game.

## 3. Game Starting

- `participant_ready`: Client sends a request to indicate that the participant is ready to start the game.
- `participant_ready_ack`: Server sends a response to the client with the game id and status.


## 4. Start Game

- `start_game`: Once all the participants are ready, the server sends a `start_game` to the client with the game id and status.

## 5. Game Playing

- `move_piece`: Client sends a request to move a piece.
- `move_piece_ack`: Server sends a response to the client with the move.
- The server now can update the game board and check if the move is valid.
- if the move is valid, the server sends a `move_piece_ack` to the client with the move.
- if the move is invalid, the server sends a `error` to the client with the error message and a request to undo the move on the client side.
- if the game is at an end state, the server sends a `game_ended` to the client with the game id and end game reason.

## 6. Game Ending

Any participant can end the game, either by resigning or by requesting a draw.

### 6.a Resigning

- `end_game_request`: Client sends a request to end the game.
- `game_ended`: Server sends a response to all participants with the game id and status.
- The server now can update the game board and check if the game is ended.

### 6.b Requesting a Draw

- `end_game_request`: Client sends a request to end the game with **COLOR_REQUESTED_DRAW** as reason.
- `accept_game_end`: The server sends this message to the other participant with the game id and status.
- `accept_game_end_response`: The other participant answer back, either accepting or rejecting the draw request.
- if the other participant accepts the draw request, the server sends a `game_ended` to the other participant with the game id and status.
- if the other participant rejects the draw request, the server sends a `resume_game` to the client with the game id and status telling all the players to resume the game.


## 7. Game Paused

If a user disconnects (close app, drop connection, etc.), the game continues up to the participant remaining time.

- `participant_left`: The server notifies the client that the opponent left the game.
- `participant_joined`: The server notifies the client that the opponent joined the game.

## Extras

### 8. Messages

Any user watching or playing a game can send messages to the game chat.
A message can be a text, an image or a tip.

- `message_sent`: Client sends a request to send a message to the game chat.
- `message_sent_ack`: Server sends a response to the client with the message.

### 9. Spectators

Spectators can join a game to watch the game.

- `spectator_join`: Client sends a request to join a game as a spectator.
- `spectator_join_ack`: Server sends a response to the client with the game id and status.
- The client now can watch the game.

## Other
### 10. Errors

There can be errors in the game moves, or in the update to db state or in the backend logic:

- `error`: The server sends a response to the client with the error message.
- The client now can undo the move on the client side.

### 11. Banned

If a client tries to impersonate another user, the server will send a `Banned` event to the client with the cheating message.

- `banned`: The server sends a response to the client with the cheating message.
- The client now can undo the move on the client side.
