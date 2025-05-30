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
  MovePieceEvent,
  PaymentConfirmedEvent,
  StartGameEvent,
} from "./types";
import { baseOrigins } from "./lib/cors";

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(cookieParserMiddleware());
app.use(express.json());
app.use(helmet());
app.use(morganLogger("dev"));
app.use(responseMiddleware);

// Create HTTP server to attach socket.io
const httpServer = http.createServer(app);
const allowedOrigins =
  env.NODE_ENV === "development"
    ? [...baseOrigins, "http://localhost:3000"]
    : baseOrigins;

// Initialize Socket.IO server
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Set the Socket.IO instance
setIOInstance(io);

// Socket.IO connection logic
io.on("connection", (socket) => {
  console.log("0. client connected:", socket.id);

  socket.on("create-game-request", async (data: CreateGameRequest) => {
    console.log("create game request:", data);
    const handler = new CreateGameHandler(socket, io);
    await handler.handle(data);
  });

  socket.on("join_game_request", async (data: JoinGameRequest) => {
    console.log("joining chess game:", data);
    socket.broadcast.emit("join-game-response", data);
  });

  socket.on("payment_confirmed", async (data: PaymentConfirmedEvent) => {
    console.log("payment confirmed:", data);
    const handler = new PaymentConfirmedHandler(socket, io);
    await handler.handle(data);
  });

  socket.on("start_game", async (data: StartGameEvent) => {
    console.log("start game:", data);
    const handler = new StartGameHandler(socket, io);
    await handler.handle(data);
  });

  socket.on("move_piece_request", async (data: MovePieceEvent) => {
    console.log("move piece:", data);
    const handler = new MovePieceHandler(socket, io);
    await handler.handle(data);
  });

  socket.on("end_game_request", async (data: EndGameRequest) => {
    console.log("end game:", data);
    const handler = new EndGameHandler(socket, io);
    await handler.handle(data);
  });

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
