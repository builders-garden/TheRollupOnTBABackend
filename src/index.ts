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
  CreateGameHandler,
  DisconnectParticipantHandler,
  EndGameHandler,
  MovePieceHandler,
  PaymentConfirmedHandler,
  StartGameHandler,
} from "./handlers";
import type {
  CreateGameRequest,
  EndGameRequest,
  JoinGameRequest,
  MovePieceRequest,
  PaymentConfirmedEvent,
  MessageSendRequest,
  StartGameEvent,
} from "./types";
import { baseOrigins, localOrigins } from "./lib/cors";
import { SocketEvents } from "./types/enums";
import { GameChatMessagesHandler } from "./handlers/game-chat-messages";

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

  // Create game request
  socket.on(
    SocketEvents.CREATE_GAME_REQUEST,
    async (data: CreateGameRequest) => {
      console.log("create game request:", data);
      const handler = new CreateGameHandler(socket, io);
      await handler.handle(data);
    }
  );

  // Join game request
  socket.on(SocketEvents.JOIN_GAME_REQUEST, async (data: JoinGameRequest) => {
    console.log("joining chess game:", data);
    socket.broadcast.emit("join-game-response", data);
  });

  // Payment confirmed request
  socket.on(
    SocketEvents.PAYMENT_CONFIRMED_REQUEST,
    async (data: PaymentConfirmedEvent) => {
      console.log("payment confirmed:", data);
      const handler = new PaymentConfirmedHandler(socket, io);
      await handler.handle(data);
    }
  );

  // Start game request
  socket.on(SocketEvents.START_GAME_REQUEST, async (data: StartGameEvent) => {
    console.log("start game:", data);
    const handler = new StartGameHandler(socket, io);
    await handler.handle(data);
  });

  // Move piece request
  socket.on(SocketEvents.MOVE_PIECE_REQUEST, async (data: MovePieceRequest) => {
    console.log("move piece:", data);
    const handler = new MovePieceHandler(socket, io);
    await handler.handle(data);
  });

  // End game request
  socket.on(SocketEvents.END_GAME_REQUEST, async (data: EndGameRequest) => {
    console.log("end game:", data);
    const handler = new EndGameHandler(socket, io);
    await handler.handle(data);
  });

  // Send message request
  socket.on(SocketEvents.MESSAGE_SEND, async (data: MessageSendRequest) => {
    console.log("send message:", data);
    const handler = new GameChatMessagesHandler(socket, io);
    await handler.handle(data);
  });
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
