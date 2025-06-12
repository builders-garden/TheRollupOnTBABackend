import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import morganLogger from "morgan";
import cookieParserMiddleware from "cookie-parser";
import helmet from "helmet";
import { env } from "./config/env";

import http from "node:http";
import { Server as SocketIOServer } from "socket.io";

import responseMiddleware from "./middleware/response";
import { handleError, handleNotFound } from "./middleware/error.middleware";

import { setIOInstance } from "./lib/socket";
import {
  AcceptGameEndResponseHandler,
  DisconnectParticipantHandler,
  EndGameHandler,
  GameChatMessagesHandler,
  JoinGameHandler,
  MovePieceHandler,
  ParticipantReadyHandler,
  PaymentConfirmedHandler,
} from "./handlers";
import type {
  EndGameRequestEvent,
  JoinGameRequestEvent,
  MovePieceEvent,
  MessageSentEvent,
  ParticipantReadyEvent,
  AcceptGameEndResponseEvent,
  PaymentConfirmedEvent,
} from "./types";
import { baseOrigins, localOrigins } from "./lib/cors";
import { ClientToServerSocketEvents } from "./types/enums";

// Load environment variables
dotenv.config();

const app = express();

const allowedOrigins =
  env.NODE_ENV === "development"
    ? [...baseOrigins, ...localOrigins]
    : baseOrigins;

// Middleware
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  })
);
app.use(cookieParserMiddleware());
app.use(express.json());
app.use(helmet());
app.use(morganLogger("dev"));
app.use(responseMiddleware);

// Create HTTP server to attach socket.io
const httpServer = http.createServer(app);

// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    // credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
  },
});

// Set the Socket.IO instance
setIOInstance(io);

// Socket.IO connection logic
io.on("connection", (socket) => {
  console.log("0. client connected:", socket.id);

  // 1. Game creation request (done on nextjs backend)

  // 2. Game joining request
  socket.on(
    ClientToServerSocketEvents.JOIN_GAME_REQUEST,
    async (data: JoinGameRequestEvent) => {
      console.log("joining chess game:", data);
      const handler = new JoinGameHandler(socket, io);
      await handler.handle(data);
    }
  );

  // 2.b Payment Confirmed
  socket.on(
    ClientToServerSocketEvents.PAYMENT_CONFIRMED,
    async (data: PaymentConfirmedEvent) => {
      console.log("payment confirmed:", data);
      const handler = new PaymentConfirmedHandler(socket, io);
      await handler.handle(data);
    }
  );

  // 3. Game starting - Participant ready request
  socket.on(
    ClientToServerSocketEvents.PARTICIPANT_READY,
    async (data: ParticipantReadyEvent) => {
      console.log("participant ready:", data);
      const handler = new ParticipantReadyHandler(socket, io);
      await handler.handle(data);
    }
  );

  // 4. Start Game is a server to client event ==> no need to handle it here

  // 5. Game playing - Move piece event
  socket.on(
    ClientToServerSocketEvents.MOVE_PIECE,
    async (data: MovePieceEvent) => {
      console.log("move piece:", data);
      const handler = new MovePieceHandler(socket, io);
      await handler.handle(data);
    }
  );

  // 6. Game ending - End game request for both resign or draw
  socket.on(
    ClientToServerSocketEvents.END_GAME_REQUEST,
    async (data: EndGameRequestEvent) => {
      console.log("end game:", data);
      const handler = new EndGameHandler(socket, io);
      await handler.handle(data);
    }
  );

  // 6.b Game ending - Accept game end response (a client can accept or reject the request to draw)
  socket.on(
    ClientToServerSocketEvents.ACCEPT_GAME_END_RESPONSE,
    async (data: AcceptGameEndResponseEvent) => {
      console.log("accept game end response:", data);
      const handler = new AcceptGameEndResponseHandler(socket, io);
      await handler.handle(data);
    }
  );

  // Send message request
  socket.on(
    ClientToServerSocketEvents.MESSAGE_SENT,
    async (data: MessageSentEvent) => {
      console.log("send message:", data);
      const handler = new GameChatMessagesHandler(socket, io);
      await handler.handle(data);
    }
  );
  // disconnect
  socket.on("disconnect", async () => {
    console.log("user disconnected:", socket.id);
    const handler = new DisconnectParticipantHandler(socket, io);
    await handler.handle();
  });
});

// Health check route (unprotected)
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Use custom middlewares for handling 404 and errors
app.use(handleNotFound);
app.use(handleError);

// Start HTTP server (not app.listen anymore)
const port = env.PORT;
httpServer.listen(port, () => {
  console.log(`🚀 Server with WS enabled is running on port ${port}`);
});
